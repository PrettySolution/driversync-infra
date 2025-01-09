import { GitHubStage, GitHubStageProps } from 'cdk-pipelines-github';
import { Construct } from 'constructs';
import { MyAppVersions, ThisEnvironment } from '../interfaces';
import { ApiGatewayStack } from '../stacks/api/ApiGatewayStack';
import { ReportStack } from '../stacks/api/report/ReportStack';
import { CloudFrontDistributionStack } from '../stacks/CloudFrontDistributionStack';
import { DynamoDBStack } from '../stacks/dynamodb/DynamoDBStack';


interface MyAppStageProps extends GitHubStageProps {
  env: ThisEnvironment;
  versions: MyAppVersions;
}

export class MyAppStage extends GitHubStage {
  constructor(scope: Construct, id: string, props: MyAppStageProps) {
    super(scope, id, props);

    const env = props.env;

    const db = new DynamoDBStack(this, 'DynamoDBStack', {});
    const api = new ApiGatewayStack(this, 'ApiGatewayStack', { env });
    new ReportStack(this, 'ReportStack', {
      env,
      api: api.api,
      db: db.tables,
    });
    new CloudFrontDistributionStack(this, 'CloudFrontDistribution', {
      description: 'CloudFront distribution for prettysolution.com',
      env,
      versions: props.versions,
      api: api.api,
    });

  }

}