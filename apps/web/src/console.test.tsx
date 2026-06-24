import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProductConsole } from "./console.js";

describe("product console", () => {
  it("renders a Chinese workflow console mapped to backend actions", () => {
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
        activeTopic={{
          date: "2026-06-24",
          slug: "x-1",
          title: "Explosive X post",
          source: "sopilot-x"
        }}
        activityLog={["扫描完成", "已创建选题包"]}
      />
    );

    expect(html).toContain("雷达台");
    expect(html).toContain("选题工作台");
    expect(html).toContain("证据与成稿");
    expect(html).toContain("成品与发布");
    expect(html).toContain("反馈学习");
    expect(html).toContain("运行扫描");
    expect(html).toContain("创建选题包");
    expect(html).toContain("写入证据包");
    expect(html).toContain("创建文章包");
    expect(html).toContain("渲染 HTML");
    expect(html).toContain("创建公众号草稿");
    expect(html).toContain("记录反馈");
    expect(html).toContain("Explosive X post");
    expect(html).toContain("run-1");
    expect(html).toContain("Article");
    expect(html).toContain("只创建草稿，不自动发布");
    expect(html).toContain("sopilot-x");
    expect(html).toContain("扫描完成");
  });
});
