import { FC, useEffect } from "react";
import { currentUser } from "@app/aws/authenticate";
import { navigate } from "@app/utils/navigate";

export enum Redirect {
  IfLoggedIn,
  IfLoggedOut,
}

interface AuthenticatedProps {
  redirect: Redirect;
  redirectPath?: string;
}

const Authenticated: FC<AuthenticatedProps> = (props) => {
  useEffect(() => {
    (async () => {
      const foundUser = await currentUser();
      if (
        (!foundUser && props.redirect === Redirect.IfLoggedOut) ||
        (foundUser && props.redirect === Redirect.IfLoggedIn)
      ) {
        navigate(props.redirectPath ?? "/login/");
      }
    })();
  }, [props.redirectPath, props.redirect]);

  return <>{props.children}</>;
};

export default Authenticated;
