import { IGraphqlApi } from "@aws-cdk/aws-appsync";
import { Construct } from "@aws-cdk/core";
import { getResourceName } from "./get-resource-name";

import * as lambda from "@aws-cdk/aws-lambda";

type ResolverType = "Query" | "Mutation";

export const generateResolverLambda = (
  context: Construct,
  api: IGraphqlApi,
  envName: string,
  name: string,
  type: ResolverType,
  handlerFolder: string,
  environment: { [key: string]: string }
) => {
  const baseName = `${name}-${type.toLocaleLowerCase()}`;

  const resolverLambda = new lambda.Function(context, baseName, {
    functionName: getResourceName(baseName, envName),
    runtime: lambda.Runtime.NODEJS_14_X,
    handler: `${name}.handler`,
    code: lambda.Code.fromAsset(handlerFolder),
    memorySize: 1024,
    environment,
  });

  const lambdaDataSource = api.addLambdaDataSource(
    `${name}DataSource`,
    resolverLambda
  );

  lambdaDataSource.createResolver({
    typeName: type,
    fieldName: name,
  });
};
