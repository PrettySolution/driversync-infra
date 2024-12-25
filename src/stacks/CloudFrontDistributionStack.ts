import path from 'node:path';
import { AssetHashType, DockerImage, Duration, IgnoreMode, Stack, StackProps } from 'aws-cdk-lib';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import { Distribution, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import { ThisEnvironment } from '../interfaces';

interface CloudFrontDistributionStackProps extends StackProps {
  env: ThisEnvironment;
}

export class CloudFrontDistributionStack extends Stack {
  constructor(scope: Construct, id: string, props: CloudFrontDistributionStackProps) {
    super(scope, id, props);

    const subDomain = 'driversync';

    const hostedZone = HostedZone.fromLookup(this, 'HostedZone', {
      domainName: props.env.domainName,
    });

    const cert = new Certificate(this, 'Certificate', {
      validation: CertificateValidation.fromDns(hostedZone),
      domainName: hostedZone.zoneName,
      subjectAlternativeNames: [`*.${hostedZone.zoneName}`],
    });

    const webSiteBucket = new Bucket(this, 'WebSiteBucket', {
      // accessControl: BucketAccessControl.PRIVATE,
    });

    const distribution = new Distribution(this, 'Distribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessControl(webSiteBucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      domainNames: [`${subDomain}.${hostedZone.zoneName}`],
      certificate: cert,
      errorResponses: [
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html', ttl: Duration.minutes(5) },
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html', ttl: Duration.minutes(5) },
      ],
    });

    new BucketDeployment(this, 'BucketDeployment', {
      sources: [
        Source.asset(path.join(process.cwd(), 'driver-frontend'), {
          bundling: {
            image: DockerImage.fromRegistry('public.ecr.aws/docker/library/node:20.18.1'),
            user: 'root:root',
            command: ['sh', '-c', 'npm i && npm run build && cp -R ./dist/* /asset-output/'],
            environment: {
              REACT_APP_HELLO: 'World',
            },
          },
          assetHash: AssetHashType.SOURCE,
          ignoreMode: IgnoreMode.GIT,
        }),
      ],
      destinationBucket: webSiteBucket,
      distributionPaths: ['/*'],
      distribution,
    });

    new ARecord(this, 'ARecord', {
      recordName: subDomain,
      zone: hostedZone,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
    });
  }
}