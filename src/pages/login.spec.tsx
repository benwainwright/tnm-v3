import { mocked } from "ts-jest/utils"
import { render, screen } from "@testing-library/react"
import { currentUser } from "@app/aws/authenticate"
import Login from "./login.page"

jest.mock("@app/utils/navigate")
jest.mock("@app/aws/authenticate")

test("The login page shows the login tab by default", async () => {
  const user = jest.fn()
  mocked(currentUser).mockResolvedValue(user)

  render(<Login />)

  const forgot = await screen.findByText("Forgot your password?")

  expect(forgot).toBeInTheDocument()
})
