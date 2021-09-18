import "jest-extended";
import "jest-enzyme";
import "@testing-library/jest-dom/extend-expect";
import { logger } from "@app/utils/logger";

import { createSerializer, matchers } from "@emotion/jest";
import Adapter from "@wojtekmaj/enzyme-adapter-react-17";
import Enzyme from "enzyme";

logger.setSettings({ type: "hidden" });

expect.extend(matchers);

Enzyme.configure({ adapter: new Adapter() });

expect.addSnapshotSerializer(createSerializer());
