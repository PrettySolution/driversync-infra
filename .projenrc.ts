import { execSync } from 'node:child_process';
import { awscdk, JsonFile } from 'projen';
import { GithubCredentials } from 'projen/lib/github';
import { driverFECheckoutStep } from './src/constants';


const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.174.0',
  defaultReleaseBranch: 'main',
  name: 'driver-infrastructure',
  projenrcTs: true,
  gitignore: ['.idea', 'driver-frontend'],
  githubOptions: { projenCredentials: GithubCredentials.fromApp() },
  release: false,
  tsconfig: {
    compilerOptions: {
      noUnusedLocals: false,
      noUnusedParameters: false,
    },
  },
  deps: [
    'cdk-pipelines-github',
    'aws-cdk-github-oidc',
    '@types/aws-lambda',
    '@aws-sdk/client-dynamodb',
    'uuid',
    '@aws-sdk/util-dynamodb',
    'express',
    'serverless-http',
  ],
  devDeps: ['cdk-dia', '@types/express'],

  workflowBootstrapSteps: [driverFECheckoutStep],
  autoApproveOptions: { allowedUsernames: ['prettysolution[bot]', 'vasylherman'], secret: 'PR_AUTO_APPROVE' },
  autoApproveUpgrades: true,
});

const driverFrontCommitId = execSync('git -C driver-frontend rev-parse --short HEAD').toString().trim();
new JsonFile(project, 'src/ci/driver-frontend-dynamic.json', { obj: { commitId: driverFrontCommitId } });

const devPipeline: string =
  'cdk -a "npx ts-node -P tsconfig.json --prefer-ts-exts';

project.addTask('cdk:dev', {
  requiredEnv: ['CDK_DOMAIN_NAME'],
  exec: `${devPipeline} src/pipelines/DevPipelineApp.ts"`,
  receiveArgs: true,
  condition: 'aws sts get-caller-identity --query "Account" --output text | grep -Eq \'^(277707141071|268591637005)$\' && exit 1 || exit 0',
});

project.addTask('express:run', {
  requiredEnv: ['AWS_PROFILE_REGION', 'REPORT_TABLE_NAME'],
  exec: 'npx nodemon src/stacks/api/report/server.ts',
  receiveArgs: true,
});

project.synth();
