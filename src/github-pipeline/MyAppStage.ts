import { GitHubStage, GitHubStageProps } from 'cdk-pipelines-github';
import { Construct } from 'constructs';
import { ThisEnvironment } from '../interfaces';
import { CloudFrontDistributionStack } from '../stacks/CloudFrontDistributionStack';


interface MyAppStageProps extends GitHubStageProps {
  env: ThisEnvironment;
}

export class MyAppStage extends GitHubStage {
  constructor(scope: Construct, id: string, props: MyAppStageProps) {
    super(scope, id, props);

    new CloudFrontDistributionStack(this, 'CloudFrontDistribution', {
      env: props.env,
      description: 'CloudFront distribution for pretty-solution.com',
    });


  }

}