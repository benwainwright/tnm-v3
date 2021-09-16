import { Customer } from "@app/types";
import { Database } from "@app/types/database";
import { batchArray } from "@app/utils";
import AWS from "aws-sdk";

interface MappingTable {
  customers: Customer;
}

const TRANSACT_ITEMS_MAX_SIZE = 25;

export class DynamoDbDataService<TN extends keyof MappingTable>
  implements Database<MappingTable[TN]> {
  private dynamoDb = new AWS.DynamoDB.DocumentClient({ region: "us-east-1" });
  private defaultParams: { TableName: string };

  public constructor(tableName: TN) {
    this.defaultParams = { TableName: tableName };
  }

  public async put(..._item: MappingTable[TN][]): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public async get(...ids: string[]): Promise<MappingTable[TN][]> {
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
