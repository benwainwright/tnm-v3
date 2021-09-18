import { Construct, RemovalPolicy } from "@aws-cdk/core";
import { Function, Runtime, Code } from "@aws-cdk/aws-lambda";
import { GraphqlDataApi } from "./graphql-data-api";
import { AttributeType, BillingMode, Table } from "@aws-cdk/aws-dynamodb";
import { getResourceName } from "../get-resource-name";

interface GraphqlCrudResolverProps {
  resourceName: string 
  transient: boolean
  envName: string
}

type ResolverType = "Query" | "Mutation";

export interface IResolver {
  setApi(api: GraphqlDataApi): void
}

export class GraphqlCrudResolver extends Construct {
  private api?: GraphqlDataApi
  private resourceName: string

  constructor(scope: Construct, id: string, props: GraphqlCrudResolverProps) {
    super(scope, id)
    this.resourceName = props.resourceName

    new Table(this, `${props.resourceName}-table`, {
      removalPolicy: props.transient ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN,
      tableName: getResourceName(`${props.resourceName}-table`, props.resourceName),
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
    });
  }

  override prepare(): void {
    this.generateResolverLambda(this.resourceName, "Query")
    this.generateResolverLambda(`create${this.resourceName}`, "Mutation")
    this.generateResolverLambda(`update${this.resourceName}`, "Mutation")
    this.generateResolverLambda(`delete${this.resourceName}`, "Mutation")
  }

  private generateResolverLambda(name: string, type: ResolverType) {
    const dataApi = this.api
    if(!dataApi) {
      throw new Error("Api was not configured")
    }

    const baseName = `${name}-${type.toLocaleLowerCase()}`;

    const resolverLambda = new Function(this, baseName, {
      functionName: `${baseName}-resolver-lambda`,
      runtime: Runtime.NODEJS_14_X,
      handler: `${name}.handler`,
      code: Code.fromAsset(dataApi.handlersFolder),
      memorySize: 1024,
    });

    const lambdaDataSource = dataApi.api.addLambdaDataSource(
      `${baseName}-data-source`,
      resolverLambda
    );

    lambdaDataSource.createResolver({
      typeName: type,
      fieldName: name,
    });
  }

  public setApi(api: GraphqlDataApi): void {
    this.api = api
  }
}

