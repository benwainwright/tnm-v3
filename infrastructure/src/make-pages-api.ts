import { Cors, LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { Code, LayerVersion, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as path from "path";
import * as fs from "fs-extra";
import { HttpOrigin } from "aws-cdk-lib/lib/aws-cloudfront-origins";
import { getResourceName } from "./get-resource-name";

export const makePagesApi = (
  context: Construct,
  lambdaFolder: string,
  envName: string,
  projectRoot: string
) => {

  const awsNextLayer = new LayerVersion(context, 'aws-next-layer', {
    code: Code.fromAsset(path.resolve(projectRoot, "out_lambda", "layer")),
  });

  const api = new RestApi(context, 'pages-api', {
    defaultCorsPreflightOptions: {
      allowOrigins: Cors.ALL_ORIGINS,
    },
    restApiName: `${envName}-app-render`,
  });

  const pageNames = fs.readdirSync(path.resolve(lambdaFolder, "lambda"));

  const functions = pageNames.map((name) => {
    const parts = name.split("_");
    const pageName = parts[parts.length - 1];

    const build = path.resolve(projectRoot, "build", name);
    fs.copySync(path.resolve(projectRoot, ".next", "serverless"), build);
    fs.copySync(
      path.resolve(projectRoot, "out_lambda", "lambda", name),
      path.resolve(build, "page")
    );

    const pageFunction = new Function(context, `next-${pageName}-handler`, {
      functionName: getResourceName(`next-${pageName}-handler`, envName),
      runtime: Runtime.NODEJS_14_X,
      handler: "page/handler.render",
      code: Code.fromAsset(build),
      layers: [awsNextLayer],
    });

    const resource =
      pageName === "index" ? api.root : api.root.addResource(pageName);
    resource.addMethod("GET", new LambdaIntegration(pageFunction));
    return pageFunction;
  });

  const domainName = `${api.restApiId}.execute-api.${cdk.Aws.REGION}.amazonaws.com`;

  const httpOrigin = new HttpOrigin(domainName, { originPath: "/prod" });

  return {
    api,
    functions,
    httpOrigin
  };
};
