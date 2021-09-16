import { DatabaseReader } from "../../types/database-reader"
import { DatabaseWriter } from "../../types/database-writer"
import { DatabaseDeleter } from "../../types/database-deleter"

import { Customer } from "../../types"

export interface TokenMap {
  CustomerReader: DatabaseReader<Customer>
  CustomerWriter: DatabaseWriter<Customer>
  CustomerDeleter: DatabaseDeleter
}
