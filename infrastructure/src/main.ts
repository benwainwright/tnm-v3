import { App, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as path from "path";
import { deployStatics } from "./deploy-statics";
import { makeDataTables } from "./make-data-tables";
import { makePagesApi } from "./make-pages-api";
import { makeUserPool } from "./make-user-pool";
import { setupFrontDoor } from "./setup-front-door";

const projectRoot = path.resolve(__dirname, "..", "..");

interface TnmAppProps {
  stackProps: StackProps;
  envName: string;
}

export class TnmV3Stack extends Stack {
  constructor(scope: Construct, id: string, props: TnmAppProps) {
    super(scope, id, props.stackProps);

    const transient = props.envName !== "prod";

    const { userPool } = makeUserPool(this, transient, props.envName);

    const { httpOrigin } = makePagesApi(
      this,
      path.resolve(projectRoot, "out_lambda"),
      props.envName,
      projectRoot,
      userPool
    );

    const { distribution } = setupFrontDoor(this, props.envName, httpOrigin);

    deployStatics(
      this,
      path.resolve(projectRoot, "public"),
      path.resolve(projectRoot, ".next/static"),
      path.resolve(projectRoot, "storybook"),
      props.envName,
      distribution
    );

    makeDataTables(this, transient, props.envName);
  }
}

const app = new App();

const env = {
  account: "568693217207",
  region: "eu-west-2",
};

new TnmV3Stack(app, "tnm-v3-dev-stack", {
  stackProps: { env },
  envName: "dev",
});

app.synth();
