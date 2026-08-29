#![cfg(test)]
extern crate std;

use super::*;
use soroban_sdk::{
    symbol_short,
    testutils::{Address as _, Events, Ledger},
    token::{self, StellarAssetClient},
    vec, Address, Env, IntoVal,
};

const NOW: u64 = 1_000_000;
const GOAL: i128 = 1_000_000_000; // 100 XLM in stroops
const DAY: u64 = 86_400;
const YEAR: u64 = 365 * DAY;

struct Ctx<'a> {
    env: Env,
    contract_id: Address,
    client: CrowdfundClient<'a>,
    token: token::Client<'a>,
    mint: StellarAssetClient<'a>,
}

fn setup() -> Ctx<'static> {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|l| l.timestamp = NOW);

    let token_address = env
        .register_stellar_asset_contract_v2(Address::generate(&env))
        .address();
    let contract_id = env.register(Crowdfund, ());

    let token = token::Client::new(&env, &token_address);
    let mint = StellarAssetClient::new(&env, &token_address);
    let client = CrowdfundClient::new(&env, &contract_id);
    client.initialize(&Address::generate(&env), &token_address);

    Ctx {
        env,
        contract_id,
        client,
        token,
        mint,
    }
}

fn set_time(ctx: &Ctx, timestamp: u64) {
    ctx.env.ledger().with_mut(|l| l.timestamp = timestamp);
}

// ---------- initialize ----------

#[test]
fn initialize_only_once() {
    let ctx = setup();
    let admin = Address::generate(&ctx.env);
    let other = ctx
        .env
        .register_stellar_asset_contract_v2(Address::generate(&ctx.env))
        .address();
    assert_eq!(
        ctx.client.try_initialize(&admin, &other),
        Err(Ok(Error::AlreadyInitialized))
    );
}

#[test]
fn initialize_requires_admin_authorization() {
    let env = Env::default();
    env.ledger().with_mut(|l| l.timestamp = NOW);
    let token_address = env
        .register_stellar_asset_contract_v2(Address::generate(&env))
        .address();
    let contract_id = env.register(Crowdfund, ());
    let client = CrowdfundClient::new(&env, &contract_id);

    // no mock_all_auths: an unsigned initialize must be rejected
    let admin = Address::generate(&env);
    assert!(client.try_initialize(&admin, &token_address).is_err());
}

#[test]
fn calls_before_initialize_fail() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Crowdfund, ());
    let client = CrowdfundClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let donor = Address::generate(&env);
    let id = client.create_campaign(&creator, &GOAL, &(NOW + DAY));
    assert_eq!(
        client.try_donate(&donor, &id, &100),
        Err(Ok(Error::NotInitialized))
    );
}

// ---------- create_campaign ----------

#[test]
fn create_campaign_validates_inputs() {
    let ctx = setup();
    let creator = Address::generate(&ctx.env);

    assert_eq!(
        ctx.client.try_create_campaign(&creator, &0, &(NOW + DAY)),
        Err(Ok(Error::InvalidGoal))
    );
    assert_eq!(
        ctx.client.try_create_campaign(&creator, &GOAL, &NOW),
        Err(Ok(Error::InvalidDeadline))
    );
    assert_eq!(
        ctx.client.try_create_campaign(&creator, &GOAL, &(NOW - 1)),
        Err(Ok(Error::InvalidDeadline))
    );
}

#[test]
fn create_campaign_bounds_duration() {
    let ctx = setup();
    let creator = Address::generate(&ctx.env);

    // 366 days out is beyond the maximum campaign duration
    assert_eq!(
        ctx.client
            .try_create_campaign(&creator, &GOAL, &(NOW + YEAR + DAY)),
        Err(Ok(Error::DeadlineTooFar))
    );

    // exactly the cap is accepted
    let id = ctx.client.create_campaign(&creator, &GOAL, &(NOW + YEAR));
    assert_eq!(ctx.client.get_campaign(&id).unwrap().deadline, NOW + YEAR);
}

