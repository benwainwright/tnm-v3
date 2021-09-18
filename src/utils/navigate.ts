import Router from "next/router";

export const navigate = async (path: string) => {
  await Router.push(path);
};
