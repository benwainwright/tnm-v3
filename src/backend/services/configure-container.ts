import { DynamoDbDataService } from "../../aws/dynamodb-data-service";
import { Container } from "./container";
import { makeServiceInjector } from "./make-service-injector";
import { TokenMap } from "./token-map";

export const container = new Container<TokenMap>();

const customers = new DynamoDbDataService("customers");

container.bind("CustomerReader").toConstantValue(customers);
container.bind("CustomerWriter").toConstantValue(customers);
container.bind("CustomerDeleter").toConstantValue(customers);

export const makeHandler = makeServiceInjector(container);
