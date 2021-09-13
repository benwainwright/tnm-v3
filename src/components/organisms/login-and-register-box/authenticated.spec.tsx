import Authenticated, { Redirect } from "./authenticated"
import { currentUser } from "@app/aws/authenticate"
import { mocked } from "ts-jest/utils"
import { render, screen, waitFor } from "@testing-library/react"
import { navigate } from "@app/utils/navigate"

jest.mock("@app/aws/authenticate")
jest.mock("@app/utils/navigate")

describe("The <Authenticated> component", () => {
  it("Redirects to /login/ when no user has been found", async () => {
    mocked(currentUser).mockReturnValue(Promise.resolve())

    render(<Authenticated redirect={Redirect.IfLoggedOut}>Hello!</Authenticated>)

    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/login/"))
  })
})
