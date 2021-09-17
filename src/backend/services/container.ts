import { Container as InversifyContainer, interfaces } from "inversify";

import { Handler } from "aws-lambda";

type MappedInjections<T, P extends ReadonlyArray<keyof T>> = {
  [K in keyof P]: P[K] extends P[number] ? T[P[K]] : never;
};

type ServiceObject<T, P extends ReadonlyArray<keyof T>> = {
  [K in keyof T as K extends P[number]
    ? Uncapitalize<K & string>
    : never]: T[K];
};

export class Container<T> {
  public readonly rawContainer: InversifyContainer;

  constructor() {
    this.rawContainer = new InversifyContainer();
  }

  private get<I extends keyof T>(serviceIdentifier: I): T[I] {
    if (typeof serviceIdentifier !== "string") {
      throw new Error("You can only use a string as service identifier");
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
      throw new Error("You can only use a string as service identifier");
    }
    return this.rawContainer.bind(serviceIdentifier);
  }
}

type HandlerWithServices<
  H extends Handler<any, any>,
  T,
  S extends any[]
> = H extends (...args: infer Args) => infer ReturnValue
  ? (
      args: { event: Args[0]; context: Args[1] } & ServiceObject<T, S>
    ) => ReturnValue
  : never;

export const makeServiceInjector = <T>(container: Container<T>) => <
  H extends Handler
>() => <S extends (keyof T)[]>(
  handler: HandlerWithServices<H, T, S>,
  ...identifiers: S
) => {
  return async (event: Parameters<H>[0], context: Parameters<H>[1]) => {
    const services = container.serviceObject(...identifiers);
    return await handler({ context, event, ...services });
  };
};
