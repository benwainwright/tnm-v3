import { PublicKeyMeta } from "./public-key-meta";
import * as jsonwebtoken from "jsonwebtoken";
import { Claim } from "./claim";

export const verify = async (
  token: string,
  key: PublicKeyMeta
): Promise<Claim> => {
  return new Promise<Claim>((accept, reject) =>
    jsonwebtoken.verify(token, key.pem, (error, data) => {
      if (error) {
        reject(error);
      } else {
        accept(data as Claim);
      }
    })
  );
};
