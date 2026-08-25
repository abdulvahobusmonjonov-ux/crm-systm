import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";

import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import SessionRoleSync from "./components/shared/SessionRoleSync.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        {/* Admin rol/ruxsatni o'zgartirsa, ochiq sessiyani fonda yangilaydi */}
        <SessionRoleSync />
        <App />
        <Toaster position="top-right" richColors closeButton />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
