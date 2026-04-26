import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

const DEFAULT_API_BASE = "https://copilot.colosseum.com/api/v1";
const REQUEST_TIMEOUT_MS = 15_000;

function stripQuotes(value) {
  if (!value) return value;

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

async function readIfExists(filePath) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

function parseEnvFile(content) {
  const parsed = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");

    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim();

    parsed[key] = stripQuotes(value);
  }

  return parsed;
}

async function loadEnvSources() {
  const cwd = process.cwd();
  const files = [".env.local", ".env"];
  const merged = {};

  for (const fileName of files) {
    const fullPath = path.join(cwd, fileName);
    const content = await readIfExists(fullPath);

    if (content) {
      Object.assign(merged, parseEnvFile(content));
    }
  }

  return merged;
}

async function loadSuperstackConfig() {
  const candidateHomes = [
    os.homedir(),
    process.env.USERPROFILE,
    process.env.HOME,
    process.env.HOMEDRIVE && process.env.HOMEPATH
      ? path.join(process.env.HOMEDRIVE, process.env.HOMEPATH)
      : null,
  ].filter(Boolean);

  for (const home of [...new Set(candidateHomes)]) {
    const configPath = path.join(home, ".superstack", "config.json");
    const content = await readIfExists(configPath);

    if (!content) {
      continue;
    }

    try {
      return JSON.parse(content);
    } catch {
      return {};
    }
  }

  return {};
}

async function loadCopilotConfig() {
  const envFileVars = await loadEnvSources();
  const superstackConfig = await loadSuperstackConfig();

  const apiBase = (
    process.env.COLOSSEUM_COPILOT_API_BASE ||
    envFileVars.COLOSSEUM_COPILOT_API_BASE ||
    DEFAULT_API_BASE
  ).replace(/\/+$/, "");

  const token =
    process.env.COLOSSEUM_COPILOT_PAT ||
    envFileVars.COLOSSEUM_COPILOT_PAT ||
    superstackConfig.copilotToken ||
    "";

  return {
    apiBase,
    token: token.trim(),
  };
}

