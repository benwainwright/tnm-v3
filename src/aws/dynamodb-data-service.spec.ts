import * as AWSMock from "aws-sdk-mock";
import AWS, { AWSError, Request } from "aws-sdk";
import { mock } from "jest-mock-extended"
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
    it("batches items into groups of 25 when passing them through to transactWrite", async () => {
      AWSMock.setSDKInstance(AWS);
      const paramsReceived: AWS.DynamoDB.TransactWriteItemsInput[] = [];
      AWSMock.mock(
        "DynamoDB.DocumentClient",
        "transactWrite",
        (
          params: AWS.DynamoDB.TransactWriteItemsInput,
          callback: (error: Error | undefined) => void
        ) => {
          paramsReceived.push(params);
          callback(undefined);
        }
      );

      const ids = [
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20",
        "21",
        "22",
        "23",
        "24",
        "25",
        "26",
        "26",
        "27",
        "28",
      ];

      const service = new DynamoDbDataService("customers");

      service.removeAll(ids)

      expect(paramsReceived).toHaveLength(2);
      expect(paramsReceived[0].TransactItems).toHaveLength(25);
      expect(paramsReceived[1].TransactItems).toHaveLength(5);
      expect(paramsReceived[0].TransactItems[24].Update?.Key.id).toEqual("24");
      expect(paramsReceived[1].TransactItems[0].Update?.Key.id).toEqual("25");
      expect(paramsReceived[1].TransactItems[4].Update?.Key.id).toEqual("28");
    });

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
