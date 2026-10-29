import React from "react";
import { BrowserRouter } from "react-router-dom";
import Providers from "./providers";
import Router from "./router";
import "../shared/styles/global.css";
export default function App() {
  return (
    <Providers>
      <BrowserRouter>
        <Router />
      </BrowserRouter>
    </Providers>
  );
}
