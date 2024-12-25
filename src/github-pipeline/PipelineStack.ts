import { Stack, StackProps } from 'aws-cdk-lib';
import { ShellStep } from 'aws-cdk-lib/pipelines';
import { AwsCredentials, GitHubWorkflow } from 'cdk-pipelines-github';
import { Construct } from 'constructs';
import { MyAppStage } from './MyAppStage';
import { GH_SUPPORT_DEPLOY_ROLE_NAME, PRIMARY_REGION, PROD_ACCOUNT, STAGE_ACCOUNT } from '../constants';


export class PipelineStack extends Stack {
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
      preBuildSteps: [
        {
          name: 'Clone driver-frontend',
          uses: 'actions/checkout@v4',
          with: {
            repository: 'prettysolution/driver-frontend',
            path: 'driver-frontend',
            // ref: 'refs/heads/prod',
            token: '${{ secrets.PRETTY_READ_PAT }}',
          },
        },
      ],
    });
    const stage = new MyAppStage(this, 'driver-stage', {
      env: {
        account: STAGE_ACCOUNT,
        region: PRIMARY_REGION,
        domainName: 'stage.prettysolution.com',
      },
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
      preBuildSteps: [
        {
          name: 'Clone driver-frontend',
          uses: 'actions/checkout@v4',
          with: {
            repository: 'prettysolution/driver-frontend',
            path: 'driver-frontend',
            ref: 'refs/heads/prod',
            token: '${{ secrets.PRETTY_READ_PAT }}',
          },
        },
      ],
    });
    const prod = new MyAppStage(this, 'driver-prod', {
      env: {
        account: PROD_ACCOUNT,
        region: PRIMARY_REGION,
        domainName: 'prettysolution.com',
      },
    });
    prodPipeline.addStageWithGitHubOptions(prod);
  }
}