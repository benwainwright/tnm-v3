import { verifyJwtToken } from "./verify-jwt"

describe("verify JWT", () => {

  it.each`
  token
  ${''}
  ${'aaa'}
  ${'aaa.'}
  ${'aaa..'}
  ${'aaa.a.'}
  ${'ba2.a.'}
  ${'.a.a'}
  ${'some words'}
  ${'<!DOCTYPE html>'}
  ${'{ }'}
  ${'.a.a'}
  `
  ("fails verification when supplied with invalid token '$token' with the error 'Token is invalid'", async ({ token }) => {
    const result = await verifyJwtToken(token);

    expect(result.isValid).toBeFalse()
    expect(result.error).toBeDefined()
    expect(result.error.message).toEqual('Token is invalid')
  })

  it("fails verification when supplied with a valid token that is expired with the rror 'Token has expired'", async () => {
    const token = `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.POstGetfAytaZS82wHcjoTyoqhMyxXiWdR7Nn7A29DNSl0EiXLdwJ6xC6AfgZWF1bOsS_TuYI3OG85AmiExREkrS6tDfTQ2B3WXlrr-wp5AokiRbz3_oB4OxG-W9KcEEbDRcZc0nH3L7LzYptiy1PtAylQGxHTWZXtGz4ht0bAecBgmpdgXMguEIcoqPJ1n3pIWk_dUZegpqx0Lka21H6XxUTxiy8OcaarA8zdnPUnV6AmNP3ecFawIFYdvJB_cm-GvpCSbr8G8y_Mllj8f4x9nBH8pQux89_6gUY618iYv7tuPWBFfEbLxtF2pZS6YC1aSfLQxeNe8djT9YjpvRZA`

    const result = await verifyJwtToken(token);

    expect(result.isValid).toBeFalse()
    expect(result.error).toBeDefined()
  })
})
