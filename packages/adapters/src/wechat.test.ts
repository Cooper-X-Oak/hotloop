import { describe, expect, it, vi } from "vitest";
import { createWeChatDraft } from "./index.js";

describe("WeChat draft adapter", () => {
  it("uploads inline data images, uploads cover, and creates a draft", async () => {
    const uploadContentImage = vi.fn(async () => "https://mmbiz.qpic.cn/inline-1.png");
    const uploadCoverImage = vi.fn(async () => "cover-media-id");
    const createDraft = vi.fn(async () => "draft-media-id");

    const result = await createWeChatDraft(
      {
        title: "Test title",
        digest: "Digest",
        html: '<section><img src="data:image/png;base64,AAAA" /></section>',
        coverImagePath: "cover.png"
      },
      {
        uploadContentImage,
        uploadCoverImage,
        createDraft
      }
    );

    expect(uploadContentImage).toHaveBeenCalledTimes(1);
    expect(uploadCoverImage).toHaveBeenCalledWith("cover.png");
    expect(createDraft).toHaveBeenCalledWith({
      title: "Test title",
      digest: "Digest",
      content: '<section><img src="https://mmbiz.qpic.cn/inline-1.png" /></section>',
      thumbMediaId: "cover-media-id"
    });
    expect(result).toEqual({
      status: "draft_created",
      mediaId: "draft-media-id",
      imageUploads: [
        {
          originalSrc: "data:image/png;base64,AAAA",
          uploadedUrl: "https://mmbiz.qpic.cn/inline-1.png"
        }
      ]
    });
  });

  it("rejects auto-publish attempts", async () => {
    await expect(
      createWeChatDraft(
        {
          title: "Test title",
          digest: "Digest",
          html: "<section />",
          coverImagePath: "cover.png",
          autoPublish: true
        },
        {
          uploadContentImage: async () => "unused",
          uploadCoverImage: async () => "unused",
          createDraft: async () => "unused"
        }
      )
    ).rejects.toThrow("HotLoop only creates drafts");
  });
});

