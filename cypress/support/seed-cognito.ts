/* eslint-disable fp/no-throw */
/* eslint-disable no-console */

import { CognitoIdentityServiceProvider } from "aws-sdk"

export const TEST_USER = "cypress-test-user-2"
export const TEST_USER_2 = "cypress-test-user-3"

const USER_DOES_NOT_EXIST = "User does not exist."

/* eslint-disable @typescript-eslint/naming-convention */
export interface BackendOutputs {
  [stackName: string]: {
    UserPoolId: string;
  };
}

export const isBackendOutputs = (thing: unknown): thing is BackendOutputs =>
  Object.entries(thing as BackendOutputs).length === 0 ||
  Object.values(thing as BackendOutputs).every((config) =>
    Object.hasOwnProperty.call(config, "UserPoolId")
  );

export const assertIsBackendOutputs: (
  thing: unknown
) => asserts thing is BackendOutputs = (thing) => {
  if (!isBackendOutputs(thing)) {
    throw new Error(
      `Whoops, the config that was loaded wasn't a valid backend configuration`
    );
  }
};

export const seedCognito = async (
  email: string,
  password: string,
  registerUser: string,
  testUserEmail: string,
  testPassword: string
) => {
  const cognito = new CognitoIdentityServiceProvider({
    region: "eu-west-2",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  })

  if (!email) {
    throw new Error("TEST_EMAIL not configured")
  }

  if (!password) {
    throw new Error("TEST_USER_INITIAL_PASSWORD not configured")
  }

  if (!registerUser) {
    throw new Error("TEST_REGISTER_USER not configured")
  }

  const importedConfig = await import(`${process.cwd()}/infrastructure/backend-config.json`);

  const loadedConfig = importedConfig?.default ?? importedConfig;

  assertIsBackendOutputs(loadedConfig);

  const poolId = Object.values(loadedConfig)[0].UserPoolId

  console.log(cognito.config)
  console.log(process.env)

  try {
    console.log(`Deleting ${TEST_USER} from ${poolId}`)
    await cognito
      .adminDeleteUser({
        UserPoolId: poolId,
        Username: TEST_USER
      })
      .promise()
  } catch (error) {
    if (error.message !== USER_DOES_NOT_EXIST) {
      console.log(error.message)
      throw error
    }
    console.log(`Did not delete ${TEST_USER} because the user didn't exist`)
  }
  try {
    console.log(`Deleting ${registerUser} from ${poolId}`)
    await cognito
      .adminDeleteUser({
        UserPoolId: poolId,
        Username: registerUser
      })
      .promise()
  } catch (error) {
    if (error.message !== USER_DOES_NOT_EXIST) {
      console.log(error.message)
      // eslint-disable-next-line fp/no-throw
      throw error
    }
    console.log(`Did not delete ${registerUser} because the user didn't exist`)
  }

  try {
    console.log(`Deleting ${TEST_USER_2} from ${poolId}`)
    await cognito
      .adminDeleteUser({
        UserPoolId: poolId,
        Username: TEST_USER_2
      })
      .promise()
  } catch (error) {
    if (error.message !== USER_DOES_NOT_EXIST) {
      console.log('failed to delete...')
      // eslint-disable-next-line fp/no-throw
      throw error
    }
    console.log(`Did not delete ${TEST_USER_2} because the user didn't exist`)
  }

  const params = {
    UserPoolId: poolId,
    Username: TEST_USER,
    TemporaryPassword: password,
    MessageAction: "SUPPRESS",
    DesiredDeliveryMediums: ["EMAIL"],
    UserAttributes: [
      {
        Name: "email_verified",
        Value: "True"
      },
      {
        Name: "phone_number_verified",
        Value: "True"
      },
      {
        Name: "email",
        Value: email
      },
      {
        Name: "phone_number",
        Value: "+447732432435"
      }
    ]
  }

  console.log(`Seeding ${poolId} with:`, JSON.stringify(params, null, 2))
  await cognito.adminCreateUser(params).promise()

  const params2 = {
    UserPoolId: poolId,
    Username: TEST_USER_2,
    TemporaryPassword: "sWuV9;~y<;",
    MessageAction: "SUPPRESS",
    DesiredDeliveryMediums: ["EMAIL"],
    UserAttributes: [
      {
        Name: "email_verified",
        Value: "True"
      },
      {
        Name: "phone_number_verified",
        Value: "True"
      },
      {
        Name: "email",
        Value: testUserEmail
      },
      {
        Name: "phone_number",
        Value: "+447732432439"
      }
    ]
  }

  console.log(`Seeding ${poolId} with:`, JSON.stringify(params2, null, 2))
  await cognito.adminCreateUser(params2).promise()

  console.log("Password is", testPassword)

  const params4 = {
    Password: testPassword,
    Permanent: true,
    Username: TEST_USER_2,
    UserPoolId: poolId
  }

  console.log(`Changing password with params:`, params4)
  await cognito.adminSetUserPassword(params4).promise()
}
