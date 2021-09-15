import { validToken } from "./test-tokens";
import { verifyJwtToken } from "./verify-jwt";

describe("verify JWT", () => {
  beforeEach(() => {
    process.env.COGNITO_POOL_ID = "us-east-1_nfWupeuVh";
    process.env.AWS_REGION = "us-east-1";
    jest
      .useFakeTimers("modern")
      .setSystemTime(new Date("2021-09-14").getTime());
  });

  it.each`
    token
    ${""}
    ${"aaa"}
    ${"aaa."}
    ${"aaa.."}
    ${"aaa.a."}
    ${"ba2.a."}
    ${".a.a"}
    ${"some words"}
    ${"<!DOCTYPE html>"}
    ${"{ }"}
    ${".a.a"}
  `(
    "fails verification when supplied with incorrectly formatted token '$token' with the error 'Token is invalid'",
    async ({ token }) => {
      const result = await verifyJwtToken(token);

      expect(result.isValid).toBeFalse();
      expect(result.error).toBeDefined();
      expect(result.error.message).toEqual("Token is invalid");
    }
  );

  it("fails verification if the user pool is not configured", async () => {
    delete process.env.COGNITO_POOL_ID;
    const result = await verifyJwtToken(validToken);
    expect(result.isValid).toBeFalse();
    expect(result.error.message).toEqual("COGNITO_POOL_ID not configured");
  });

  it("passes verification when passed a valid token that hasn't expired", async () => {
    jest.setSystemTime(new Date("2021-09-14T12:20:00"));
    const result = await verifyJwtToken(validToken);
    expect(result.isValid).toBeTrue();
  });

  it("fails verification when passed a valid token that has expired", async () => {
    jest.setSystemTime(new Date("2020-09-14T12:20:00"));
    const result = await verifyJwtToken(validToken);
    expect(result.isValid).toBeFalse();
    expect(result.error.message).toEqual("Token has expired");
  });
});
