import { PublicHostedZone } from "aws-cdk-lib/lib/aws-route53";
import { BASE_DOMAIN_NAME } from "./get-domain-name";
import { Construct } from "constructs";

export const setupDnsZone = (context: Construct) => {
  const hostedZone = new PublicHostedZone(context, "HostedZone", {
    zoneName: BASE_DOMAIN_NAME,
  });

  return { hostedZone };
};
