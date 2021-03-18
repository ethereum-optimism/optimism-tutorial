/**
 * @dev Types for environment variables
 */
declare namespace NodeJS {
  interface ProcessEnv {
    // LOCAL(optimism-integration repo)
    L1_WEB3_URL: string
    L2_WEB3_URL: string
    // optional, will be deployed for us if unset
    L1_ERC20_ADDRESS: string
    // # optional, will be deployed for us if unset
    L1_ERC20_GATEWAY_ADDRESS: string
    NODE_ENV: 'development' | 'production'
  }
}