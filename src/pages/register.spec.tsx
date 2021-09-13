import { currentUser } from "@app/aws/authenticate"
import { render, screen } from "@testing-library/react"
import { mocked } from "ts-jest/utils"
import Register from "./register.page"

jest.mock("@app/aws/authenticate")
jest.mock("@app/utils/navigate")

test("The register page shows the register tab by default", async () => {
  const user = jest.fn()
  mocked(currentUser).mockResolvedValue(user)

  render(<Register />)

  const forgot = await screen.findByText("Verify Password")

  expect(forgot).toBeInTheDocument()
})
