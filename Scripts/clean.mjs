import fs from "node:fs";
import path from "node:path";

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const targets = ["dist", "release", "tmp", "output"];

for (const target of targets) {
  fs.rmSync(path.join(rootDir, target), { recursive: true, force: true });
}

removeDsStore(rootDir);

function removeDsStore(directoryPath) {
  for (const entry of fs.readdirSync(directoryPath, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") {
      continue;
    }

    const entryPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      removeDsStore(entryPath);
      continue;
    }

    if (entry.name === ".DS_Store") {
      fs.rmSync(entryPath, { force: true });
    }
  }
}
