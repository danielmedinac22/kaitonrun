export type GitHubFile = {
  name: string;
  path: string;
  sha: string;
  download_url: string | null;
  type: "file" | "dir";
};

function env(name: string, optional = false): string {
  const v = process.env[name];
  if (!v && !optional) throw new Error(`Missing env var: ${name}`);
  return v || "";
}

export function repoInfo() {
  const owner = env("GITHUB_OWNER", true) || "danielmedinac22";
  const repo = env("GITHUB_REPO", true) || "kaitonrun";
  return { owner, repo };
}

export function githubAuthHeaders(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN;
  const h: Record<string, string> = {
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

export async function listRepoDir(dirPath: string): Promise<GitHubFile[]> {
  const { owner, repo } = repoInfo();
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${dirPath}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      ...githubAuthHeaders(),
    },
    // keep it fresh-ish
    next: { revalidate: 15 },
  });
  if (!res.ok) {
    // 404 if empty folder (no files)
    if (res.status === 404) return [];
    const txt = await res.text();
    throw new Error(`GitHub list failed (${res.status}): ${txt}`);
  }
  const data = (await res.json()) as any[];
  return data
    .filter((x) => x.type === "file")
    .map((x) => ({
      name: x.name,
      path: x.path,
      sha: x.sha,
      download_url: x.download_url,
      type: x.type,
    }));
}

export async function getFileContent(pathInRepo: string): Promise<string | null> {
  const { owner, repo } = repoInfo();
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${pathInRepo}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      ...githubAuthHeaders(),
    },
    next: { revalidate: 15 },
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    const txt = await res.text();
    throw new Error(`GitHub get failed (${res.status}): ${txt}`);
  }
  const data = (await res.json()) as any;
  if (!data.content) return null;
  const buf = Buffer.from(String(data.content).replace(/\n/g, ""), "base64");
  return buf.toString("utf-8");
}

export async function upsertFile({
  pathInRepo,
  content,
  message,
}: {
  pathInRepo: string;
  content: string;
  message: string;
}) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("Missing env var: GITHUB_TOKEN");

  const { owner, repo } = repoInfo();
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${pathInRepo}`;

  // check if file exists to get sha
  const existingRes = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      ...githubAuthHeaders(),
    },
    cache: "no-store",
  });

  let sha: string | undefined;
  if (existingRes.ok) {
    const j = (await existingRes.json()) as any;
    sha = j.sha;
  }

  const body = {
    message,
    content: Buffer.from(content, "utf-8").toString("base64"),
    sha,
  };

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      ...githubAuthHeaders(),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`GitHub upsert failed (${res.status}): ${txt}`);
  }

  return res.json();
}
