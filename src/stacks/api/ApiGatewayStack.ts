import { Stack, StackProps } from 'aws-cdk-lib';
import { CorsHttpMethod, HttpApi } from 'aws-cdk-lib/aws-apigatewayv2';
import { Construct } from 'constructs';

interface ApiGatewayStackProps extends StackProps {

}

export class ApiGatewayStack extends Stack {
  readonly api: HttpApi;

  constructor(scope: Construct, id: string, props?: ApiGatewayStackProps) {
    super(scope, id, props);

    this.api = new HttpApi(this, 'httpApi', {
      disableExecuteApiEndpoint: false,
      corsPreflight: {
        allowHeaders: ['*'],
        allowMethods: [CorsHttpMethod.ANY],
        allowOrigins: ['*'],
      },
    });

  }
}