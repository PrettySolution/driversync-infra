import path from 'path';
import { Stack, StackProps } from 'aws-cdk-lib';
import { CorsHttpMethod, HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaAuthorizer, HttpLambdaResponseType } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { TABLES } from '../core/DynamoDBStack';
import { REPORT_TABLE_NAME } from './api-lambda/express-app/interfaces';

interface ApiGatewayStackProps extends StackProps {
}

export class ApiGatewayStack extends Stack {
  readonly api: HttpApi;

  constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
    super(scope, id, props);

    const reportTable = Table.fromTableName(this, 'reportTable', StringParameter.valueForStringParameter(this, TABLES.REPORT_TABLE_PARAMETER_NAME));

    const httpLambdaAuthorizer = new NodejsFunction(this, 'httpLambdaAuthorizer', {
      runtime: Runtime.NODEJS_20_X,
      logRetention: RetentionDays.ONE_MONTH,
    });

    const authorizer = new HttpLambdaAuthorizer('authorizer', httpLambdaAuthorizer, {
      responseTypes: [HttpLambdaResponseType.SIMPLE],
    });

    const apiLambda = new NodejsFunction(this, 'apiLambda', {
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(__dirname, './api-lambda/serverless.ts'),
      logRetention: RetentionDays.ONE_MONTH,
      environment: { [REPORT_TABLE_NAME]: reportTable.tableName },
      // timeout: Duration.seconds(15),
    });

    this.api = new HttpApi(this, 'httpApi', {
      disableExecuteApiEndpoint: false,
      corsPreflight: {
        allowHeaders: ['*'],
        allowMethods: [CorsHttpMethod.ANY],
        allowOrigins: ['*'],
      },
    });

    this.api.addRoutes({
      path: '/api/{proxy+}',
      methods: [HttpMethod.ANY],
      integration: new HttpLambdaIntegration('integration', apiLambda),
      authorizer: authorizer,
    });

    reportTable.grantReadWriteData(apiLambda);
  }
}
