import { IGraphqlApi } from "@aws-cdk/aws-appsync";
import { Construct } from "@aws-cdk/core";
import { makeTable } from "./make-data-tables"
import { generateResolverLambda } from "./make-resolver-lambda";

export const makeDataEntity = (context: Construct, name: string, env: string, transient: boolean, api: IGraphqlApi, handlerFolder: string) => {
  const table = makeTable(context, name, env, transient)

  generateResolverLambda(context, api, envName, name, "Query", )
}
