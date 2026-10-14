// Print one version's section of changelog.md, for use as GitHub release notes.
//
//   node scripts/changelog-section.mjs 4.0.0
//
// Exits non-zero when that version has no section, or has one with no content. The publish
// workflow runs this before publishing, so a release with nothing to say about it fails while
// that is still fixable: once the version is on npm it cannot be unpublished.
import { readFileSync } from "node:fs";

const CHANGELOG = "changelog.md";

// Headings look like `## [4.0.0] – 2026-10-14`. The version is matched exactly, so `4.0.0`
// cannot match `4.0.0-beta.0`.
const version = process.argv[2];
if (!version) {
  console.error("Usage: node scripts/changelog-section.mjs <version>");
  process.exit(2);
}

const lines = readFileSync(CHANGELOG, "utf8").split("\n");
const start = lines.findIndex((line) => line.startsWith(`## [${version}]`));
const rest = start === -1 ? [] : lines.slice(start + 1);
const end = rest.findIndex((line) => line.startsWith("## "));
const body = (end === -1 ? rest : rest.slice(0, end)).join("\n").trim();

if (body === "") {
  console.error(
    `${CHANGELOG} has no content under "## [${version}]".\n\n` +
      `Every release needs to say what changed, the GitHub release notes are this section.\n` +
      `Add the entry, then move the tag:\n\n` +
      `  git commit -am "Changelog for ${version}"\n` +
      `  git tag -fa v${version} -m "${version}" && git push --force origin v${version}\n\n` +
      `Nothing has been published at this point, so re-tagging is safe.`
  );
  process.exit(1);
}

process.stdout.write(body + "\n");
