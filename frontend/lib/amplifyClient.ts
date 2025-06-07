import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID!,
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID!,
      identityPoolId: process.env.NEXT_PUBLIC_IDENTITY_POOL_ID!,
      region: process.env.NEXT_PUBLIC_AWS_REGION!,
    }
  },
  API: {
    REST: {
      metrics: {
        endpoint: process.env.NEXT_PUBLIC_API_URL,
        region: process.env.NEXT_PUBLIC_AWS_REGION,
        service: 'execute-api',
      }
    }
  }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any);
