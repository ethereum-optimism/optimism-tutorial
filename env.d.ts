/**
 * @dev Types for environment variables
 */
declare namespace NodeJS {
  interface ProcessEnv {
    // LOCAL(optimism-integration repo)
    ETHEREUM_JSON_RPC_ENDPOINT: string
    OPTIMISM_JSON_RPC_ENDPOINT: string
    NODE_ENV: 'development' | 'production'
  }
}