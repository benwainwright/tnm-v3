import { Customer } from "../../types";
import { DatabaseDeleter } from "../../types/database-deleter";
import { DatabaseReader } from "../../types/database-reader";
import { DatabaseWriter } from "../../types/database-writer";

export interface TokenMap {
  CustomerReader: DatabaseReader<Customer>;
  CustomerWriter: DatabaseWriter<Customer>;
  CustomerDeleter: DatabaseDeleter;
}
