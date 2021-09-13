import React, { FC, useEffect, useState } from "react";
import { useAxe } from "@app/hooks";
import { currentUser } from "@app/aws/authenticate";
import { User, UserContext } from "@app/user-context";
import { Header, Footer } from "@app/components/organisms";
import styled from "@emotion/styled";

const MainContainer = styled("main")`
  display: flex;
  align-items: center;
  flex-direction: column;
  padding-bottom: 4rem;
`;

const Layout: FC = (props) => {
  const [user, setUser] = useState<User | undefined>(undefined);
  useAxe();

  useEffect(() => {
    (async () => {
      setUser(await currentUser());
    })();
  }, []);

  return (
    <>
      <UserContext.Provider value={{ user, setUser }}>
        <Header />
        <MainContainer>{props.children}</MainContainer>
        <Footer />
      </UserContext.Provider>
    </>
  );
};

export default Layout;
