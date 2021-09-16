import * as AWSMock from "aws-sdk-mock";
import AWS, { AWSError, Request } from "aws-sdk";
import { DynamoDbDataService } from "./dynamodb-data-service";
import { when } from "jest-when";
import { Customer, Snack } from "@app/types";

describe("dynamodb data service", () => {
  beforeEach(() => {
    AWSMock.setSDKInstance(AWS);
  });

  afterEach(() => {
    AWSMock.restore();
  });

  describe("the get method", () => {
    it("should throw an error if you supply more than 100 ids", async () => {
      const service = new DynamoDbDataService("customers");

      const ids = Array.from(Array(101).keys()).map(String)

      await expect(service.get(...ids)).rejects.toThrow(new Error("Cannot get more than 100 items at once"))
    })

    it("should call batchGet with the correct params when passed a single argument and return the results", async () => {
      const batchGetSpy = jest.fn();

      AWSMock.mock(
        "DynamoDB.DocumentClient",
        "batchGet",
        (
          params: AWS.DynamoDB.DocumentClient.BatchGetItemInput,
          callback: (
            error: AWSError | null,
            output: AWS.DynamoDB.DocumentClient.BatchGetItemOutput
          ) => Request<AWS.DynamoDB.DocumentClient.BatchGetItemOutput, AWSError>
        ) => {
          callback(null, batchGetSpy(params));
        }
      );

      const getInput: AWS.DynamoDB.DocumentClient.BatchGetItemInput = {
        RequestItems: {
          customers: {
            Keys: [{ id: "7" }],
          },
        },
      };

      const mockCustomer: Customer = {
        id: "7",
        firstName: "Ben",
        surname: "Wainwright",
        salutation: "mr",
        address: "",
        telephone: "123",
        email: "a@b.c",
        daysPerWeek: 3,
        plan: {
          name: "Mass 2",
          mealsPerDay: 2,
          category: "Mass",
          costPerMeal: 200,
        },
        snack: Snack.Large,
        breakfast: true,
        exclusions: [],
      };

      const getOutput: AWS.DynamoDB.DocumentClient.BatchGetItemOutput = {
        Responses: {
          customers: [mockCustomer],
        },
      };

      when(batchGetSpy).calledWith(getInput).mockReturnValue(getOutput);

      const service = new DynamoDbDataService("customers");

      const result = await service.get("7");

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(mockCustomer);
    });
  });

  describe("the put method", () => {
    it("should call transactWrite with the correct params when passed one argument", async () => {

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


      const mockCustomer: Customer = {
        id: "7",
        firstName: "Ben",
        surname: "Wainwright",
        salutation: "mr",
        address: "",
        telephone: "123",
        email: "a@b.c",
        daysPerWeek: 3,
        plan: {
          name: "Mass 2",
          mealsPerDay: 2,
          category: "Mass",
          costPerMeal: 200,
        },
        snack: Snack.Large,
        breakfast: true,
        exclusions: [],
      };

      const service = new DynamoDbDataService("customers");
      await service.put(mockCustomer);

      expect(transactWriteSpy).toBeCalledWith({
        TransactItems: [{
          Put: {
            TableName: 'customers',
            Item: mockCustomer,
          },
        }],
      })
    });
  })

  describe("the remove method", () => {
    it("should call transactWrite with the correct params when passed one argument", async () => {
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
  });

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

      service.remove(...ids);

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

      await service.remove("1", "2");

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
