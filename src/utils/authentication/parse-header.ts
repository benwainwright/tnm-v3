import { isTokenHeader, TokenHeader } from "./token-header";

export const parseHeader = (token: string): TokenHeader => {
  const tokenSections = (token || "").split(".");
  if (tokenSections.length < 2) {
    throw new Error("Token is invalid");
  }
  const headerJSON = Buffer.from(tokenSections[0], "base64").toString("utf8");
  try {
    const header = JSON.parse(headerJSON);
    if (isTokenHeader(header)) {
      return header;
    }
  } catch (error) {
    throw new Error("Token is invalid");
  }
  throw new Error("Token is invalid");
};
