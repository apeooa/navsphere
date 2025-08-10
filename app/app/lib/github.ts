// app/lib/github.ts
type FetchOpts = { tag?: string; revalidate?: number };

const OWNER  = process.env.GITHUB_OWNER!;
const REPO   = process.env.GITHUB_REPO!;
const BRANCH = process.env.GITHUB_BRANCH || "main";
const TOKEN  = process.env.GITHUB_PERSONAL_TOKEN; // 细粒度 PAT：只授 navsphere-data → Contents (Read/Write)

function ghHeaders() {
  const h: Record<string, string> = {
    "User-Agent": "NavSphere",
    "Accept": "application/vnd.github+json",
  };
  if (TOKEN) h["Authorization"] = `Bearer ${TOKEN}`;
  return h;
}

export async function fetchJsonFromRepo(path: string, opts: FetchOpts = {}) {
  // 1) Contents API（支持私有仓库）
  const contentsURL = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`;
  let res = await fetch(contentsURL, {
    headers: ghHeaders(),
    // 给 Next 的 ISR 打标签（用于 revalidateTag）
    // @ts-ignore
    next: opts.tag ? { tags: [opts.tag], revalidate: opts.revalidate ?? 3600 } : undefined,
  });

  if (res.ok) {
    const json = await res.json() as any;
    if (json?.content && json?.encoding === "base64") {
      const buf = Buffer.from(json.content, "base64");
      return JSON.parse(buf.toString("utf-8"));
    }
    throw new Error(`Unexpected GitHub contents shape for ${path}`);
  }

  // 2) 回退 raw（公库可用）
  const rawURL = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${path}`;
  res = await fetch(rawURL, {
    headers: { "User-Agent": "NavSphere" },
    // @ts-ignore
    next: opts.tag ? { tags: [opts.tag], revalidate: opts.revalidate ?? 3600 } : undefined,
  });
  if (!res.ok) throw new Error(`Fetch raw ${path} failed: ${res.status}`);
  return res.json();
}
