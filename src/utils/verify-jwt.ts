/*
 * Borrowed from https://github.com/awslabs/aws-support-tools/blob/master/Cognito/decode-verify-jwt/decode-verify-jwt.ts
 */
import * as Axios from "axios";
import * as jsonwebtoken from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";

export interface ClaimVerifyRequest {
  readonly token?: string;
}

export interface ClaimVerifyResult {
  readonly userName: string;
  readonly isValid: boolean;
  readonly error?: any;
  readonly groups: string[];
}

interface TokenHeader {
  kid: string;
  alg: string;
}

interface PublicKey {
  alg: string;
  e: string;
  kid: string;
  kty: "RSA";
  n: string;
  use: string;
}

interface PublicKeyMeta {
  instance: PublicKey;
  pem: string;
}

interface PublicKeys {
  keys: PublicKey[];
}

interface MapOfKidToPublicKey {
  [key: string]: PublicKeyMeta;
}

interface Claim {
  token_use: string;
  auth_time: number;
  iss: string;
  exp: number;
  "cognito:groups": string[];
  username: string;
  client_id: string;
}

const getIssuer = () => {
  const cognitoPoolId = process.env.COGNITO_POOL_ID || "";
  if (!cognitoPoolId) {
    throw new Error("COGNITO_POOL_ID not configured");
  }
  return `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${cognitoPoolId}`;
};

let cacheKeys: MapOfKidToPublicKey | undefined;
const getPublicKeys = async (): Promise<MapOfKidToPublicKey> => {
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

const verify = async (token: string, key: PublicKeyMeta): Promise<Claim> => {
  return new Promise<Claim>((accept, reject) => jsonwebtoken.verify(token, key.pem, (error, data) => {
    if(error) {
      reject(error)
    } else {
      accept(data as Claim)
    }
  }))
}

const isTokenHeader = (thing: unknown): thing is TokenHeader =>
  Object.hasOwnProperty.call(thing, "kid") &&
  Object.hasOwnProperty.call(thing, "alg")

const parseHeader = (token: string): TokenHeader => {
  const tokenSections = (token || "").split(".");
  if (tokenSections.length < 2) {
    throw new Error("Token is invalid");
  }
  const headerJSON = Buffer.from(tokenSections[0], "base64").toString("utf8");
  try {
    const header = JSON.parse(headerJSON)
    if(isTokenHeader(header)) {
      return header
    }
  } catch(error) {
    throw new Error("Token is invalid");
  }
  throw new Error("Token is invalid");
} 

const getPublicKey = async (header: TokenHeader) => {
  const keys = await getPublicKeys();
  const key = keys[header.kid];
  if (key === undefined) {
    throw new Error("claim made for unknown kid");
  }
  return key
}

export const verifyJwtToken = async (
  token: string
): Promise<ClaimVerifyResult> => {
  try {
    const header = parseHeader(token)
    const key = await getPublicKey(header)
    const claim = await verify(token, key)
    const currentSeconds = Math.floor(new Date(Date.now()).valueOf() / 1000);
    if (currentSeconds > claim.exp || currentSeconds < claim.auth_time) {
      throw new Error("Token has expired");
    }
    if (claim.iss !== getIssuer()) {
      throw new Error("claim issuer is invalid");
    }
    if (claim.token_use !== "access") {
      throw new Error("claim use is not access");
    }
    return {
      userName: claim.username,
      isValid: true,
      groups: claim["cognito:groups"] ?? [],
    };
  } catch (error) {
    return { userName: "", error, isValid: false, groups: [] };
  }
};
