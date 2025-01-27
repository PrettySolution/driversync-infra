import { Stack, StackProps } from 'aws-cdk-lib';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import { ManagedLoginVersion, UserPool, UserPoolClient, CfnManagedLoginBranding } from 'aws-cdk-lib/aws-cognito';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { UserPoolDomainTarget } from 'aws-cdk-lib/aws-route53-targets';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { ThisEnvironment } from '../../interfaces';


interface CognitoStackProps extends StackProps {
  env: ThisEnvironment;
}

export class CognitoStack extends Stack {

  constructor(scope: Construct, id: string, props: CognitoStackProps) {
    super(scope, id, props);

    const hostedZone = HostedZone.fromLookup(this, 'HostedZone', { domainName: props.env.domainName });

    const certificate = new Certificate(this, 'Certificate', {
      validation: CertificateValidation.fromDns(hostedZone),
      domainName: hostedZone.zoneName,
      subjectAlternativeNames: [`*.${props.env.subDomain}.${props.env.domainName}`],
    });

    const userPool01 = new UserPool(this, 'userPool01', {
      userPoolName: 'simple-userPool01',
      // signInAliases: {
      //   email: true,
      //   username: true,
      //   preferredUsername: true,
      // },
      // standardAttributes: {
      //   preferredUsername: { mutable: true, required: true },
      //   email: { mutable: true, required: true },
      // },
      selfSignUpEnabled: true,
      passwordPolicy: {
        minLength: 6,
        requireDigits: false,
        requireLowercase: false,
        requireSymbols: false,
        requireUppercase: false,
      },
    });
    const userPoolClient01 = new UserPoolClient(this, 'userPoolClient01', {
      userPool: userPool01,
      oAuth: { callbackUrls: [`https://${props.env.subDomain}.${props.env.domainName}/`] },
    });

    const userPoolDomain01 = userPool01.addDomain('login01', {
      customDomain: {
        domainName: `${props.env.loginSubDomain}-01.${props.env.subDomain}.${props.env.domainName}`,
        certificate,
      },
      managedLoginVersion: ManagedLoginVersion.NEWER_MANAGED_LOGIN,
    });

    new CfnManagedLoginBranding(this, 'cfnManagedLoginBranding01', {
      clientId: userPoolClient01.userPoolClientId,
      userPoolId: userPool01.userPoolId,
      useCognitoProvidedValues: true,
    });

    new ARecord(this, 'ARecord01', {
      recordName: `${props.env.loginSubDomain}.${props.env.subDomain}`,
      zone: hostedZone,
      target: RecordTarget.fromAlias(new UserPoolDomainTarget(userPoolDomain01)),
    });

    // These used in Readme.md
    new StringParameter(this, 'userPoolProviderUrl01', {
      parameterName: '/core/CognitoStack/userPool01/userPoolProviderUrl',
      stringValue: userPool01.userPoolProviderUrl,
    });
    new StringParameter(this, 'userPoolClientId01', {
      parameterName: '/core/CognitoStack/userPoolClient01/userPoolClientId',
      stringValue: userPoolClient01.userPoolClientId,
    });

  }
}