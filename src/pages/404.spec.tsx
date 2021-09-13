import { Layout } from "@app/components/containers";
import { shallow } from "enzyme";
import NotFoundPage from "./404.page";

describe("The 404 page", () => {
  it("renders everything within the main layout", () => {
    const wrapper = shallow(<NotFoundPage />);

    expect(wrapper.find(Layout)).toHaveLength(1);
  });
});
