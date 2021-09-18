// import { SynthUtils } from "@aws-cdk/assert";
import { App, Stack } from "@aws-cdk/core";
import { GraphqlDataApi } from "./graphql-data-api"
import { haveResourceLike, expect as cdkExpect, SynthUtils, Capture } from '@aws-cdk/assert';
import { Schema } from "@aws-cdk/aws-appsync";
import * as path from "path"
import * as fs from 'fs/promises';
import * as os from 'os';
import { vol } from '../test-support';
import { GraphqlCrudResolver } from "./graphql-crud-resolver";

jest.mock("fs")
jest.mock("fs/promises")

describe('the graphql data api construct', () => {

  beforeEach(async () => {
    await fs.mkdir(os.tmpdir(), { recursive: true });
    await fs.mkdir(process.cwd(), { recursive: true })
    const fakeSchema = `
      type Customer {
        username: String!
        firstName: String!
        surname: String!
      }
    `
    await fs.writeFile(path.join(process.cwd(), "schema.graphql"), fakeSchema)
    await fs.mkdir(path.join(process.cwd(), "handlers"))
  });

  afterEach(async () => {
    vol.reset();
  });

  it("Passes props through to the graphql api", async () => {
    const app = new App();
    const stackName = 'my-stack';
    const stack = new Stack(app, stackName);

    new GraphqlDataApi(stack, "data-api", {
      name: 'data-api',
      handlersFolder: "handlers",
      resolvers: [
        new GraphqlCrudResolver(stack, "customers-resolver", {
          resourceName: "customers"
        })
      ],
      envName: 'dev',
      schema: Schema.fromAsset(
        path.resolve(process.cwd(), "schema.graphql")
      ),
    })

    cdkExpect(stack).to(haveResourceLike("AWS::AppSync::GraphQLApi", {
      Name: "data-api"
    }))
  })

  it("Table inherits transience from API", async () => {
    const app = new App();
    const stackName = 'my-stack';
    const stack = new Stack(app, stackName);

    new GraphqlDataApi(stack, "data-api", {
      name: 'data-api',
      handlersFolder: "handlers",
      resolvers: [
        new GraphqlCrudResolver(stack, "customers-resolver", {
          resourceName: "customer"
        })
      ],
      transient: true,
      envName: 'dev',
      schema: Schema.fromAsset(
        path.resolve(process.cwd(), "schema.graphql")
      ),
    })

    const resources = Object.values(SynthUtils.toCloudFormation(stack).Resources)

    const table: any = resources.find((resource: any) => resource.Type === "AWS::DynamoDB::Table")
    expect(table.Properties.TableName).toEqual('data-api-customers-table')
    expect(table.UpdateReplacePolicy).toEqual("Delete")
    expect(table.DeletionPolicy).toEqual("Delete")
  });

  it("Creates a table for the entity which is not transient by default", async () => {
    const app = new App();
    const stackName = 'my-stack';
    const stack = new Stack(app, stackName);

    new GraphqlDataApi(stack, "data-api", {
      name: 'data-api',
      handlersFolder: "handlers",
      resolvers: [
        new GraphqlCrudResolver(stack, "customers-resolver", {
          resourceName: "customer"
        })
      ],
      envName: 'dev',
      schema: Schema.fromAsset(
        path.resolve(process.cwd(), "schema.graphql")
      ),
    })

    const resources = Object.values(SynthUtils.toCloudFormation(stack).Resources)

    const table: any = resources.find((resource: any) => resource.Type === "AWS::DynamoDB::Table")
    expect(table.Properties.TableName).toEqual('data-api-customers-table')
    expect(table.UpdateReplacePolicy).toEqual("Retain")
    expect(table.DeletionPolicy).toEqual("Retain")
  });

  it.each`
  name                  | type
  ${'customers'}        | ${'Query'}
  ${'createCustomer'}   | ${'Mutation'}
  ${'updateCustomer'}   | ${'Mutation'}
  ${'deleteCustomer'}   | ${'Mutation'}
  `("creates a resolver a data source and a lambda for the $name $type which are all attached to the api", async ({ name, type }) => {
    const app = new App();
    const stackName = 'my-stack';
    const stack = new Stack(app, stackName);

    new GraphqlDataApi(stack, "data-api", {
      name: 'data-api',
      handlersFolder: "handlers",
      resolvers: [
        new GraphqlCrudResolver(stack, "customers-resolver", {
          resourceName: "customer"
        })
      ],
      envName: 'dev',
      schema: Schema.fromAsset(
        path.resolve(process.cwd(), "schema.graphql")
      ),
    })

    cdkExpect(stack).to(haveResourceLike("AWS::Lambda::Function", {
      FunctionName: `data-api-${name}-${type.toLocaleLowerCase()}-resolver-lambda`,
      Handler: `${name}.handler`
    }))

    const lambdaKey = Capture.aString()

    cdkExpect(stack).to(haveResourceLike("AWS::AppSync::DataSource", {
      Name: `data-api-${name}-${type.toLocaleLowerCase()}-data-source`,
      Type: "AWS_LAMBDA",
      LambdaConfig: {
        LambdaFunctionArn: {
          "Fn::GetAtt": [
            lambdaKey.capture(),
            "Arn"
          ]
        }
      }
    }))

    const resources = Object.entries(SynthUtils.toCloudFormation(stack).Resources)
    const lambda = resources.find(([key]) => key === lambdaKey.capturedValue)
    expect(lambda).toBeDefined()

    if(lambda) {
      const resource = lambda[1] as { Type: string, Properties: { [key: string]: string } }
      expect(resource.Type).toEqual("AWS::Lambda::Function")
      expect(resource.Properties.FunctionName).toEqual(`data-api-${name}-${type.toLocaleLowerCase()}-resolver-lambda`)
    }

    cdkExpect(stack).to(haveResourceLike("AWS::AppSync::Resolver", {
      FieldName: name,
      TypeName: type.charAt(0).toLocaleUpperCase() + type.slice(1),
      DataSourceName: `data-api-${name}-${type.toLocaleLowerCase()}-data-source`
    }))
  })
})
