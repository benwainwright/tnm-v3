import { GetServerSideProps } from "next";
import { backendRedirect } from "./backend-redirect";
import { verifyJwtToken } from "./verify-jwt";

export const authorizedRoute = (
  groups?: string[],
  serverSidePropsCallback?: GetServerSideProps
): GetServerSideProps => {
  return async (context) => {
    const tokenPair = Object.entries(context.req.cookies).find(([key]) =>
      key.endsWith(".accessToken")
    );

    if (!tokenPair || tokenPair.length !== 2) {
      console.log("Redirecting due to invalid token");
      return backendRedirect("login");
    }

    const verifyResult = await verifyJwtToken(tokenPair[1]);

    if (!verifyResult.isValid) {
      console.log("Redirecting due verify failed");
      return backendRedirect("login");
    }

    if (groups?.some((group) => !verifyResult.groups.includes(group))) {
      console.log("Redirecting due to missing group");
      return backendRedirect("login");
    }

    return (await serverSidePropsCallback?.(context)) ?? { props: {} };
  };
};
