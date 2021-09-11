import { Cors, LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway"
import { CloudFrontInvalidator } from 'cdk-cloudfront-invalidator'
import { Code, LayerVersion, Function, Runtime } from "aws-cdk-lib/aws-lambda"
import { Construct } from "constructs"
import * as cdk from "aws-cdk-lib";
import * as path from "path"
import  * as fs from "fs-extra"
import { Distribution, ViewerProtocolPolicy } from "aws-cdk-lib/lib/aws-cloudfront"
import { HttpOrigin } from "aws-cdk-lib/lib/aws-cloudfront-origins"

export const makePagesApi = (context: Construct, lambdaFolder: string, envName: string, projectRoot: string) => {

  const awsNextLayer = new LayerVersion(context, 'tnm-v3-aws-next-layer', {
    code: Code.fromAsset(path.resolve(projectRoot, "out_lambda", "layer"))
  })

  const api = new RestApi(context, "api", {
    defaultCorsPreflightOptions: {
      allowOrigins: Cors.ALL_ORIGINS
    },
    restApiName: `${envName}-app-render`
  })

  const pageNames = fs.readdirSync(path.resolve(lambdaFolder, "lambda"))

  const functions = pageNames.map(name => {
    const parts = name.split("_")
    const pageName = parts[parts.length - 1]

    const build = path.resolve(projectRoot, "build", name) 
    fs.copySync(path.resolve(projectRoot, '.next', 'serverless'), build)
    fs.copySync(path.resolve(projectRoot, "out_lambda", "lambda", name), path.resolve(build, "page"))

    const pageFunction = new Function(context, `tnm-v3-${pageName}`, {
      functionName: `tnm-v3-${pageName}-handler`,
      runtime: Runtime.NODEJS_14_X,
      handler: 'page/handler.render',
      code: Code.fromAsset(build),
      layers: [awsNextLayer]
    })

    const resource = pageName === 'index' ? api.root : api.root.addResource(pageName)
    resource.addMethod("GET", new LambdaIntegration(pageFunction))
    return pageFunction
  })

  const versions = functions.reduce((versionString, func) => `${versionString}${func.currentVersion.version}`, ``)

  const domainName = `${api.restApiId}.execute-api.${cdk.Aws.REGION}.amazonaws.com`

  const httpOrigin = new HttpOrigin(domainName, { originPath: "/prod" })      

  const distribution = new Distribution(context, `${envName}-tnm-v3-cdn`, {
    defaultBehavior: {
      origin: httpOrigin,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    },
  })

  new CloudFrontInvalidator(this, 'CloudFrontInvalidator', {
    distributionId: distribution.distributionId,
    hash: versions
  })

  return {
    api, functions, distribution
  }
}
