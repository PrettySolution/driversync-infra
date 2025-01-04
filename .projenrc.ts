import { execSync } from 'node:child_process';
import { awscdk, JsonFile } from 'projen';
import { GithubCredentials } from 'projen/lib/github';
import { driverFECheckoutStep } from './src/constants';


const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.171.1',
  defaultReleaseBranch: 'main',
  name: 'driver-infrastructure',
  projenrcTs: true,
  gitignore: ['.idea', 'driver-frontend'],
  githubOptions: { projenCredentials: GithubCredentials.fromApp() },
  release: false,

  deps: ['cdk-pipelines-github', 'aws-cdk-github-oidc', '@types/aws-lambda'], /* Runtime dependencies of this module. */
  devDeps: ['cdk-dia'], /* Build dependencies for this module. */

  workflowBootstrapSteps: [driverFECheckoutStep],
  autoApproveOptions: { allowedUsernames: ['prettysolution[bot]'], secret: 'PR_AUTO_APPROVE' },
  autoApproveUpgrades: true,
});

const driverFrontCommitId = execSync('git -C driver-frontend rev-parse --short HEAD').toString().trim();
new JsonFile(project, 'src/ci/driver-frontend-dynamic.json', { obj: { commitId: driverFrontCommitId } });

project.synth();
