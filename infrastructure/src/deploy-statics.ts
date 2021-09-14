import { CfnOutput, RemovalPolicy } from "aws-cdk-lib";
import { Distribution } from "aws-cdk-lib/lib/aws-cloudfront";
import { S3Origin } from "aws-cdk-lib/lib/aws-cloudfront-origins";
import { Bucket } from "aws-cdk-lib/lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/lib/aws-s3-deployment";
import { Construct } from "constructs";
import { getDomainName } from "./get-domain-name";

export const deployStatics = (
  context: Construct,
  publicFolder: string,
  staticsFolder: string,
  storybookFolder: string,
  envName: string,
  distribution: Distribution
) => {
  const prefixes = ["_next", "images", "assets"];

  const bucketName = getDomainName(envName);

  const deploymentBucket = new Bucket(context, `statics-bucket`, {
    bucketName,
    publicReadAccess: true,
    websiteIndexDocument: "index.html",
    websiteErrorDocument: "index.html",
    removalPolicy: RemovalPolicy.DESTROY,
  });

  new CfnOutput(context, "StaticsBucket", {
    value: deploymentBucket.bucketName,
  });

  const bucketOrigin = new S3Origin(deploymentBucket);

  prefixes.forEach((prefix) =>
    distribution.addBehavior(`/${prefix}/*`, bucketOrigin)
  );

  distribution.addBehavior(`/backend-config.json`, bucketOrigin);
  distribution.addBehavior("/storybook/*", bucketOrigin)

  new BucketDeployment(context, "deploy-public-folder", {
    sources: [
      Source.asset(publicFolder),
      Source.asset(storybookFolder),
    ],
    destinationBucket: deploymentBucket,
  });

  new BucketDeployment(context, "deploy-statics-folder", {
    sources: [Source.asset(staticsFolder)],
    destinationBucket: deploymentBucket,
    distribution,
    destinationKeyPrefix: "_next/static",
    distributionPaths: ["/*"],
  });
};
