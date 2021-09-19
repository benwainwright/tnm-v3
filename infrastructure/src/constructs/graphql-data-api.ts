import { Construct } from "@aws-cdk/core";
import { IResolver } from "./graphql-crud-resolver";
import { AuthorizationType, IGraphqlApi } from "@aws-cdk/aws-appsync";
import { GraphqlApi, GraphqlApiProps } from "@aws-cdk/aws-appsync";
import { IUserPool } from "@aws-cdk/aws-cognito";

interface GraphqlDataApiProps extends GraphqlApiProps {
  handlersFolder: string;
  resolvers: IResolver[];
  transient?: boolean;
  userPool?: IUserPool;
}

export class GraphqlDataApi extends Construct {
  public readonly graphqlApi: IGraphqlApi;
  public readonly handlersFolder: string;
  public readonly transient?: boolean;
  public readonly name: string;

  constructor(scope: Construct, id: string, props: GraphqlDataApiProps) {
    super(scope, id);
    const apiProps = props.userPool
      ? {
          ...props,
          authorizationConfig: {
            defaultAuthorization: {
              authorizationType: AuthorizationType.USER_POOL,
              userPoolConfig: {
                userPool: props.userPool,
              },
            },
          },
        }
      : props;
    this.graphqlApi = new GraphqlApi(this, `${id}-api`, apiProps);
    this.handlersFolder = props.handlersFolder;
    this.transient = props.transient;
    this.name = props.name;
    props.resolvers.forEach((resolver) => resolver.setApi(this));
  }
}
