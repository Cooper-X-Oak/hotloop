import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProductConsole } from "./console.js";

describe("product console", () => {
  it("renders radar, runs, artifacts, publish, and feedback views", () => {
    const html = renderToStaticMarkup(
      <ProductConsole
        candidates={[
          {
            id: "x-1",
            lane: "P0",
            title: "Explosive X post",
            source: "sopilot-x"
          }
        ]}
        runs={[{ id: "run-1", status: "running", currentStep: "scan" }]}
        artifacts={[{ id: "2026-06-24/a.html", title: "Article", fileName: "a.html" }]}
        feedback={[{ source: "sopilot-x", count: 2, averageViews: 1200 }]}
      />
    );

    expect(html).toContain("Radar");
    expect(html).toContain("Runs");
    expect(html).toContain("Artifacts");
    expect(html).toContain("Publish");
    expect(html).toContain("Feedback");
    expect(html).toContain("Explosive X post");
    expect(html).toContain("run-1");
    expect(html).toContain("Article");
    expect(html).toContain("Draft-only handoff");
    expect(html).toContain("sopilot-x");
  });
});
