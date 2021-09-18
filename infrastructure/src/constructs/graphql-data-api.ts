import { Construct } from "@aws-cdk/core";
import { IResolver } from "./graphql-crud-resolver"
import { IGraphqlApi } from "@aws-cdk/aws-appsync";
import { GraphqlApi, GraphqlApiProps } from "@aws-cdk/aws-appsync";


interface GraphqlDataApiProps extends GraphqlApiProps {
  handlersFolder: string
  resolvers: IResolver[]
}

export class GraphqlDataApi extends Construct {

  public readonly api: IGraphqlApi
  public readonly handlersFolder: string

  constructor(scope: Construct, id: string, props: GraphqlDataApiProps) {
    super(scope, id)
    this.api = new GraphqlApi(this, `${id}-api`, props);
    this.handlersFolder = props.handlersFolder
    props.resolvers.forEach(resolver => resolver.setApi(this))
  }
}
