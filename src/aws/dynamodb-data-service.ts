import { Customer } from "@app/types";
import { DatabaseDeleter } from "@app/types/database-deleter";
import { DatabaseWriter } from "@app/types/database-writer";
import { DatabaseReader } from "@app/types/database-reader";
import { batchArray } from "@app/utils";
import AWS from "aws-sdk";

interface MappingTable {
  customers: Customer;
  foo: { id: string; name: string };
}

const TRANSACT_ITEMS_MAX_SIZE = 25;

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

  public async put(
    item: MappingTable[TN],
    ...items: MappingTable[TN][]
  ): Promise<void>;
  public async put(...items: MappingTable[TN][]): Promise<void> {
    if (items.length === 0) {
      return;
    }

    const params = {
      TransactItems: items.map((item) => ({
        Put: {
          TableName: "customers",
          Item: item,
        },
      })),
    };

    await this.dynamoDb.transactWrite(params).promise();
  }

  private async getByIds(...ids: string[]): Promise<MappingTable[TN][]> {
    if (ids.length > 100) {
      throw new Error("Cannot get more than 100 items at once");
    }

    const params = {
      RequestItems: {
        [this.defaultParams.TableName]: {
          Keys: ids.map((id) => ({ id })),
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

  private async getAll(): Promise<MappingTable[TN][]> {
    const response = await this.dynamoDb.scan(this.defaultParams).promise();

    return (response.Items ?? []) as MappingTable[TN][];
  }

  public async get(...ids: string[]): Promise<MappingTable[TN][]> {
    if (ids.length === 0) {
      return await this.getAll();
    }

    return await this.getByIds(...ids);
  }

  public async remove(id: string, ...ids: string[]): Promise<void>;
  public async remove(...ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    await Promise.all(
      batchArray(ids, TRANSACT_ITEMS_MAX_SIZE).map(async (batch) => {
        /* eslint-disable @typescript-eslint/naming-convention */
        const params = {
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
        };
        await this.dynamoDb.transactWrite(params).promise();
      })
    );
  }
}
