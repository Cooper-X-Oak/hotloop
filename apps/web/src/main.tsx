import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HotLoopApp } from "./app/App.js";
import "./styles.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Missing root element");
}

createRoot(root).render(
  <BrowserRouter>
    <HotLoopApp />
  </BrowserRouter>
);
