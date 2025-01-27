#### Set up DEV in your account
1. `ln -s ../driversync-web driversync-web` # create link to frontend directory
2. `aws configure --profile ps_dev` # configure your DEV aws profile
3. `asp ps_dev` # activate 
4. `export CDK_DOMAIN_NAME=vh.prettysolution.com` # set hosted zone, must exist in route53 in your ps_dev account
5. `npx projen cdk:dev ls` # list stacks
6. `npx projen cdk:dev deploy <name of a stack from prev step> -e` # deploy a stack, name example: dev-pipeline/dev/DynamoDBStack

#### run express in server mode
1. follow steps from [Set up DEV in your account](#set-up-dev-in-your-account)
2. `export REPORT_TABLE_NAME=$(aws ssm get-parameter --name "/core/DynamoDbStack/Tables/Report" --query "Parameter.Value" --output text)`
3. `npx projen express:run`
4. [test your api](src/stacks/api-gateway/api-lambda/debug/report-api.http)

#### deploy cloudfront
1. `export VITE_COGNITO_AUTHORITY=$(aws ssm get-parameter --name "/core/CognitoStack/userPool01/userPoolProviderUrl" --query "Parameter.Value" --output text)`
2. `export VITE_CLIENT_ID=$(aws ssm get-parameter --name "/core/CognitoStack/userPoolClient01/userPoolClientId" --query "Parameter.Value" --output text)`
3. `npx projen cdk:dev deploy <name of cloudfront stack> -e`

#### Examples
```shell
aws cognito-idp admin-initiate-auth \
  --user-pool-id us-east-1_JKLmC0DZe \
  --client-id 6lmvsi2sncou70huiqt893hndq \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=user01,PASSWORD=user01
```