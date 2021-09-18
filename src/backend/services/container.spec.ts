import { Container } from "./container";
import { Container as InversifyContainer, injectable } from "inversify";
describe("the container", () => {
  it("initializes an inversify container which can be accessed via the rawContainer property", () => {
    const container = new Container();
    expect(container.rawContainer).toBeInstanceOf(InversifyContainer);
  });

  it("throws an error if you try to bind with something that isn't a string as a service identifier", () => {
    interface Foo {
      name: string;
    }

    interface TokenMap {
      1: Foo;
    }

    const container = new Container<TokenMap>();
    expect(() => container.bind(1)).toThrow(
      new Error("You can only use a string as a service identifier")
    );
  });

  it("throws an error if you try to get with something that isn't a string as a service identifier", () => {
    interface Foo {
      name: string;
    }

    interface TokenMap {
      1: Foo;
    }

    const container = new Container<TokenMap>();
    expect(() => container.get(1)).toThrow(
      new Error("You can only use a string as a service identifier")
    );
  });

  it("allows you to retreive multiple services with the first letter lowerCased from the serviceObject() method ", () => {
    interface Foo {
      name: string;
    }

    interface Bar {
      pets: number;
    }

    interface TokenMap {
      Foo: Foo;
      Bar: Bar;
    }

    @injectable()
    class ThingThatImplementsFoo {
      name = "name";
    }

    @injectable()
    class ThingThatImplementsBar {
      pets = 3;
    }

    const container = new Container<TokenMap>();

    container.bind("Foo").to(ThingThatImplementsFoo);
    container.bind("Bar").to(ThingThatImplementsBar);

    const object = container.serviceObject("Foo", "Bar");

    expect(object.foo).toBeInstanceOf(ThingThatImplementsFoo);
    expect(object.bar).toBeInstanceOf(ThingThatImplementsBar);
  });

  it("allows you to retreive multiple services as an array from the services() method", () => {
    interface Foo {
      name: string;
    }

    interface Bar {
      pets: number;
    }

    interface TokenMap {
      foo: Foo;
      bar: Bar;
    }

    @injectable()
    class ThingThatImplementsFoo {
      name = "name";
    }

    @injectable()
    class ThingThatImplementsBar {
      pets = 3;
    }

    const container = new Container<TokenMap>();

    container.bind("foo").to(ThingThatImplementsFoo);
    container.bind("bar").to(ThingThatImplementsBar);

    const services = container.services("bar", "foo");

    expect(services[0]).toBeInstanceOf(ThingThatImplementsBar);
    expect(services[1]).toBeInstanceOf(ThingThatImplementsFoo);
  });

  it("allows you to bind an instance within the inversify container that you can later retreive", () => {
    interface Foo {
      name: string;
    }

    interface TokenMap {
      foo: Foo;
    }

    @injectable()
    class ThingThatImplementsFoo {
      name = "name";
    }

    const container = new Container<TokenMap>();
    container.bind("foo").to(ThingThatImplementsFoo);
    const instance = container.get("foo");
    expect(instance).toBeInstanceOf(ThingThatImplementsFoo);
  });
});
