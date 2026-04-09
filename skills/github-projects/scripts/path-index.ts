#!/usr/bin/env bun

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

type Source = "user" | "agentflow-config" | "local-index" | "git-remote";

type StatusOptions = Record<string, string>;

interface PathIndexEntry {
  projectPath: string;
  remoteUrl?: string;
  owner: string;
  repo: string;
  project: number;
  projectUrl?: string;
  projectId?: string;
  statusFieldId?: string;
  statusOptions?: StatusOptions;
  source: Source;
  updatedAt: string;
}

interface PathIndexFile {
  version: 1;
  entries: PathIndexEntry[];
}

interface ParsedArgs {
  command: string;
  options: Record<string, string>;
}

const DEFAULT_INDEX: PathIndexFile = { version: 1, entries: [] };

function usage(): never {
  console.error(`Usage:
  bun path-index.ts file [--file PATH]
  bun path-index.ts list [--file PATH]
  bun path-index.ts get [--project-path PATH] [--remote-url URL] [--file PATH]
  bun path-index.ts upsert --project-path PATH --owner NAME --repo NAME --project NUMBER [--remote-url URL] [--project-url URL] [--project-id ID] [--status-field-id ID] [--status-options-json JSON] [--source user|agentflow-config|local-index|git-remote] [--file PATH]
  bun path-index.ts remove [--project-path PATH] [--remote-url URL] [--file PATH]
`);
  process.exit(1);
}

function parseArgs(argv: string[]): ParsedArgs {
  const [command, ...rest] = argv;
  if (!command) usage();

  const options: Record<string, string> = {};
  for (let i = 0; i < rest.length; i++) {
    const token = rest[i];
    if (!token.startsWith("--")) usage();
    const key = token.slice(2);
    const value = rest[i + 1];
    if (!value || value.startsWith("--")) usage();
    options[key] = value;
    i++;
  }

  return { command, options };
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function normalizeProjectPath(projectPath: string): string {
  return resolve(projectPath);
}

function normalizeSource(value: string | undefined): Source {
  if (
    value === "user" ||
    value === "agentflow-config" ||
    value === "local-index" ||
    value === "git-remote"
  ) {
    return value;
  }
  return "user";
}

function parseProject(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    console.error(`Invalid project number: ${value}`);
    process.exit(1);
  }
  return parsed;
}

function parseStatusOptions(value: string | undefined): StatusOptions | undefined {
  if (!value) return undefined;

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("status options must be an object");
    }

    const normalized: StatusOptions = {};
    for (const [key, option] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof option !== "string") {
        throw new Error(`status option ${key} must be a string`);
      }
      normalized[key] = option;
    }
    return normalized;
  } catch (error) {
    console.error(`Invalid --status-options-json value: ${(error as Error).message}`);
    process.exit(1);
  }
}

function defaultIndexPath(): string {
  const explicit = process.env.GITHUB_PROJECTS_PATH_INDEX;
  if (explicit) return resolve(explicit);

  const home = process.env.HOME;
  const scriptDir = resolve(import.meta.dir);

  if (home && scriptDir.includes("/.codex/skills/github-projects/scripts")) {
    return resolve(home, ".codex/skills/github-projects/state/path-index.json");
  }

  if (home && scriptDir.includes("/.claude/skills/github-projects/scripts")) {
    return resolve(home, ".claude/skills/github-projects/state/path-index.json");
  }

  return resolve(scriptDir, "../state/path-index.json");
}

async function loadIndex(filePath: string): Promise<PathIndexFile> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<PathIndexFile>;
    if (parsed.version !== 1 || !Array.isArray(parsed.entries)) {
      throw new Error(`Invalid index schema in ${filePath}`);
    }
    return {
      version: 1,
      entries: parsed.entries as PathIndexEntry[],
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { ...DEFAULT_INDEX, entries: [] };
    }
    throw error;
  }
}

async function saveIndex(filePath: string, index: PathIndexFile): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  const sorted = [...index.entries].sort((a, b) => {
    return a.projectPath.localeCompare(b.projectPath) || (a.remoteUrl || "").localeCompare(b.remoteUrl || "");
  });
  await writeFile(
    filePath,
    JSON.stringify({ version: 1, entries: sorted }, null, 2) + "\n",
    "utf8",
  );
}

function findEntry(index: PathIndexFile, projectPath?: string, remoteUrl?: string): PathIndexEntry | null {
  if (projectPath) {
    const normalized = normalizeProjectPath(projectPath);
    const match = index.entries.find((entry) => entry.projectPath === normalized);
    if (match) return match;
  }

  if (remoteUrl) {
    const match = index.entries.find((entry) => entry.remoteUrl === remoteUrl);
    if (match) return match;
  }

  return null;
}

function requireOption(options: Record<string, string>, key: string): string {
  const value = options[key];
  if (!value) {
    console.error(`Missing required option: --${key}`);
    usage();
  }
  return value;
}

async function main(): Promise<void> {
  const { command, options } = parseArgs(Bun.argv.slice(2));
  const filePath = options.file ? resolve(options.file) : defaultIndexPath();

  if (command === "file") {
    console.log(filePath);
    return;
  }

  const index = await loadIndex(filePath);

  if (command === "list") {
    console.log(JSON.stringify(index, null, 2));
    return;
  }

  if (command === "get") {
    const entry = findEntry(index, options["project-path"], options["remote-url"]);
    console.log(JSON.stringify(entry, null, 2));
    return;
  }

  if (command === "upsert") {
    const projectPath = normalizeProjectPath(requireOption(options, "project-path"));
    const remoteUrl = options["remote-url"];
    const existing = findEntry(index, projectPath, remoteUrl);
    const parsedStatusOptions = parseStatusOptions(options["status-options-json"]);

    const entry: PathIndexEntry = {
      projectPath,
      remoteUrl: remoteUrl ?? existing?.remoteUrl,
      owner: requireOption(options, "owner"),
      repo: requireOption(options, "repo"),
      project: parseProject(requireOption(options, "project")),
      projectUrl: options["project-url"] ?? existing?.projectUrl,
      projectId: options["project-id"] ?? existing?.projectId,
      statusFieldId: options["status-field-id"] ?? existing?.statusFieldId,
      statusOptions: parsedStatusOptions ?? existing?.statusOptions,
      source: normalizeSource(options.source ?? existing?.source),
      updatedAt: today(),
    };

    if (existing) {
      index.entries = index.entries.map((candidate) => {
        if (
          candidate.projectPath === existing.projectPath ||
          (existing.remoteUrl && candidate.remoteUrl === existing.remoteUrl)
        ) {
          return entry;
        }
        return candidate;
      });
    } else {
      index.entries.push(entry);
    }

    await saveIndex(filePath, index);
    console.log(JSON.stringify(entry, null, 2));
    return;
  }

  if (command === "remove") {
    const projectPath = options["project-path"] ? normalizeProjectPath(options["project-path"]) : undefined;
    const remoteUrl = options["remote-url"];
    if (!projectPath && !remoteUrl) usage();

    index.entries = index.entries.filter((entry) => {
      if (projectPath && entry.projectPath === projectPath) return false;
      if (remoteUrl && entry.remoteUrl === remoteUrl) return false;
      return true;
    });

    await saveIndex(filePath, index);
    console.log(JSON.stringify(index, null, 2));
    return;
  }

  usage();
}

await main();