async function copilotFetch(config, endpoint, { method = "GET", body } = {}) {
  if (!config.token) {
    throw new Error(
      "Missing Colosseum PAT. Set COLOSSEUM_COPILOT_PAT in your shell or .env file.",
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${config.apiBase}${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const text = await response.text();
    const payload = text ? JSON.parse(text) : null;

    if (!response.ok) {
      const message =
        payload?.message ||
        payload?.error ||
        `Copilot request failed with status ${response.status}`;

      throw new Error(message);
    }

    return payload;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Copilot request timed out after 15 seconds.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function truncate(value, maxLength = 220) {
  if (!value || value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3)}...`;
}

async function loadProjectContext() {
  const cwd = process.cwd();
  const readme = await readIfExists(path.join(cwd, "README.md"));
  const packageJsonRaw = await readIfExists(path.join(cwd, "package.json"));

  let projectName = path.basename(cwd);

  if (packageJsonRaw) {
    try {
      const pkg = JSON.parse(packageJsonRaw);
      if (pkg.name) {
        projectName = pkg.name;
      }
    } catch {
      // Ignore invalid package.json parsing for CLI context.
    }
  }

  if (!readme) {
    return {
      title: projectName,
      summary: projectName,
    };
  }

  const titleMatch = readme.match(/^#\s+(.+)$/m);
  const lines = readme.split(/\r?\n/);
  const overviewIndex = lines.findIndex(
    (line) => line.trim().startsWith("##") && /overview/i.test(line),
  );

  let overviewBlocks = [];

  if (overviewIndex !== -1) {
    const collected = [];

    for (let index = overviewIndex + 1; index < lines.length; index += 1) {
      const line = lines[index];

      if (line.trim().startsWith("## ")) {
        break;
      }

      collected.push(line);
    }

    overviewBlocks = collected
      .join("\n")
      .split(/\n\s*\n/)
      .map((block) => block.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .filter(
        (block) =>
          !block.startsWith("#") &&
          !block.startsWith("[!") &&
          !block.startsWith("<") &&
          !block.startsWith(">") &&
          !block.startsWith("!"),
      );
  }

  const firstParagraph =
    overviewBlocks[0] ||
    readme
      .split(/\n\s*\n/)
      .map((block) => block.replace(/\s+/g, " ").trim())
      .find(
        (block) =>
          block &&
          !block.startsWith("#") &&
          !block.startsWith("[!") &&
          !block.startsWith("<") &&
          !block.startsWith(">") &&
          !block.startsWith("!"),
      );

  return {
    title: titleMatch?.[1]?.trim() || projectName,
    summary: firstParagraph || projectName,
  };
}

function formatResultLine(result, index) {
  const crowdedness =
    typeof result.crowdedness === "number" ? result.crowdedness : "n/a";
  const similarity =
    typeof result.similarity === "number"
      ? result.similarity.toFixed(3)
      : "n/a";
  const hackathon = result.hackathon?.name || "Unknown";

  return `${index + 1}. ${result.name} | ${hackathon} | crowdedness ${crowdedness} | similarity ${similarity}`;
}

function renderSearchResults(question, data) {
  const results = Array.isArray(data?.results) ? data.results : [];

  if (!results.length) {
    return [
      "Colosseum Copilot terminal",
      `Question: ${question}`,
      "",
      "No matching projects found.",
    ].join("\n");
  }

  const lines = [
    "Colosseum Copilot terminal",
    `Question: ${question}`,
    "",
    "Top project matches:",
  ];

  for (const [index, result] of results.slice(0, 5).entries()) {
    lines.push(formatResultLine(result, index));
    if (result.oneLiner) {
      lines.push(`   ${truncate(result.oneLiner, 140)}`);
    }
  }

  return lines.join("\n");
}

function weightedCrowdedness(matches) {
  const weighted = matches.reduce(
    (acc, match) => {
      const similarity =
        typeof match.similarity === "number" && match.similarity > 0
          ? match.similarity
          : 1;

      return {
        score: acc.score + match.crowdedness * similarity,
        weight: acc.weight + similarity,
      };
    },
    { score: 0, weight: 0 },
  );

  return weighted.weight > 0
    ? Math.round(weighted.score / weighted.weight)
    : null;
}

function renderCrowdednessAssessment(question, projectContext, data) {
  const results = Array.isArray(data?.results) ? data.results : [];
  const matches = results
    .filter((result) => typeof result.crowdedness === "number")
    .slice(0, 5);

  if (!matches.length) {
    return [
      "Colosseum Copilot terminal",
      `Question: ${question}`,
      "",
      `Project context: ${projectContext.title}`,
      "Copilot did not return any crowdedness values for nearby matches.",
    ].join("\n");
  }

  const crowdednessValues = matches.map((match) => match.crowdedness);
  const min = Math.min(...crowdednessValues);
  const max = Math.max(...crowdednessValues);
  const estimate = weightedCrowdedness(matches);

  const lines = [
    "Colosseum Copilot terminal",
    `Question: ${question}`,
    "",
    `Project context: ${projectContext.title}`,
    `Summary used: ${truncate(projectContext.summary, 180)}`,
    "",
    "Nearest comparable projects:",
    ...matches.map((match, index) => formatResultLine(match, index)),
    "",
    `Crowdedness band: ${min}-${max}`,
    `Best-fit estimate: ${estimate ?? "n/a"}`,
    "Note: Copilot returned crowdedness on nearby corpus matches; this estimate is inferred from those matches when your exact project is not already in the corpus.",
  ];

  return lines.join("\n");
}

async function answerQuestion(config, question, projectContext) {
  const normalizedQuestion = question.trim();

  if (!normalizedQuestion) {
    throw new Error("Please enter a non-empty question.");
  }

  if (
    normalizedQuestion.toLowerCase().includes("crowdedness") &&
    normalizedQuestion.toLowerCase().includes("project")
  ) {
    const searchQuery = `${projectContext.title}. ${projectContext.summary}`;
    const data = await copilotFetch(config, "/search/projects", {
      method: "POST",
      body: {
        query: searchQuery,
        limit: 8,
        diversify: true,
      },
    });

    return renderCrowdednessAssessment(
      normalizedQuestion,
      projectContext,
      data,
    );
  }

  const data = await copilotFetch(config, "/search/projects", {
    method: "POST",
    body: {
      query: normalizedQuestion,
      limit: 8,
      diversify: true,
    },
  });

  return renderSearchResults(normalizedQuestion, data);
}

function printHelp() {
  console.log(`Colosseum Copilot terminal

Usage:
  npm run copilot -- --status
  npm run copilot -- "generate the project's Crowdedness Score"
  npm run copilot

Notes:
  - Reads COLOSSEUM_COPILOT_API_BASE and COLOSSEUM_COPILOT_PAT from shell env,
    .env.local, .env, or ~/.superstack/config.json
  - Interactive mode starts when you run the command with no question
  - Type "exit" or "quit" to leave interactive mode
`);
}

async function runInteractive(config, projectContext) {
  const rl = readline.createInterface({
    input: stdin,
    output: stdout,
  });

  console.log("Colosseum Copilot terminal");
  console.log('Type a question, or "exit" to quit.');
  console.log("");

  try {
    while (true) {
      const question = (await rl.question("copilot> ")).trim();

      if (!question) {
        continue;
      }

      if (["exit", "quit"].includes(question.toLowerCase())) {
        break;
      }

      try {
        const answer = await answerQuestion(config, question, projectContext);
        console.log("");
        console.log(answer);
        console.log("");
      } catch (error) {
        console.error("");
        console.error(
          error instanceof Error ? error.message : "Unknown Copilot error.",
        );
        console.error("");
      }
    }
  } finally {
    rl.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const joinedArgs = args.join(" ").trim();

  if (joinedArgs === "--help" || joinedArgs === "-h") {
    printHelp();
    return;
  }

  const config = await loadCopilotConfig();
  const projectContext = await loadProjectContext();

  if (joinedArgs === "--status") {
    const status = await copilotFetch(config, "/status");
    console.log(JSON.stringify(status, null, 2));
    return;
  }

  if (joinedArgs) {
    const answer = await answerQuestion(config, joinedArgs, projectContext);
    console.log(answer);
    return;
  }

  await runInteractive(config, projectContext);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Unknown error.");
  process.exitCode = 1;
});
