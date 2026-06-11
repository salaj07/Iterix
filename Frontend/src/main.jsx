import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store";
import App from "./App";
import { Toaster } from "sonner";
import "./styles.css";

// Bootstrap theme before paint
const savedTheme = localStorage.getItem("Iterix-theme") || "dark";
if (savedTheme === "dark") document.documentElement.classList.add("dark");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--popover)",
              color: "var(--popover-foreground)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
            },
          }}
        />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
