import { container } from "../services/configure-container"
import { Customer, Snack } from "../../types";
import { handler } from "./customers"

describe("the customers handler", () => {

  beforeEach(() => {
    container.rawContainer.unbindAll();
  });

  it("returns the results of calling customerReader.get", async () => {

    const mockCustomer: Customer = {
      id: "7",
      firstName: "Ben",
      surname: "Wainwright",
      salutation: "mr",
      address: "",
      telephone: "123",
      email: "a@b.c",
      daysPerWeek: 3,
      plan: {
        name: "Mass 2",
        mealsPerDay: 2,
        category: "Mass",
        costPerMeal: 200,
      },
      snack: Snack.Large,
      breakfast: true,
      exclusions: [],
    };

    container.bind("CustomerReader").toConstantValue({ get: () => Promise.resolve([mockCustomer])})

    const response = await handler({} as any, {} as any, {} as any)

    expect(response).toHaveLength(1)
    expect(response[0]).toEqual(mockCustomer)
  })
})
