import "reflect-metadata";
import { Container as InversifyContainer, interfaces } from "inversify";

type MappedInjections<T, P extends ReadonlyArray<keyof T>> = {
  [K in keyof P]: P[K] extends P[number] ? T[P[K]] : never;
};

export type ServiceObject<T, P extends ReadonlyArray<keyof T>> = {
  [K in keyof T as K extends P[number]
    ? Uncapitalize<K & string>
    : never]: T[K];
};

export class Container<T> {
  public readonly rawContainer: InversifyContainer;

  constructor() {
    this.rawContainer = new InversifyContainer();
  }

  public get<I extends keyof T>(serviceIdentifier: I): T[I] {
    if (typeof serviceIdentifier !== "string") {
      throw new Error("You can only use a string as a service identifier");
    }
    return this.rawContainer.get(serviceIdentifier);
  }

  public services<P extends (keyof T)[]>(
    ...serviceIdentifier: P
  ): MappedInjections<T, P> {
    return serviceIdentifier.map((identifier) =>
      this.get(identifier)
    ) as MappedInjections<T, P>;
  }

  public serviceObject<P extends (keyof T)[]>(
    ...serviceIdentifier: P
  ): ServiceObject<T, P> {
    return Object.fromEntries(
      serviceIdentifier.map((identifier) =>
        typeof identifier === "string"
          ? [
              identifier.charAt(0).toLowerCase() + identifier.slice(1),
              this.get(identifier),
            ]
          : []
      )
    ) as ServiceObject<T, P>;
  }

  public bind<I extends keyof T>(
    serviceIdentifier: I
  ): interfaces.BindingToSyntax<T[I]> {
    if (typeof serviceIdentifier !== "string") {
      throw new Error("You can only use a string as a service identifier");
    }
    return this.rawContainer.bind(serviceIdentifier);
  }
}

