import { navigate } from "./navigate";
import Router from "next/router";

jest.mock("next/router");

describe("navigate", () => {
  it("should push the path into the router", () => {
    navigate("foo");
    expect(Router.push).toBeCalledWith("foo");
  });
});
