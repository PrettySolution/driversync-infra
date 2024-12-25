import { Environment } from 'aws-cdk-lib';

export interface ThisEnvironment extends Environment {
  domainName: string;
}

export interface MyAppVersions {
  driver: { frontend: string };
}