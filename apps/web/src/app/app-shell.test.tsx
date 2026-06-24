import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AppShell } from "./AppShell.js";

describe("app shell", () => {
  it("renders production navigation as routed Chinese product sections", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/radar"]}>
        <AppShell
          summary={{ candidates: 5, runs: "succeeded", artifacts: 1, feedback: 2 }}
          activityLog={["扫描完成"]}
        >
          <main>页面内容</main>
        </AppShell>
      </MemoryRouter>
    );

    expect(html).toContain('href="/radar"');
    expect(html).toContain('href="/topics"');
    expect(html).toContain('href="/runs"');
    expect(html).toContain('href="/artifacts"');
    expect(html).toContain('href="/publish"');
    expect(html).toContain('href="/feedback"');
    expect(html).toContain("雷达台");
    expect(html).toContain("选题工作台");
    expect(html).toContain("运行账本");
    expect(html).toContain("页面内容");
    expect(html).toContain("扫描完成");
  });
});
