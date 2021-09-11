import { App, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from "path";
import { deployStatics } from './deploy-statics';
import { makePagesApi } from './make-pages-api';

const projectRoot = path.resolve(__dirname, "..", "..")

interface TnmAppProps {
  envName: string;
  transient: boolean;
  stackProps: StackProps;
}


export class TnmV3Stack extends Stack {
  constructor(scope: Construct, id: string, props: TnmAppProps) {
    super(scope, id, props.stackProps);

    const lambdaFolder = path.resolve(projectRoot, "out_lambda")
    const exportFolder = path.resolve(projectRoot, "out")

    const { distribution } = makePagesApi(this, lambdaFolder, props.envName, projectRoot)

    deployStatics(this, exportFolder, props.envName, distribution)
  }
}

const app = new App();

const env = {
  account: "568693217207",
  region: "eu-west-2"
}

new TnmV3Stack(app, 'tnm-v3-dev-stack', { envName: 'dev', transient: true, stackProps: { env } });

app.synth();
