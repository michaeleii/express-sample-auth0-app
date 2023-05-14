declare global {
  namespace NodeJS {
    interface ProcessEnv {
      AUTH0_CLIENT_ID: string;
      AUTH0_SECRET: string;
      AUTH0_ISSUER_BASE_URL: string;
      PUBNUB_PUBLISH_KEY: string;
      PUBNUB_SUBSCRIBE_KEY: string;
    }
  }
}

export {};
