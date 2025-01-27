import { Stack, StackProps } from 'aws-cdk-lib';
import { ShellStep } from 'aws-cdk-lib/pipelines';
import { AwsCredentials, GitHubWorkflow } from 'cdk-pipelines-github';
import { Construct } from 'constructs';
import { MyAppStage } from './MyAppStage';
import * as versions from '../ci/versions';
import {
  driverFECheckoutStep,
  GH_SUPPORT_DEPLOY_ROLE_NAME,
  PRIMARY_REGION,
  PROD_ACCOUNT,
  STAGE_ACCOUNT,
} from '../constants';
import { MyAppVersions } from '../interfaces';

export const myAppVersions: MyAppVersions = {
  driver: {
    frontend: { version: versions.DriverFrontend['driversync-web'], commitId: versions.DriverFrontendDynamic.commitId },
  },
};

const domainSettings = {
  subDomain: 'driversync',
  loginSubDomain: 'login',
};

export class GitHubPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    // STAGE
    const stagePipeline = new GitHubWorkflow(this, 'stagePipeline', {
      synth: new ShellStep('Build', {
        commands: [
          'yarn install',
          'yarn build',
        ],
      }),
      awsCreds: AwsCredentials.fromOpenIdConnect({
        gitHubActionRoleArn: `arn:aws:iam::${STAGE_ACCOUNT}:role/${GH_SUPPORT_DEPLOY_ROLE_NAME}`,
      }),
      preBuildSteps: [driverFECheckoutStep],
    });
    const stage = new MyAppStage(this, 'driver-stage', {
      env: {
        account: STAGE_ACCOUNT,
        region: PRIMARY_REGION,
        domainName: 'stage.prettysolution.com',
        ...domainSettings,
        frontend: {
          VITE_COGNITO_AUTHORITY: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_GUWs2PUMx',
          VITE_CLIENT_ID: '611lkt5l23qksdlghfmq6vgj45',
        },
      },
      versions: myAppVersions,
    });
    stagePipeline.addStageWithGitHubOptions(stage);

    // PROD
    const prodPipeline = new GitHubWorkflow(this, 'prodPipeline', {
      synth: new ShellStep('Build', {
        commands: [
          'yarn install',
          'yarn build',
        ],
      }),
      awsCreds: AwsCredentials.fromOpenIdConnect({
        gitHubActionRoleArn: `arn:aws:iam::${PROD_ACCOUNT}:role/${GH_SUPPORT_DEPLOY_ROLE_NAME}`,
      }),
      workflowPath: '.github/workflows/deploy-prod.yml',
      workflowName: 'deploy-prod',
      workflowTriggers: { push: { branches: ['prod'] } },
      preBuildSteps: [driverFECheckoutStep],
    });
    const prod = new MyAppStage(this, 'driver-prod', {
      env: {
        account: PROD_ACCOUNT,
        region: PRIMARY_REGION,
        domainName: 'prettysolution.com',
        ...domainSettings,
        frontend: {
          VITE_COGNITO_AUTHORITY: '',
          VITE_CLIENT_ID: '',
        },
      },
      versions: myAppVersions,
    });
    prodPipeline.addStageWithGitHubOptions(prod);
  }
}