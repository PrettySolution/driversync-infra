import { Stack, StackProps } from 'aws-cdk-lib';
import { HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { AppTables } from '../../dynamodb/DynamoDBStack';

export const REPORT_TABLE_NAME: string = 'REPORT_TABLE_NAME';

interface ReportStackProps extends StackProps {
  api: HttpApi;
  db: AppTables;
}

export class ReportStack extends Stack {
  constructor(scope: Construct, id: string, props: ReportStackProps) {
    super(scope, id, props);

    const getFunc = new NodejsFunction(this, 'get', {
      runtime: Runtime.NODEJS_20_X,
      environment: {
        [REPORT_TABLE_NAME]: props.db.report.tableName,
      },
    });

    const putFunc = new NodejsFunction(this, 'put', {
      runtime: Runtime.NODEJS_20_X,
      environment: {
        [REPORT_TABLE_NAME]: props.db.report.tableName,
      },
    });

    props.api.addRoutes({
      path: '/api/report',
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration('integration', getFunc),
    });
    props.api.addRoutes({
      path: '/api/report',
      methods: [HttpMethod.PUT],
      integration: new HttpLambdaIntegration('integration', putFunc),
    });

    props.db.report.grantReadData(getFunc);
    props.db.report.grantWriteData(putFunc);
  }
}