import { shallow } from "enzyme"
import Account from "./account.page"

describe("The account page", () => {
  it("renders without error", () => {
    shallow(<Account />)
  })
})