#[test]
fn create_campaign_assigns_sequential_ids_and_state() {
    let ctx = setup();
    let creator = Address::generate(&ctx.env);

    let id1 = ctx.client.create_campaign(&creator, &GOAL, &(NOW + DAY));
    let id2 = ctx
        .client
        .create_campaign(&creator, &(GOAL * 2), &(NOW + DAY));
    assert_eq!((id1, id2), (1, 2));

    let campaign = ctx.client.get_campaign(&id1).unwrap();
    assert_eq!(campaign.creator, creator);
    assert_eq!(campaign.goal, GOAL);
    assert_eq!(campaign.deadline, NOW + DAY);
    assert_eq!(campaign.raised, 0);
    assert!(!campaign.withdrawn);

    assert_eq!(ctx.client.get_campaign(&999), None);
}

// ---------- TTL math ----------

#[test]
fn ledgers_until_handles_boundaries() {
    assert_eq!(ledgers_until(100, 100), 0);
    assert_eq!(ledgers_until(100, 99), 0); // target in the past
    assert_eq!(ledgers_until(100, 104), 0); // less than one ledger
    assert_eq!(ledgers_until(100, 105), 1);
    assert_eq!(ledgers_until(0, YEAR), (YEAR / 5) as u32);
    // overflow of the u32 window saturates instead of panicking
    assert_eq!(ledgers_until(0, u64::MAX), u32::MAX);
}

// ---------- donate ----------

#[test]
fn donate_moves_funds_into_escrow() {
    let ctx = setup();
    let creator = Address::generate(&ctx.env);
    let donor = Address::generate(&ctx.env);
    let id = ctx.client.create_campaign(&creator, &GOAL, &(NOW + DAY));
    ctx.mint.mint(&donor, &500);

    ctx.client.donate(&donor, &id, &300);

    assert_eq!(ctx.token.balance(&donor), 200);
    assert_eq!(ctx.token.balance(&ctx.contract_id), 300);
    let campaign = ctx.client.get_campaign(&id).unwrap();
    assert_eq!(campaign.raised, 300);
    assert_eq!(ctx.client.get_donation(&donor, &id), 300);

    // second donation accumulates
    ctx.client.donate(&donor, &id, &100);
    assert_eq!(ctx.token.balance(&ctx.contract_id), 400);
    assert_eq!(ctx.client.get_donation(&donor, &id), 400);
}

#[test]
fn donate_rejects_invalid_input() {
    let ctx = setup();
    let creator = Address::generate(&ctx.env);
    let donor = Address::generate(&ctx.env);
    let id = ctx.client.create_campaign(&creator, &GOAL, &(NOW + DAY));
    ctx.mint.mint(&donor, &500);

    assert_eq!(
        ctx.client.try_donate(&donor, &id, &0),
        Err(Ok(Error::InvalidAmount))
    );
    assert_eq!(
        ctx.client.try_donate(&donor, &id, &-5),
        Err(Ok(Error::InvalidAmount))
    );
    assert_eq!(
        ctx.client.try_donate(&donor, &42, &100),
        Err(Ok(Error::CampaignNotFound))
    );
}

#[test]
fn donate_rejects_after_deadline() {
    let ctx = setup();
    let creator = Address::generate(&ctx.env);
    let donor = Address::generate(&ctx.env);
    let id = ctx.client.create_campaign(&creator, &GOAL, &(NOW + DAY));
    ctx.mint.mint(&donor, &500);

    set_time(&ctx, NOW + DAY);
    assert_eq!(
        ctx.client.try_donate(&donor, &id, &100),
        Err(Ok(Error::DeadlinePassed))
    );
}

#[test]
fn donate_rejects_withdrawn_campaign() {
    let ctx = setup();
    let creator = Address::generate(&ctx.env);
    let donor = Address::generate(&ctx.env);
    let id = ctx.client.create_campaign(&creator, &GOAL, &(NOW + DAY));
    ctx.mint.mint(&donor, &(GOAL * 2));

    ctx.client.donate(&donor, &id, &GOAL);
    ctx.client.withdraw(&creator, &id);

    assert_eq!(
        ctx.client.try_donate(&donor, &id, &100),
        Err(Ok(Error::AlreadyWithdrawn))
    );
}

// ---------- withdraw ----------

#[test]
fn withdraw_pays_creator_once_goal_reached() {
    let ctx = setup();
    let creator = Address::generate(&ctx.env);
    let donor = Address::generate(&ctx.env);
    let id = ctx.client.create_campaign(&creator, &GOAL, &(NOW + DAY));
    ctx.mint.mint(&donor, &GOAL);

    ctx.client.donate(&donor, &id, &GOAL);
    ctx.client.withdraw(&creator, &id);

    assert_eq!(ctx.token.balance(&creator), GOAL);
    assert_eq!(ctx.token.balance(&ctx.contract_id), 0);
    assert!(ctx.client.get_campaign(&id).unwrap().withdrawn);

    assert_eq!(
        ctx.client.try_withdraw(&creator, &id),
        Err(Ok(Error::AlreadyWithdrawn))
    );
}

