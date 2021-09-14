import jwkToPem from "jwk-to-pem";
import { getIssuer } from "./get-issuer";
import * as Axios from "axios";
import { PublicKeyMeta } from "./public-key-meta";

interface PublicKey {
  alg: string;
  e: string;
  kid: string;
  kty: "RSA";
  n: string;
  use: string;
}


interface PublicKeys {
  keys: PublicKey[];
}

interface MapOfKidToPublicKey {
  [key: string]: PublicKeyMeta;
}


let cacheKeys: MapOfKidToPublicKey | undefined;
export const getPublicKeys = async (): Promise<MapOfKidToPublicKey> => {
  if (!cacheKeys) {
    const url = `${getIssuer()}/.well-known/jwks.json`;
    const publicKeys = await Axios.default.get<PublicKeys>(url);
    cacheKeys = publicKeys.data.keys.reduce((agg, current) => {
      const pem = jwkToPem(current);
      agg[current.kid] = { instance: current, pem };
      return agg;
    }, {} as MapOfKidToPublicKey);
    return cacheKeys;
  } else {
    return cacheKeys;
  }
};
