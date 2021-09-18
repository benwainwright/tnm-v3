import { Construct } from "@aws-cdk/core";
import { IResolver } from "./graphql-crud-resolver"
import { IGraphqlApi } from "@aws-cdk/aws-appsync";
import { GraphqlApi, GraphqlApiProps } from "@aws-cdk/aws-appsync";


interface GraphqlDataApiProps extends GraphqlApiProps {
  handlersFolder: string
  resolvers: IResolver[]
  transient?: boolean;
  envName: string
}

export class GraphqlDataApi extends Construct {
  public readonly graphqlApi: IGraphqlApi
  public readonly handlersFolder: string
  public readonly transient?: boolean;
  public readonly envName: string
  public readonly name: string

  constructor(scope: Construct, id: string, props: GraphqlDataApiProps) {
    super(scope, id)
    this.graphqlApi = new GraphqlApi(this, `${id}-api`, props);
    this.handlersFolder = props.handlersFolder
    this.transient = props.transient
    this.envName = props.envName
    this.name = props.name
    props.resolvers.forEach(resolver => resolver.setApi(this))
  }
}
