import { Stack, StackProps } from 'aws-cdk-lib';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import { ManagedLoginVersion, UserPool, UserPoolClient, CfnManagedLoginBranding } from 'aws-cdk-lib/aws-cognito';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { UserPoolDomainTarget } from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';
import { ThisEnvironment } from '../../interfaces';


interface CognitoStackProps extends StackProps {
  env: ThisEnvironment;
}

export class CognitoStack extends Stack {
  public readonly userPool: UserPool;
  public readonly userPoolClient: UserPoolClient;

  constructor(scope: Construct, id: string, props: CognitoStackProps) {
    super(scope, id, props);

    const hostedZone = HostedZone.fromLookup(this, 'HostedZone', { domainName: props.env.domainName });

    const certificate = new Certificate(this, 'Certificate', {
      validation: CertificateValidation.fromDns(hostedZone),
      domainName: hostedZone.zoneName,
      subjectAlternativeNames: [`${props.env.loginSubDomain}.${props.env.subDomain}.${props.env.domainName}`],
    });

    this.userPool = new UserPool(this, 'userPool', {
      signInAliases: {
        email: true,
        username: true,
        preferredUsername: true,
      },
      // users can change their usernames and emails
      standardAttributes: {
        preferredUsername: { mutable: true, required: true },
        email: { mutable: true, required: true },
      },
      selfSignUpEnabled: true,
    });
    this.userPoolClient = new UserPoolClient(this, 'userPoolClient', {
      userPool: this.userPool,
      oAuth: {
        callbackUrls: [`https://${props.env.subDomain}.${props.env.domainName}/`],
      },
    });

    const userPoolDomain = this.userPool.addDomain('login', {
      customDomain: { domainName: `${props.env.loginSubDomain}.${props.env.subDomain}.${props.env.domainName}`, certificate },
      managedLoginVersion: ManagedLoginVersion.NEWER_MANAGED_LOGIN,
    });

    new CfnManagedLoginBranding(this, 'cfnManagedLoginBranding', {
      clientId: this.userPoolClient.userPoolClientId,
      userPoolId: this.userPool.userPoolId,
      useCognitoProvidedValues: true,
    });

    new ARecord(this, 'ARecord', {
      recordName: `${props.env.loginSubDomain}.${props.env.subDomain}`,
      zone: hostedZone,
      target: RecordTarget.fromAlias(new UserPoolDomainTarget(userPoolDomain)),
    });

  }
}