export interface WeChatDraftInput {
  title: string;
  digest: string;
  html: string;
  coverImagePath: string;
  autoPublish?: boolean;
}

export interface WeChatDraftServices {
  uploadContentImage: (source: { src: string; index: number }) => Promise<string>;
  uploadCoverImage: (coverImagePath: string) => Promise<string>;
  createDraft: (draft: {
    title: string;
    digest: string;
    content: string;
    thumbMediaId: string;
  }) => Promise<string>;
}

export interface WeChatDraftResult {
  status: "draft_created";
  mediaId: string;
  imageUploads: Array<{
    originalSrc: string;
    uploadedUrl: string;
  }>;
}

export interface WeChatApiClient {
  uploadContentImage: (source: { src: string; index: number }) => Promise<string>;
  uploadCoverImage: (coverImagePath: string) => Promise<string>;
  addDraft: (draft: {
    title: string;
    digest: string;
    content: string;
    thumbMediaId: string;
  }) => Promise<string>;
}

export async function createWeChatDraft(
  input: WeChatDraftInput,
  services: WeChatDraftServices
): Promise<WeChatDraftResult> {
  if (input.autoPublish) {
    throw new Error("HotLoop only creates drafts; auto-publish is not allowed");
  }

  const imageSources = extractImageSources(input.html).filter((src) => src.startsWith("data:"));
  let content = input.html;
  const imageUploads: WeChatDraftResult["imageUploads"] = [];

  for (const [index, src] of imageSources.entries()) {
    const uploadedUrl = await services.uploadContentImage({ src, index });
    content = content.split(src).join(uploadedUrl);
    imageUploads.push({ originalSrc: src, uploadedUrl });
  }

  const thumbMediaId = await services.uploadCoverImage(input.coverImagePath);
  const mediaId = await services.createDraft({
    title: input.title,
    digest: input.digest,
    content,
    thumbMediaId
  });

  return {
    status: "draft_created",
    mediaId,
    imageUploads
  };
}

export async function createWeChatDraftThroughApi(
  input: WeChatDraftInput,
  client: WeChatApiClient
): Promise<WeChatDraftResult> {
  return createWeChatDraft(input, {
    uploadContentImage: client.uploadContentImage,
    uploadCoverImage: client.uploadCoverImage,
    createDraft: client.addDraft
  });
}

function extractImageSources(html: string): string[] {
  return [...html.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map(
    (match) => match[1] ?? ""
  );
}
