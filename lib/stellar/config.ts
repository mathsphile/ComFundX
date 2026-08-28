export const STELLAR_CONFIG = {
  network: process.env.NEXT_PUBLIC_STELLAR_NETWORK || "TESTNET",
  rpcUrl: process.env.NEXT_PUBLIC_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org",
  networkPassphrase: process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015",
  nativeXlmContract: process.env.NEXT_PUBLIC_NATIVE_XLM_CONTRACT || "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
  crowdfundContractId: process.env.NEXT_PUBLIC_CROWDFUND_CONTRACT_ID || "CDXS34F6CM4IVYFLGZ2BTVXZKP5PBDDB3IR6N3N4XCF7ZL3TE3FEQKVF",
  horizonUrl: "https://horizon-testnet.stellar.org",
  explorerUrl: "https://stellar.expert/explorer/testnet"
};
