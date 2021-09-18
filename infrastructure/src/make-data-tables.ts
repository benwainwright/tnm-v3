import { RemovalPolicy } from '@aws-cdk/core';
import {
  AttributeType,
  BillingMode,
  Table,
} from '@aws-cdk/aws-dynamodb';
import { Construct } from "@aws-cdk/core";
import { getResourceName } from './get-resource-name';

export const makeTable = (
  context: Construct,
  name: string,
  env: string,
  transient: boolean,
) =>
  new Table(context, `${name}-table`, {
    removalPolicy: transient ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN,
    tableName: getResourceName(`${name}-table`, env),
    billingMode: BillingMode.PAY_PER_REQUEST,
    partitionKey: {
      name: 'id',
      type: AttributeType.STRING,
    },
  });

export const makeDataTables = (
  context: Construct,
  transient: boolean,
  envName: string,
) => {
  makeTable(context, 'customisations', envName, transient);
  makeTable(context, 'customers', envName, transient);
  makeTable(context, 'recipes', envName, transient);
};
