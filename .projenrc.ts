import { awscdk } from 'projen';
import { GithubCredentials } from 'projen/lib/github';
import { driverFECheckoutSTAGE } from './src/constants';


const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.171.1',
  defaultReleaseBranch: 'main',
  name: 'driver-infrastructure',
  projenrcTs: true,
  gitignore: ['.idea', 'driver-frontend'],
  githubOptions: {
    projenCredentials: GithubCredentials.fromApp(),
  },
  workflowBootstrapSteps: [driverFECheckoutSTAGE],
  release: false,
  deps: ['cdk-pipelines-github', 'aws-cdk-github-oidc'], /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  devDeps: ['cdk-dia'], /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
});
project.synth();


