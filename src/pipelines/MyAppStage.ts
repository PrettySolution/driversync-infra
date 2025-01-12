import { GitHubStage, GitHubStageProps } from 'cdk-pipelines-github';
import { Construct } from 'constructs';
import { MyAppVersions, ThisEnvironment } from '../interfaces';
import { ApiGatewayStack } from '../stacks/api/ApiGatewayStack';
import { CloudFrontDistributionStack } from '../stacks/CloudFrontDistributionStack';
import { CognitoStack } from '../stacks/core/CognitoStack';
import { DynamoDBStack } from '../stacks/core/DynamoDBStack';


interface MyAppStageProps extends GitHubStageProps {
  env: ThisEnvironment;
  versions: MyAppVersions;
}

export class MyAppStage extends GitHubStage {
  constructor(scope: Construct, id: string, props: MyAppStageProps) {
    super(scope, id, props);

    const env = props.env;
    const cognito = new CognitoStack(this, 'CognitoStack', {});
    const db = new DynamoDBStack(this, 'DynamoDBStack', {});
    const api = new ApiGatewayStack(this, 'ApiGatewayStack', { env, userPool: cognito.userPool });
    api.addDependency(db);
    new CloudFrontDistributionStack(this, 'CloudFrontDistribution', { env, versions: props.versions, api: api.api });

  }

}