import * as AWSMock from "aws-sdk-mock";
import AWS, { AWSError, Request } from "aws-sdk";
import { DynamoDbDataService } from "./dynamodb-data-service";

type DC = AWS.DynamoDB.DocumentClient;

describe("dynamodb data service", () => {
  beforeEach(() => {
    AWSMock.setSDKInstance(AWS);
  });

  afterEach(() => {
    AWSMock.restore();
  });

  describe("the remove method", () => {
    it("should call transactUpdate with the correct params", async () => {
      const transactWriteSpy = jest.fn();

      AWSMock.mock(
        "DynamoDB.DocumentClient",
        "transactWrite",
        (
          params: AWS.DynamoDB.DocumentClient.TransactWriteItemsInput,
          callback: (
            error: AWSError | null,
            output: AWS.DynamoDB.DocumentClient.TransactWriteItemsOutput
          ) => Request<
            AWS.DynamoDB.DocumentClient.TransactWriteItemsOutput,
            AWSError
          >
        ) => {
          callback(null, transactWriteSpy(params));
        }
      );

      const service = new DynamoDbDataService("customers");

      await service.remove("1");

      expect(transactWriteSpy).toHaveBeenCalledWith({
        TransactItems: [
          {
            Update: {
              ExpressionAttributeValues: {
                ":newvalue": true,
              },
              Key: {
                id: "1",
              },
              TableName: "customers",
              UpdateExpression: "SET deleted = :newvalue",
            },
          },
        ],
      });
    });
  })

  describe("the removeAll method", () => {
    it("should call transactUpdate with the correct params", async () => {
      const transactWriteSpy = jest.fn();

      AWSMock.mock(
        "DynamoDB.DocumentClient",
        "transactWrite",
        (
          params: AWS.DynamoDB.DocumentClient.TransactWriteItemsInput,
          callback: (
            error: AWSError | null,
            output: AWS.DynamoDB.DocumentClient.TransactWriteItemsOutput
          ) => Request<
            AWS.DynamoDB.DocumentClient.TransactWriteItemsOutput,
            AWSError
          >
        ) => {
          callback(null, transactWriteSpy(params));
        }
      );

      const service = new DynamoDbDataService("customers");

      await service.removeAll(["1", "2"]);

      expect(transactWriteSpy).toHaveBeenCalledWith({
        TransactItems: [
          {
            Update: {
              ExpressionAttributeValues: {
                ":newvalue": true,
              },
              Key: {
                id: "1",
              },
              TableName: "customers",
              UpdateExpression: "SET deleted = :newvalue",
            },
          },
          {
            Update: {
              ExpressionAttributeValues: {
                ":newvalue": true,
              },
              Key: {
                id: "2",
              },
              TableName: "customers",
              UpdateExpression: "SET deleted = :newvalue",
            },
          },
        ],
      });
    });
  });
});
