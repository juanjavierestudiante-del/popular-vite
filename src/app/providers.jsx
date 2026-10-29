import React from "react";
import { AuthProvider } from "../modules/auth/AuthProvider";
export default function Providers({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
