import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { appContext } from "./appSupport";
import "./styles.css";

document.documentElement.lang = appContext.locale === "zh-TW" ? "zh-Hant-TW" : "en";
document.title = "Markdown PDF Renderer";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
