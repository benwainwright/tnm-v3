import { App, Stack, StackProps } from 'aws-cdk-lib';
import { LayerVersion, Code, Function, Runtime } from "aws-cdk-lib/aws-lambda"
import { RestApi } from "aws-cdk-lib/aws-apigateway"
import { Construct } from 'constructs';
import * as path from "path";
import  * as fs from "fs-extra"
import { Cors, LambdaIntegration } from 'aws-cdk-lib/lib/aws-apigateway';

const projectRoot = path.resolve(__dirname, "..", "..")

interface TnmAppProps {
  envName: string;
  transient: boolean;
  stackProps: StackProps;
}

export class TnmV3Stack extends Stack {
  constructor(scope: Construct, id: string, props: TnmAppProps) {
    super(scope, id, props.stackProps);

    const awsNextLayer = new LayerVersion(this, 'tnm-v3-aws-next-layer', {
      code: Code.fromAsset(path.resolve(projectRoot, "out_lambda", "layer"))
    })

    const api = new RestApi(this, "api", {
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS
      },
      restApiName: `${props.envName}-app-render`
    })

    fs.readdirSync(path.resolve(projectRoot, "out_lambda", "lambda")).forEach((name) => {
      const parts = name.split("_")
      const pageName = parts[parts.length - 1]

      const build = path.resolve(projectRoot, "build", name) 

      fs.copySync(path.resolve(projectRoot, '.next', 'serverless'), build)
      fs.copySync(path.resolve(projectRoot, "out_lambda", "lambda", name), path.resolve(build, "page"))
            
      const pageFunction = new Function(this, `tnm-v3-${pageName}`, {
        functionName: `tnm-v3-${pageName}-handler`,
        runtime: Runtime.NODEJS_14_X,
        handler: 'page/handler.render',
        code: Code.fromAsset(build),
        layers: [awsNextLayer]
      })

      const resource = pageName === 'index' ? api.root : api.root.addResource(pageName)
      resource.addMethod("GET", new LambdaIntegration(pageFunction))
    });
  }
}

const app = new App();

const env = {
  account: "568693217207",
  region: "eu-west-2"
}

new TnmV3Stack(app, 'tnm-v3-dev-stack', { envName: 'dev', transient: true, stackProps: { env } });

app.synth();
