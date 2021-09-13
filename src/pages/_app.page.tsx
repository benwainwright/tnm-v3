import { FC } from "react";
import { AppProps } from "next/app";
import "../components/containers/layout/layout.css";

const TnmApp: FC<AppProps> = ({ Component, pageProps }) => (
  <Component {...pageProps} />
);

export default TnmApp;
