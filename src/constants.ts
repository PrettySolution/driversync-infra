import { JobStep } from 'cdk-pipelines-github';
import * as versions from './ci/versions';

export const MANAGEMENT_ACCOUNT = '536309290949';
export const PROD_ACCOUNT = '268591637005';
export const STAGE_ACCOUNT = '277707141071';

export const PRIMARY_REGION = 'us-east-1';
export const SECONDARY_REGION = 'us-west-2';
export const CONNECTION_ARN = 'arn:aws:codestar-connections:us-east-1:536309290949:connection/8db45fc6-a823-4980-b94d-a7dcf69cfe99';
export const GH_SUPPORT_DEPLOY_ROLE_NAME = 'GithubSupport-DeployRole';

export const driverFECheckoutStep: JobStep = {
  name: 'Checkout driversync-web',
  uses: 'actions/checkout@v4',
  with: {
    repository: 'prettysolution/driversync-web',
    path: 'driversync-web',
    ref: versions.DriverFrontend['driversync-web'],
    token: '${{ secrets.PRETTY_READ_PAT }}',
  },
};

export const setNodeJSv22: JobStep = {
  name: 'Setup Node.js',
  uses: 'actions/setup-node@v4',
  with: {
    'node-version': '22',
  },
};