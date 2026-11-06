import { execSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const skipDirs = new Set([
  "node_modules",
  ".git",
  ".next",
  ".npm-cache",
  ".dsh-pilot",
  "coverage",
  "out",
  "build",
]);
const skipFiles = new Set([
  "package-lock.json",
  "pnpm-lock.yaml",
  "scripts/check-secrets.mjs",
]);
const skipExt = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".ico",
  ".pdf",
  ".zip",
  ".woff",
  ".woff2",
  ".ttf",
  ".map",
]);

const patterns = [
  { name: "jwt", re: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g },
  { name: "openai-key", re: /sk-[A-Za-z0-9]{20,}/g },
  { name: "github-token", re: /gh[pousr]_[A-Za-z0-9]{20,}/g },
  { name: "aws-key", re: /AKIA[0-9A-Z]{16}/g },
  { name: "private-key", re: /-----BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----/g },
  {
    name: "service-role-assignment",
    re: /SUPABASE_SERVICE_ROLE_KEY[ \t]*=[ \t]*[^\s"'`\r\n]+/g,
  },
  {
    name: "app-secret-assignment",
    re: /(?:CLIENT_SESSION_SECRET|CRON_SECRET)[ \t]*=[ \t]*[^\s"'`\r\n]+/g,
  },
];

function listFiles() {
  try {
    const out = execSync("git ls-files -z", {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return out.split("\0").filter(Boolean);
  } catch {
    const files = [];
    const walk = (dir) => {
      for (const entry of readdirSync(dir)) {
        if (skipDirs.has(entry)) continue;
        const abs = join(dir, entry);
        const st = statSync(abs);
        if (st.isDirectory()) walk(abs);
        else files.push(relative(root, abs));
      }
    };
    walk(root);
    return files;
  }
}

const findings = [];
for (const file of listFiles()) {
  if (skipFiles.has(file)) continue;
  if (file.startsWith(".env")) continue;
  const ext = file.slice(file.lastIndexOf("."));
  if (skipExt.has(ext)) continue;
  let text;
  try {
    const st = statSync(join(root, file));
    if (st.size > 1_000_000) continue;
    text = readFileSync(join(root, file), "utf8");
  } catch {
    continue;
  }
  for (const { name, re } of patterns) {
    re.lastIndex = 0;
    let match;
    while ((match = re.exec(text))) {
      const line = text.slice(0, match.index).split("\n").length;
      findings.push(`${file}:${line} — ${name}`);
      if (findings.length >= 50) break;
    }
  }
  if (findings.length >= 50) break;
}

if (findings.length) {
  console.error("Potential secrets found:");
  for (const finding of findings) console.error(`  ${finding}`);
  process.exit(1);
}

console.log("No secrets found in tracked files.");
