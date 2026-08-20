import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@capacitor/app";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import "./styles.css";

const router = getRouter();

function MobileApp() {
  useEffect(() => {
    const listener = App.addListener("backButton", async () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        await App.exitApp();
      }
    });

    return () => {
      listener.then((handle) => handle.remove());
    };
  }, []);

  return <RouterProvider router={router} />;
}

const root = document.getElementById("root");

if (!root) {
  throw new Error("Elemento raiz da aplicação mobile não encontrado.");
}

createRoot(root).render(
  <StrictMode>
    <MobileApp />
  </StrictMode>,
);