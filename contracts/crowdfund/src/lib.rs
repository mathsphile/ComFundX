//! CrowdFundX campaign escrow.
//!
//! Holds XLM donations for crowdfunding campaigns on Stellar:
//! - donations accumulate in escrow until the campaign deadline
//! - if the goal is reached, the creator withdraws the total raised
//! - if the goal is missed by the deadline, each donor claims a full refund
//!
//! Amounts are in stroops (1 XLM = 10_000_000 stroops).

#![no_std]

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, token, Address, Env,
};

/// ~30 days of ledger lifetime added to touched entries (5s close time).
const TTL_LEDGERS: u32 = 518_400;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    InvalidGoal = 3,
    InvalidDeadline = 4,
    InvalidAmount = 5,
    CampaignNotFound = 6,
    DeadlinePassed = 7,
    NotCreator = 8,
    AlreadyWithdrawn = 9,
    GoalNotReached = 10,
    CampaignStillActive = 11,
    GoalReached = 12,
    NoDonation = 13,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Campaign {
    pub creator: Address,
    pub goal: i128,
    pub deadline: u64,
    pub raised: i128,
    pub withdrawn: bool,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Token,
    Count,
    Campaign(u64),
    Donation(Address, u64),
}

#[contractevent(topics = ["created"], data_format = "single-value")]
pub struct CampaignCreated {
    #[topic]
    pub campaign_id: u64,
    #[data]
    pub goal: i128,
}

#[contractevent(topics = ["donated"], data_format = "single-value")]
pub struct Donated {
    #[topic]
    pub campaign_id: u64,
    #[data]
    pub amount: i128,
}

#[contractevent(topics = ["withdraw"], data_format = "single-value")]
pub struct Withdrawn {
    #[topic]
    pub campaign_id: u64,
    #[data]
    pub amount: i128,
}

#[contractevent(topics = ["refunded"], data_format = "single-value")]
pub struct Refunded {
    #[topic]
    pub campaign_id: u64,
    #[data]
    pub amount: i128,
}

#[contract]
pub struct Crowdfund;

fn token_address(env: &Env) -> Result<Address, Error> {
    env.storage()
        .instance()
        .get(&DataKey::Token)
        .ok_or(Error::NotInitialized)
}

fn load_campaign(env: &Env, campaign_id: u64) -> Result<Campaign, Error> {
    env.storage()
        .persistent()
        .get(&DataKey::Campaign(campaign_id))
        .ok_or(Error::CampaignNotFound)
}

fn bump(env: &Env, key: &DataKey) {
    let ledger = env.ledger().sequence();
    env.storage()
        .persistent()
        .extend_ttl(key, ledger + TTL_LEDGERS, ledger + TTL_LEDGERS);
}

#[contractimpl]
impl Crowdfund {
    /// Set the token used for payments (native XLM on testnet/mainnet).
    /// Callable once; must precede donate/withdraw/claim_refund.
    pub fn initialize(env: Env, token: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Token) {
            return Err(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::Count, &0u64);
        Ok(())
    }

    /// Register a campaign. `deadline` is a unix timestamp in the future.
    pub fn create_campaign(
        env: Env,
        creator: Address,
        goal: i128,
        deadline: u64,
    ) -> Result<u64, Error> {
        creator.require_auth();
        if goal <= 0 {
            return Err(Error::InvalidGoal);
        }
        if deadline <= env.ledger().timestamp() {
            return Err(Error::InvalidDeadline);
        }

        let count: u64 = env.storage().instance().get(&DataKey::Count).unwrap_or(0);
        let campaign_id = count + 1;

        let campaign = Campaign {
            creator,
            goal,
            deadline,
            raised: 0,
            withdrawn: false,
        };

        let key = DataKey::Campaign(campaign_id);
        env.storage().persistent().set(&key, &campaign);
        bump(&env, &key);
        env.storage().instance().set(&DataKey::Count, &campaign_id);

        CampaignCreated {
            campaign_id,
            goal: campaign.goal,
        }
        .publish(&env);
        Ok(campaign_id)
    }

    /// Transfer `amount` from the contributor into campaign escrow.
    pub fn donate(env: Env, contributor: Address, campaign_id: u64, amount: i128) -> Result<(), Error> {
        contributor.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let mut campaign = load_campaign(&env, campaign_id)?;
        if campaign.withdrawn {
            return Err(Error::AlreadyWithdrawn);
        }
        if env.ledger().timestamp() >= campaign.deadline {
            return Err(Error::DeadlinePassed);
        }

        let token = token_address(&env)?;
        token::Client::new(&env, &token).transfer(
            &contributor,
            &env.current_contract_address(),
            &amount,
        );

        campaign.raised += amount;
        let campaign_key = DataKey::Campaign(campaign_id);
        env.storage().persistent().set(&campaign_key, &campaign);
        bump(&env, &campaign_key);

        let donation_key = DataKey::Donation(contributor.clone(), campaign_id);
        let donated: i128 = env.storage().persistent().get(&donation_key).unwrap_or(0);
        env.storage().persistent().set(&donation_key, &(donated + amount));
        bump(&env, &donation_key);

        Donated {
            campaign_id,
            amount,
        }
        .publish(&env);
        Ok(())
    }

    /// Creator withdraws the total raised once the goal is reached. One-shot.
    pub fn withdraw(env: Env, caller: Address, campaign_id: u64) -> Result<(), Error> {
        caller.require_auth();

        let mut campaign = load_campaign(&env, campaign_id)?;
        if campaign.creator != caller {
            return Err(Error::NotCreator);
        }
        if campaign.withdrawn {
            return Err(Error::AlreadyWithdrawn);
        }
        if campaign.raised < campaign.goal {
            return Err(Error::GoalNotReached);
        }

        let token = token_address(&env)?;
        token::Client::new(&env, &token).transfer(
            &env.current_contract_address(),
            &campaign.creator,
            &campaign.raised,
        );

        campaign.withdrawn = true;
        let key = DataKey::Campaign(campaign_id);
        env.storage().persistent().set(&key, &campaign);
        bump(&env, &key);

        Withdrawn {
            campaign_id,
            amount: campaign.raised,
        }
        .publish(&env);
        Ok(())
    }

    /// Donor claims back their full contribution after a failed campaign.
    pub fn claim_refund(env: Env, contributor: Address, campaign_id: u64) -> Result<(), Error> {
        contributor.require_auth();

        let campaign = load_campaign(&env, campaign_id)?;
        if env.ledger().timestamp() < campaign.deadline {
            return Err(Error::CampaignStillActive);
        }
        if campaign.raised >= campaign.goal {
            return Err(Error::GoalReached);
        }

        let donation_key = DataKey::Donation(contributor.clone(), campaign_id);
        let donated: i128 = env.storage().persistent().get(&donation_key).unwrap_or(0);
        if donated <= 0 {
            return Err(Error::NoDonation);
        }

        let token = token_address(&env)?;
        token::Client::new(&env, &token).transfer(
            &env.current_contract_address(),
            &contributor,
            &donated,
        );

        env.storage().persistent().set(&donation_key, &0i128);

        Refunded {
            campaign_id,
            amount: donated,
        }
        .publish(&env);
        Ok(())
    }

    /// Campaign state, if it exists.
    pub fn get_campaign(env: Env, campaign_id: u64) -> Option<Campaign> {
        env.storage().persistent().get(&DataKey::Campaign(campaign_id))
    }

    /// Contributor's total live contribution to a campaign (0 after refund).
    pub fn get_donation(env: Env, contributor: Address, campaign_id: u64) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Donation(contributor, campaign_id))
            .unwrap_or(0)
    }
}

mod test;
