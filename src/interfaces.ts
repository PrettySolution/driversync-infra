import { Environment } from 'aws-cdk-lib';

export interface ThisEnvironment extends Environment {
  domainName: string;
  subDomain: string;
  loginSubDomain: string;
  frontend: {
    VITE_COGNITO_AUTHORITY: string;
    VITE_CLIENT_ID: string;
  };
}

export interface MyAppVersions {
  driver: { frontend: {version: string; commitId: string} };
}