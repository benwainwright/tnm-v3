import "jest-extended";
import "jest-enzyme";
import "@testing-library/jest-dom/extend-expect";

import { createSerializer, matchers } from "@emotion/jest";
import Adapter from "@wojtekmaj/enzyme-adapter-react-17";
import Enzyme from "enzyme";

expect.extend(matchers);

Enzyme.configure({ adapter: new Adapter() });

expect.addSnapshotSerializer(createSerializer());
