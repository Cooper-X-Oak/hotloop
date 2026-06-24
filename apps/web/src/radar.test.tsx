import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { buildRadarLanes, RadarPage } from "./radar.js";

describe("radar console", () => {
  it("keeps P0-P4 lane order and includes empty P0", () => {
    const lanes = buildRadarLanes([
      {
        id: "gh-1",
        lane: "P1",
        title: "GitHub project",
        source: "github"
      }
    ]);

    expect(lanes.map((lane) => lane.id)).toEqual(["P0", "P1", "P2", "P3", "P4"]);
    expect(lanes[0]?.candidates).toEqual([]);
    expect(lanes[1]?.candidates[0]?.title).toBe("GitHub project");
  });

  it("renders the radar lanes and candidate details", () => {
    const html = renderToStaticMarkup(
      <RadarPage
        candidates={[
          {
            id: "x-1",
            lane: "P0",
            title: "Explosive X post",
            source: "sopilot-x",
            summary: "A fresh X signal",
            whyItMatters: "It changes the AI coding narrative",
            risk: "Needs official confirmation"
          }
        ]}
      />
    );

    expect(html).toContain("P0");
    expect(html).toContain("X Explosive Posts");
    expect(html).toContain("Explosive X post");
    expect(html).toContain("Needs official confirmation");
  });
});

