import { Construct, RemovalPolicy } from "@aws-cdk/core";
import { Function, Runtime, Code } from "@aws-cdk/aws-lambda";
import { IGrantable } from "@aws-cdk/aws-iam"
import { GraphqlDataApi } from "./graphql-data-api";
import { AttributeType, BillingMode, Table } from "@aws-cdk/aws-dynamodb";
import pluralize from "pluralize"

interface GraphqlCrudResolverProps {
  resourceName: string 
}

type ResolverType = "Query" | "Mutation";

export interface IResolver {
  setApi(api: GraphqlDataApi): void
}

export class GraphqlCrudResolver extends Construct {
  private api?: GraphqlDataApi
  private resourceName: string

  private prepared = false

  constructor(scope: Construct, id: string, props: GraphqlCrudResolverProps) {
    super(scope, id)
    this.resourceName = props.resourceName
  }

  private capitalize(string: string): string {
    return string.charAt(0).toLocaleUpperCase() + string.slice(1)
  }

  override prepare(): void {

    if(this.prepared) {
      return
    }

    const { resolverLambda: list } = this.generateResolverLambda(pluralize(this.resourceName), "Query")
    const { resolverLambda: create } = this.generateResolverLambda(`create${this.capitalize(this.resourceName)}`, "Mutation")
    const { resolverLambda: update } = this.generateResolverLambda(`update${this.capitalize(this.resourceName)}`, "Mutation")
    const { resolverLambda: remove } = this.generateResolverLambda(`delete${this.capitalize(this.resourceName)}`, "Mutation")
    this.generateDataTable(pluralize(this.resourceName), [list, create, update, remove])
    this.prepared = true;
  }

  private getApi(): GraphqlDataApi {
    const dataApi = this.api
    if(!dataApi) {
      throw new Error("Api was not configured")
    }
    return dataApi
  }

  private generateDataTable(name: string, accessors: IGrantable[]) {
    const dataApi = this.getApi()
    const baseName = `${dataApi.name}-${name}`;
    const table = new Table(this, `${baseName}-table`, {
      removalPolicy: dataApi.transient ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN,
      tableName: `${baseName}-table`,
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
    });

    accessors.forEach(accessor => table.grantReadWriteData(accessor))
  }

  private generateResolverLambda(name: string, type: ResolverType) {
    const dataApi = this.getApi()

    const baseName = `${dataApi.name}-${name}-${type.toLocaleLowerCase()}`;

    const resolverLambda = new Function(this, `${baseName}-resolver-lambda`, {
      functionName: `${baseName}-resolver-lambda`,
      runtime: Runtime.NODEJS_14_X,
      handler: `${name}.handler`,
      code: Code.fromAsset(dataApi.handlersFolder),
      memorySize: 1024,
    });

    const lambdaDataSource = dataApi.graphqlApi.addLambdaDataSource(
      `${baseName}-data-source`,
      resolverLambda
    );

    lambdaDataSource.createResolver({
      typeName: type,
      fieldName: name,
    });

    return { resolverLambda }
  }

  public setApi(api: GraphqlDataApi): void {
    this.api = api
  }
}

