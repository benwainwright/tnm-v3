import { AppSyncResolverHandler } from "aws-lambda";
import { Customer } from "../../types";
import { makeHandler } from "../services/configure-container";

const withServices = makeHandler<AppSyncResolverHandler<void, Customer[]>>();

export const handler = withServices(
  async ({ customerReader }) => customerReader.get(),
  "CustomerReader"
);
