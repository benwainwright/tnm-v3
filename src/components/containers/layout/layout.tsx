import React, { FC, useEffect, useState } from "react";
import { useAxe } from "@app/hooks"
import { currentUser } from "@app/aws/authenticate";
import { User, UserContext } from "@app/user-context";
import { Header, Footer} from "@app/components/organisms";



const Layout: FC = props => {
  const [user, setUser] = useState<User | undefined>(undefined)
  useAxe()

  useEffect(() => {
    ;(async () => {
      setUser(await currentUser())
    })()
  }, [])

  return (
    <>
      <UserContext.Provider value={{ user, setUser }}>
        <Header />
          {props.children}
        <Footer />
      </UserContext.Provider>
    </>
  )
}

export default Layout
