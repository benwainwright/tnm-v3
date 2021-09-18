import processFields from "../../process-fields";
import { ArbitraryObjectType } from "../../process-fields";
import processField from "./process-field";

const _dummyObjectType: ArbitraryObjectType | undefined = undefined;
_dummyObjectType;

const process = processFields(",", "\r\n", processField);

export default process;
