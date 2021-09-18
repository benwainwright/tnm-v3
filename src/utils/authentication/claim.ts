export interface Claim {
  token_use: string;
  auth_time: number;
  iss: string;
  exp: number;
  "cognito:groups"?: string[];
  username: string;
  client_id: string;
}
