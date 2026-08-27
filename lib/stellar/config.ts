export const STELLAR_CONFIG = {
  network: process.env.NEXT_PUBLIC_STELLAR_NETWORK || "TESTNET",
  rpcUrl: process.env.NEXT_PUBLIC_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org",
  networkPassphrase: process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015",
  nativeXlmContract: process.env.NEXT_PUBLIC_NATIVE_XLM_CONTRACT || "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
  crowdfundContractId: process.env.NEXT_PUBLIC_CROWDFUND_CONTRACT_ID || "CAOGXHKQLQYUR4RHORAFOGOX3J526V6PWIOLPCLEDO5DRQTUZ3VIC43M",
  horizonUrl: "https://horizon-testnet.stellar.org",
  explorerUrl: "https://stellar.expert/explorer/testnet"
};
