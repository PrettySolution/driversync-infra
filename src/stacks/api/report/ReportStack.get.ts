import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { REPORT_TABLE_NAME } from './ReportStack';

const ddbClient = new DynamoDBClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    const command = new ScanCommand({
      TableName: process.env[REPORT_TABLE_NAME],
    });
    const res = await ddbClient.send(command);
    console.log('req', event, context);
    console.log('table: ', process.env[REPORT_TABLE_NAME]);
    console.log('res: ', JSON.stringify(res));
    return {
      statusCode: res.$metadata.httpStatusCode,
      body: JSON.stringify(res),
    };
  } catch (e) {
    console.log(e);
    return {
      statusCode: 500,
      body: JSON.stringify(e),
    };
  }
};

// @ts-ignore
void handler(
  {
    version: '2.0',
    routeKey: 'GET /api/report',
    rawPath: '/api/report',
    rawQueryString: 'hello=world',
    headers: {
      'accept': '*/*',
      'accept-encoding': 'br, deflate, gzip, x-gzip',
      'cloudfront-forwarded-proto': 'https',
      'cloudfront-is-android-viewer': 'false',
      'cloudfront-is-desktop-viewer': 'true',
      'cloudfront-is-ios-viewer': 'false',
      'cloudfront-is-mobile-viewer': 'false',
      'cloudfront-is-smarttv-viewer': 'false',
      'cloudfront-is-tablet-viewer': 'false',
      'cloudfront-viewer-address': '91.207.210.227:52394',
      'cloudfront-viewer-asn': '48323',
      'cloudfront-viewer-city': 'Chernivtsi',
      'cloudfront-viewer-country': 'UA',
      'cloudfront-viewer-country-name': 'Ukraine',
      'cloudfront-viewer-country-region': '77',
      'cloudfront-viewer-country-region-name': 'Chernivtsi',
      'cloudfront-viewer-http-version': '2.0',
      'cloudfront-viewer-latitude': '48.29320',
      'cloudfront-viewer-longitude': '25.94480',
      'cloudfront-viewer-postal-code': '58000',
      'cloudfront-viewer-time-zone': 'Europe/Kyiv',
      'cloudfront-viewer-tls': 'TLSv1.3:TLS_AES_128_GCM_SHA256:fullHandshake',
      'content-length': '0',
      'content-type': 'application/json',
      'host': 'jasthnuaej.execute-api.us-east-1.amazonaws.com',
      'user-agent': 'IntelliJ HTTP Client/IntelliJ IDEA 2024.3',
      'via': '2.0 3d735fe4e2263c305c181f5452e64c24.cloudfront.net (CloudFront)',
      'x-amz-cf-id': '4ykf0oD0opuPBhJHfH-vmfnT7R2tZH_md7p9kuiblrcCuI7yhFH3fg==',
      'x-amzn-trace-id': 'Root=1-67798f34-37dd3fe2488dbd530d4930ea',
      'x-forwarded-for': '91.207.210.227, 3.172.21.37',
      'x-forwarded-port': '443',
      'x-forwarded-proto': 'https',
    },
    queryStringParameters: {
      hello: 'world',
    },
    requestContext: {
      accountId: '277707141071',
      apiId: 'jasthnuaej',
      domainName: 'jasthnuaej.execute-api.us-east-1.amazonaws.com',
      domainPrefix: 'jasthnuaej',
      http: {
        method: 'GET',
        path: '/api/report',
        protocol: 'HTTP/1.1',
        sourceIp: '91.207.210.227',
        userAgent: 'IntelliJ HTTP Client/IntelliJ IDEA 2024.3',
      },
      requestId: 'D4NQTjZ7oAMEMwQ=',
      routeKey: 'GET /api/report',
      stage: '$default',
      time: '04/Jan/2025:19:42:44 +0000',
      timeEpoch: 1736019764736,
    },
    isBase64Encoded: false,
  },
  {
    callbackWaitsForEmptyEventLoop: true,
    functionVersion: '$LATEST',
    functionName: 'driver-stage-ReportStack-get71DCF2CC-40BEnmaI2ssj',
    memoryLimitInMB: '128',
    logGroupName: '/aws/lambda/driver-stage-ReportStack-get71DCF2CC-40BEnmaI2ssj',
    logStreamName: '2025/01/04/[$LATEST]9dca237d4f974df18bc0deb4431f7126',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:277707141071:function:driver-stage-ReportStack-get71DCF2CC-40BEnmaI2ssj',
    awsRequestId: '34162360-424f-4119-8803-0bcd65a4b996',
  },
);