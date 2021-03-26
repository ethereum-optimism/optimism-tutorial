/**
 * @dev Types for environment variables
 */
declare namespace NodeJS {
  interface ProcessEnv {
    // LOCAL(optimism-integration repo)
    L1_WEB3_URL: string
    L2_WEB3_URL: string
    NODE_ENV: 'development' | 'production'
  }
}