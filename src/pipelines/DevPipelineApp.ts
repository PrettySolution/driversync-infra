import { App, Stack, StackProps } from 'aws-cdk-lib';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import { myAppVersions } from './GitHubPipelineStack';
import { MyAppStage } from './MyAppStage';

const app = new App();

class DevPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, 'pipeline', {
      synth: new ShellStep('Build', {
        input: CodePipelineSource.gitHub('owner/repo', 'main'),
        commands: ['yarn install', 'yarn build'],
      }),
    });

    pipeline.addStage(new MyAppStage(this, 'dev', {
      env: {
        domainName: process.env.CDK_DOMAIN_NAME!,
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
        subDomain: 'driversync',
        loginSubDomain: 'login',
        frontend: {
          VITE_COGNITO_AUTHORITY: process.env.VITE_COGNITO_AUTHORITY || 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_JKLmC0DZe',
          VITE_COGNITO_CLIENT_ID: process.env.VITE_COGNITO_CLIENT_ID || '6lmvsi2sncou70huiqt893hndq',
        },
      },
      versions: myAppVersions,
    }));
  }
}

new DevPipelineStack(app, 'dev-pipeline', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});


app.synth();