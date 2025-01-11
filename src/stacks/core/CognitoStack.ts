import { Stack, StackProps } from 'aws-cdk-lib';
import { UserPool, UserPoolClient } from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';


interface CognitoStackProps extends StackProps {
}

export class CognitoStack extends Stack {
  public readonly userPool: UserPool;
  public readonly userPoolClient: UserPoolClient;

  constructor(scope: Construct, id: string, props?: CognitoStackProps) {
    super(scope, id, props);

    this.userPool = new UserPool(this, 'userPool', {});
    this.userPoolClient = new UserPoolClient(this, 'userPoolClient', {
      userPool: this.userPool,
    } );
  }
}