import * as jsonwebtoken from "jsonwebtoken";
import { verify } from "./verify";
import { mocked } from "ts-jest/utils";
import { PublicKeyMeta } from "./public-key-meta";
import { Secret } from "jsonwebtoken";
import { mock } from "jest-mock-extended";

jest.mock("jsonwebtoken");

type verifyFunc = (
  token: string,
  secretOrPublicKey: Secret | jsonwebtoken.GetPublicKeyOrSecret,
  callback?: jsonwebtoken.VerifyCallback
) => void;

describe("verify", () => {
  it("rejects the promise if the callback returns an error", async () => {
    const error = new jsonwebtoken.TokenExpiredError(
      "expired",
      new Date(Date.now())
    );

    mocked<verifyFunc>(jsonwebtoken.verify).mockImplementation(
      (_token, _key, callback) => {
        callback?.(error, undefined);
      }
    );

    const keyMeta = mock<PublicKeyMeta>();

    await expect(verify("foo", keyMeta)).rejects.toBeInstanceOf(
      jsonwebtoken.TokenExpiredError
    );
  });
});
