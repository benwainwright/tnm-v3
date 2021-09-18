import { AppSyncResolverHandler } from "aws-lambda";
import * as uuid from "uuid";
import { Customer } from "../../types";
import { makeHandler } from "../services/configure-container";

const withServices = makeHandler<AppSyncResolverHandler<Customer, Customer>>();

export const handler = withServices(async ({ customerWriter, event }) => {
  const newCustomer = { ...event.arguments, id: uuid.v4() };
  customerWriter.put(newCustomer);
  return newCustomer;
}, "CustomerWriter");
