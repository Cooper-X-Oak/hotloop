import { createRoot } from "react-dom/client";
import { RadarPage } from "./radar.js";
import "./styles.css";

async function loadCandidates() {
  try {
    const response = await fetch("/api/candidates");
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

const candidates = await loadCandidates();
const root = document.getElementById("root");

if (!root) {
  throw new Error("Missing root element");
}

createRoot(root).render(<RadarPage candidates={candidates} />);