#[test]
fn withdraw_enforces_rules() {
    let ctx = setup();
    let creator = Address::generate(&ctx.env);
    let stranger = Address::generate(&ctx.env);
    let donor = Address::generate(&ctx.env);
    let id = ctx.client.create_campaign(&creator, &GOAL, &(NOW + DAY));
    ctx.mint.mint(&donor, &GOAL);

    // below goal
    ctx.client.donate(&donor, &id, &(GOAL / 2));
    assert_eq!(
        ctx.client.try_withdraw(&creator, &id),
        Err(Ok(Error::GoalNotReached))
    );

    // wrong caller
    ctx.client.donate(&donor, &id, &(GOAL / 2));
    assert_eq!(
        ctx.client.try_withdraw(&stranger, &id),
        Err(Ok(Error::NotCreator))
    );

    // missing campaign
    assert_eq!(
        ctx.client.try_withdraw(&creator, &42),
        Err(Ok(Error::CampaignNotFound))
    );
}

// ---------- claim_refund ----------

#[test]
fn refund_returns_full_contribution_after_failed_campaign() {
    let ctx = setup();
    let creator = Address::generate(&ctx.env);
    let donor = Address::generate(&ctx.env);
    let id = ctx.client.create_campaign(&creator, &GOAL, &(NOW + DAY));
    ctx.mint.mint(&donor, &400);

    ctx.client.donate(&donor, &id, &300);
    assert_eq!(ctx.token.balance(&donor), 100);

    // refund blocked while campaign is active
    assert_eq!(
        ctx.client.try_claim_refund(&donor, &id),
        Err(Ok(Error::CampaignStillActive))
    );

    set_time(&ctx, NOW + DAY + 1);
    ctx.client.claim_refund(&donor, &id);

    assert_eq!(ctx.token.balance(&donor), 400);
    assert_eq!(ctx.token.balance(&ctx.contract_id), 0);
    assert_eq!(ctx.client.get_donation(&donor, &id), 0);

    // second claim finds no remaining donation
    assert_eq!(
        ctx.client.try_claim_refund(&donor, &id),
        Err(Ok(Error::NoDonation))
    );
}

#[test]
fn refund_rules() {
    let ctx = setup();
    let creator = Address::generate(&ctx.env);
    let donor = Address::generate(&ctx.env);
    let id = ctx.client.create_campaign(&creator, &GOAL, &(NOW + DAY));
    ctx.mint.mint(&donor, &GOAL);
    ctx.client.donate(&donor, &id, &GOAL);

    set_time(&ctx, NOW + DAY + 1);

    // successful campaign cannot be refunded
    assert_eq!(
        ctx.client.try_claim_refund(&donor, &id),
        Err(Ok(Error::GoalReached))
    );

    // non-donor has nothing to claim on a failed campaign
    let id2 = ctx
        .client
        .create_campaign(&creator, &GOAL, &(NOW + DAY * 2));
    set_time(&ctx, NOW + DAY * 2 + 1);
    assert_eq!(
        ctx.client.try_claim_refund(&donor, &id2),
        Err(Ok(Error::NoDonation))
    );
}

#[test]
fn refund_blocked_after_withdrawal() {
    let ctx = setup();
    let creator = Address::generate(&ctx.env);
    let donor = Address::generate(&ctx.env);
    let id = ctx.client.create_campaign(&creator, &GOAL, &(NOW + DAY));
    ctx.mint.mint(&donor, &GOAL);

    ctx.client.donate(&donor, &id, &GOAL);
    ctx.client.withdraw(&creator, &id);

    set_time(&ctx, NOW + DAY + 1);
    assert_eq!(
        ctx.client.try_claim_refund(&donor, &id),
        Err(Ok(Error::GoalReached))
    );
}

