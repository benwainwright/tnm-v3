import { App, Stack } from "@aws-cdk/core";
import { GraphqlCrudResolver } from "./graphql-crud-resolver"

describe("The graphql crud resolver", () => {
  it("throws an error if you try to synthesize the stack without an api", () => {
    const app = new App();
    const stack = new Stack(app, 'my-stack')

    new GraphqlCrudResolver(stack, "customers-resolver", {
      resourceName: "customer"
    })

    expect(() => app.synth()).toThrow(new Error("Api was not configured"))
  })
})
