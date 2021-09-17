import { Customer } from "@app/types";
import { DatabaseDeleter } from "@app/types/database-deleter";
import { DatabaseWriter } from "@app/types/database-writer";
import { DatabaseReader } from "@app/types/database-reader";
import { batchArray } from "@app/utils";
import AWS, { AWSError, Request } from "aws-sdk";

interface MappingTable {
  customers: Customer;
  foo: { id: string; name: string };
}

const TRANSACT_ITEMS_MAX_SIZE = 25;
const BATCH_GET_ITEMS_MAX_SIZE = 100;

const batchMapPromises = async <T, O extends any[] | void>(
  input: T[],
  batchSize: number,
  callback: (batch: T[]) => Promise<O>
) => {
  const responses = await Promise.all(
    batchArray(input, batchSize).map(callback)
  );
  return responses.flat();
};

type RequestFunctions = (
  params: AWS.DynamoDB.DocumentClient.TransactWriteItemsInput
) => Request<AWS.DynamoDB.DocumentClient.TransactWriteItemsOutput, AWSError>;

type GetInputType<T extends (param: unknown) => unknown> = T extends (
  params: infer Params
) => unknown
  ? Params
  : never;


export class DynamoDbDataService<TN extends keyof MappingTable>
  implements
    DatabaseDeleter,
    DatabaseWriter<MappingTable[TN]>,
    DatabaseReader<MappingTable[TN]> {
  private dynamoDb = new AWS.DynamoDB.DocumentClient({ region: "us-east-1" });
  private defaultParams: { TableName: string };

  public constructor(tableName: TN) {
    this.defaultParams = { TableName: tableName };
  }

  public async put(...items: MappingTable[TN][]): Promise<void> {
    await this.transactWrite(
      items,
      (batch) => ({
        TransactItems: batch.map((item) => ({
          Put: {
            TableName: "customers",
            Item: item,
          },
        })),
      })
    );
  }

  public async get(...ids: string[]): Promise<MappingTable[TN][]> {
    if (ids.length === 0) {
      return await this.getAll();
    }

    return await this.getByIds(...ids);
  }

  public async remove(...ids: string[]): Promise<void> {
    await this.transactWrite(ids, (batch) => ({
      TransactItems: batch.map((id) => ({
        Update: {
          ...this.defaultParams,
          UpdateExpression: "SET deleted = :newvalue",
          ExpressionAttributeValues: { ":newvalue": true },
          Key: {
            id,
          },
        },
      })),
    }));
  }

  private async batchRequest <T, R extends RequestFunctions>(
    input: T[],
    batchSize: number,
    requestFunc: R,
    paramFunc: (batch: T[]) => GetInputType<R>
  )  {
    await batchMapPromises<T, void>(input, batchSize, async (batch) => {
      await requestFunc(paramFunc(batch)).promise();
    });
  };

  private async transactWrite<T>(
    input: T[],
    paramFunc: (batch: T[]) => AWS.DynamoDB.DocumentClient.TransactWriteItemsInput
  ) {
    await this.batchRequest(
      input,
      TRANSACT_ITEMS_MAX_SIZE,
      this.dynamoDb.transactWrite.bind(this.dynamoDb),
      paramFunc
    );
  }

  private async getByIds(...ids: string[]): Promise<MappingTable[TN][]> {
    return await batchMapPromises(
      ids,
      BATCH_GET_ITEMS_MAX_SIZE,
      async (batch) => {
        const params = {
          RequestItems: {
            [this.defaultParams.TableName]: {
              Keys: batch.map((id) => ({ id })),
            },
          },
        };

        const results = await this.dynamoDb.batchGet(params).promise();

        return (
          (results.Responses?.[
            this.defaultParams.TableName
          ] as MappingTable[TN][]) ?? []
        );
      }
    );
  }

  private async getAll(): Promise<MappingTable[TN][]> {
    const response = await this.dynamoDb.scan(this.defaultParams).promise();

    return (response.Items ?? []) as MappingTable[TN][];
  }
}
