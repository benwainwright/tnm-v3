import * as path from "path";
import { App, Stack, StackProps } from "@aws-cdk/core";
import { Construct } from "constructs";
import { deployStatics } from "./deploy-statics";
import { makePagesApi } from "./make-pages-api";
import { makeUserPool } from "./make-user-pool";
import { setupFrontDoor } from "./setup-front-door";
import { GraphqlDataApi } from "./constructs/graphql-data-api";
import { getResourceName } from "./get-resource-name";
import { GraphqlCrudResolver } from "./constructs/graphql-crud-resolver";

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

    new GraphqlDataApi(this, "data-api", {
      name: getResourceName("data-api", props.envName),
      handlersFolder: path.resolve(projectRoot, "backend"),
      resolvers: [
        GraphqlCrudResolver.forEntity(this, "customers-resolver", "customer"),
        GraphqlCrudResolver.forEntity(this, "recipes-resolver", "recipe"),
        GraphqlCrudResolver.forEntity(
          this,
          "customisations-resolver",
          "customisation"
        ),
      ],
      transient,
      userPool,
    });
  }
}

const app = new App();

const account = process.env.IS_CDK_LOCAL ? "000000000000" : "568693217207";

const env = {
  account,
  region: "eu-west-2",
};

new TnmV3Stack(app, "tnm-v3-dev-stack", {
  stackProps: { env },
  envName: "dev",
});

app.synth();
