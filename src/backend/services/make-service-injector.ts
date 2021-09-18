import { Handler } from "aws-lambda";
import { Container, ServiceObject } from "./container";

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
    return handler({ context, event, ...services });
  };
};