#[test]
fn multiple_donors_are_each_refunded() {
    let ctx = setup();
    let creator = Address::generate(&ctx.env);
    let donor_a = Address::generate(&ctx.env);
    let donor_b = Address::generate(&ctx.env);
    let id = ctx.client.create_campaign(&creator, &GOAL, &(NOW + DAY));
    ctx.mint.mint(&donor_a, &250);
    ctx.mint.mint(&donor_b, &400);

    ctx.client.donate(&donor_a, &id, &250);
    ctx.client.donate(&donor_b, &id, &400);
    assert_eq!(ctx.token.balance(&ctx.contract_id), 650);

    set_time(&ctx, NOW + DAY + 1);
    ctx.client.claim_refund(&donor_a, &id);
    ctx.client.claim_refund(&donor_b, &id);

    assert_eq!(ctx.token.balance(&donor_a), 250);
    assert_eq!(ctx.token.balance(&donor_b), 400);
    assert_eq!(ctx.token.balance(&ctx.contract_id), 0);
}

// ---------- events ----------

fn last_contract_events(ctx: &Ctx) -> soroban_sdk::testutils::ContractEvents {
    ctx.env.events().all().filter_by_contract(&ctx.contract_id)
}

#[test]
fn lifecycle_events_are_emitted() {
    let ctx = setup();
    let creator = Address::generate(&ctx.env);
    let donor = Address::generate(&ctx.env);
    let id = ctx.client.create_campaign(&creator, &GOAL, &(NOW + DAY));

    assert_eq!(
        last_contract_events(&ctx),
        vec![
            &ctx.env,
            (
                ctx.contract_id.clone(),
                (symbol_short!("created"), id).into_val(&ctx.env),
                GOAL.into_val(&ctx.env)
            )
        ]
    );

    ctx.mint.mint(&donor, &GOAL);
    ctx.client.donate(&donor, &id, &GOAL);
    assert_eq!(
        last_contract_events(&ctx),
        vec![
            &ctx.env,
            (
                ctx.contract_id.clone(),
                (symbol_short!("donated"), id).into_val(&ctx.env),
                GOAL.into_val(&ctx.env)
            )
        ]
    );

    ctx.client.withdraw(&creator, &id);
    assert_eq!(
        last_contract_events(&ctx),
        vec![
            &ctx.env,
            (
                ctx.contract_id.clone(),
                (symbol_short!("withdraw"), id).into_val(&ctx.env),
                GOAL.into_val(&ctx.env)
            )
        ]
    );
}

#[test]
fn refund_event_is_emitted() {
    let ctx = setup();
    let creator = Address::generate(&ctx.env);
    let donor = Address::generate(&ctx.env);
    let id = ctx.client.create_campaign(&creator, &GOAL, &(NOW + DAY));
    ctx.mint.mint(&donor, &250);
    ctx.client.donate(&donor, &id, &250);

    set_time(&ctx, NOW + DAY + 1);
    ctx.client.claim_refund(&donor, &id);

    assert_eq!(
        last_contract_events(&ctx),
        vec![
            &ctx.env,
            (
                ctx.contract_id.clone(),
                (symbol_short!("refunded"), id).into_val(&ctx.env),
                250_i128.into_val(&ctx.env)
            )
        ]
    );
}

// ---------- authorization ----------

#[test]
fn mutating_calls_require_signature_authorization() {
    let env = Env::default();
    env.ledger().with_mut(|l| l.timestamp = NOW);
    let token_address = env
        .register_stellar_asset_contract_v2(Address::generate(&env))
        .address();
    let contract_id = env.register(Crowdfund, ());
    let client = CrowdfundClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    // no mocked auths: an unsigned initialize must be rejected
    env.set_auths(&[]);
    assert!(client.try_initialize(&admin, &token_address).is_err());

    // build state with all auths mocked
    env.mock_all_auths();
    client.initialize(&admin, &token_address);

    let creator = Address::generate(&env);
    let donor = Address::generate(&env);
    let id = client.create_campaign(&creator, &GOAL, &(NOW + DAY));
    token::StellarAssetClient::new(&env, &token_address).mint(&donor, &GOAL);
    client.donate(&donor, &id, &GOAL);

    // set_auths disables mocking: every mutating entrypoint must reject
    env.set_auths(&[]);
    assert!(client
        .try_create_campaign(&creator, &GOAL, &(NOW + DAY))
        .is_err());
    assert!(client.try_donate(&donor, &id, &100).is_err());
    assert!(client.try_withdraw(&creator, &id).is_err());
    assert!(client.try_claim_refund(&donor, &id).is_err());
}
