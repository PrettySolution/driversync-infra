#### Set up DEV in your account
1. `ln -s ../driver-frontend driver-frontend` # create link to frontend directory
2. `aws configure --profile ps_dev` # configure your DEV aws profile
3. `asp ps_dev` # activate 
4. `export CDK_DOMAIN_NAME=prettysolution.com` # set hosted zone, must exist in route53 in your ps_dev account
5. `npx projen cdk:dev ls` # list stacks
6. `npx projen cdk:dev deploy local-pipeline/local/ApiGatewayStack -e` # deploy stack