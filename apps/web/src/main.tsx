import { createRoot } from "react-dom/client";
import { ProductConsole } from "./console.js";
import "./styles.css";

async function loadJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(url);
    if (!response.ok) return fallback;
    return await response.json();
  } catch {
    return fallback;
  }
}

const [candidates, runs, artifacts, feedback] = await Promise.all([
  loadJson("/api/candidates", []),
  loadJson("/api/runs", []),
  loadJson(`/api/artifacts?date=${new Date().toISOString().slice(0, 10)}`, []),
  loadJson("/api/feedback/sources", [])
]);
const root = document.getElementById("root");

if (!root) {
  throw new Error("Missing root element");
}

createRoot(root).render(
  <ProductConsole candidates={candidates} runs={runs} artifacts={artifacts} feedback={feedback} />
);
