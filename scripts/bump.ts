
import { parse, format } from "@std/semver";

const type = Deno.args[0] as "patch" | "minor" | "major";
if (!["patch", "minor", "major"].includes(type)) {
  console.error("Usage: deno run -A scripts/bump.ts <patch|minor|major>");
  Deno.exit(1);
}

const denoJsonPath = "deno.json";
const content = await Deno.readTextFile(denoJsonPath);
const json = JSON.parse(content);

const currentVersion = parse(json.version);
const nextVersion = { ...currentVersion };

if (type === "patch") {
  nextVersion.patch++;
} else if (type === "minor") {
  nextVersion.minor++;
  nextVersion.patch = 0;
} else if (type === "major") {
  nextVersion.major++;
  nextVersion.minor = 0;
  nextVersion.patch = 0;
}

const newVersionString = format(nextVersion);
json.version = newVersionString;

await Deno.writeTextFile(denoJsonPath, JSON.stringify(json, null, 2) + "\n");

console.log(`Bumped version from ${format(currentVersion)} to ${newVersionString}`);
