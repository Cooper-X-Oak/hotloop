import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { HotLoopApp } from "./App.js";

const fixture = {
  candidates: [
    {
      id: "x-1",
      lane: "P0",
      title: "X 起爆信号",
      source: "sopilot-x-rss"
    }
  ],
  runs: [{ id: "run-1", status: "succeeded", currentStep: "scan" }],
  artifacts: [{ id: "2026-06-24/a.html", title: "成品文章", fileName: "a.html" }],
  feedback: [{ source: "sopilot-x-rss", count: 2, averageViews: 1000 }]
};

describe("routed HotLoop app", () => {
  it.each([
    ["/radar", "雷达台", "运行扫描"],
    ["/agent", "Agent 交互台", "发送指令"],
    ["/topics", "选题工作台", "创建选题包"],
    ["/runs", "运行账本", "run-1"],
    ["/artifacts", "成品库", "成品文章"],
    ["/publish", "发布台", "创建公众号草稿"],
    ["/feedback", "反馈学习", "记录反馈"]
  ])("renders %s as a routed feature page", (route, title, actionText) => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={[route]}>
        <HotLoopApp initialData={fixture} />
      </MemoryRouter>
    );

    expect(html).toContain(title);
    expect(html).toContain(actionText);
  });
});
