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
  githubOptions: {
    projenCredentials: GithubCredentials.fromApp(),
  },
  workflowBootstrapSteps: [driverFECheckoutStep],
  release: false,
  deps: ['cdk-pipelines-github', 'aws-cdk-github-oidc'], /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  devDeps: ['cdk-dia'], /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
});

const driverFrontCommitId = execSync('git -C driver-frontend rev-parse --short HEAD').toString().trim();
new JsonFile(project, 'src/ci/driver-frontend-dynamic.json', { obj: { commitId: driverFrontCommitId } });

project.synth();


