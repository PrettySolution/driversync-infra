import { App } from 'aws-cdk-lib';
import { GitHubPipelineStack } from './pipelines/GitHubPipelineStack';


// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new GitHubPipelineStack(app, 'gh-pipeline', { env: devEnv });

app.synth();