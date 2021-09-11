import Router from "next/router"

export const navigate = (path: string) => {
  Router.push(path)
}
