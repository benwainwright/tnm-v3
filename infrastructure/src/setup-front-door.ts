import { CfnOutput } from 'aws-cdk-lib';
import { DnsValidatedCertificate } from 'aws-cdk-lib/lib/aws-certificatemanager';
import {
  Distribution,
  OriginRequestCookieBehavior,
  OriginRequestPolicy,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/lib/aws-cloudfront';
import { HttpOrigin } from 'aws-cdk-lib/lib/aws-cloudfront-origins';
import {
  ARecord,
  PublicHostedZone,
  RecordTarget,
} from 'aws-cdk-lib/lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/lib/aws-route53-targets';
import { Construct } from 'constructs';
import { getDomainName } from './get-domain-name';

export const setupFrontDoor = (
  context: Construct,
  environmentName: string,
  origin: HttpOrigin,
) => {
  const domainName = getDomainName(environmentName);

  new CfnOutput(context, 'DomainName', {
    value: domainName,
  });

  const hostedZone = new PublicHostedZone(context, 'HostedZone', {
    zoneName: domainName,
  });

  const certificate = new DnsValidatedCertificate(context, 'cert', {
    domainName,
    hostedZone,
    region: 'us-east-1',
  });

  const distribution = new Distribution(context, 'cdn', {
    domainNames: [domainName],
    enableLogging: true,
    defaultBehavior: {
      origin,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      originRequestPolicy: new OriginRequestPolicy(
        context,
        'origin-request-policy',
        { cookieBehavior: OriginRequestCookieBehavior.all() },
      ),
    },
    certificate,
  });

  new ARecord(context, 'a-record', {
    zone: hostedZone,
    recordName: domainName,
    target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
  });

  return { distribution };
};
