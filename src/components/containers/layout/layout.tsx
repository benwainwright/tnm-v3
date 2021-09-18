import { currentUser } from "@app/aws/authenticate";
import { Header, Footer } from "@app/components/organisms";
import { useAxe } from "@app/hooks";
import { User, UserContext } from "@app/user-context";
import styled from "@emotion/styled";
import React, { FC, useEffect, useState } from "react";

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
