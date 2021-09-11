import { RemovalPolicy } from "aws-cdk-lib"
import { Distribution } from "aws-cdk-lib/lib/aws-cloudfront"
import { S3Origin } from "aws-cdk-lib/lib/aws-cloudfront-origins"
import { Bucket } from "aws-cdk-lib/lib/aws-s3"
import { BucketDeployment, Source } from "aws-cdk-lib/lib/aws-s3-deployment"
import { Construct } from "constructs"

export const deployStatics = (context: Construct, path: string, envName: string, distribution: Distribution) => {
  const prefixes = ["_next", "images", "assets"]

  const deploymentBucket = new Bucket(context, `${envName}-tnm-v3-statics-bucket`, {
    bucketName: `${envName}-tnm-v3-statics-bucket`,
    publicReadAccess: true,
    websiteIndexDocument: "index.html",
    websiteErrorDocument: "index.html",
    removalPolicy: RemovalPolicy.DESTROY
  })

  const bucketOrigin = new S3Origin(deploymentBucket)

  prefixes.forEach(prefix => distribution.addBehavior(`/${prefix}/*`, bucketOrigin))

  new BucketDeployment(context, 'DeployWebsite', {
    sources: [Source.asset(path)],
    destinationBucket: deploymentBucket,
    distribution,
    distributionPaths: ["/*"]
  });
}
