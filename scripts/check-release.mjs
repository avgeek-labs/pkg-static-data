import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const manifest = JSON.parse(await readFile("package.json", "utf8"));
assert.equal(manifest.name, "@avgeek-labs/static-data");
assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
assert.equal(manifest.publishConfig.registry, "https://npm.pkg.github.com");
assert.equal(
  process.env.GITHUB_REF_NAME,
  `${manifest.name}@${manifest.version}`,
);

if (
  process.argv.includes("--candidate") ||
  process.argv.includes("--published")
) {
  const report = JSON.parse(await readFile("artifacts/package.json", "utf8"));
  assert.equal(report.name, manifest.name);
  assert.equal(report.version, manifest.version);
  assert.equal(
    report.filename,
    `avgeek-labs-static-data-${manifest.version}.tgz`,
  );
  const tarball = await readFile(`artifacts/${report.filename}`);
  const integrity = `sha512-${createHash("sha512").update(tarball).digest("base64")}`;
  assert.equal(report.integrity, integrity);
  if (process.argv.includes("--published")) {
    const published = JSON.parse(
      execFileSync(
        "npm",
        [
          "view",
          `${manifest.name}@${manifest.version}`,
          "dist.integrity",
          "--json",
          "--registry=https://npm.pkg.github.com",
        ],
        { encoding: "utf8" },
      ),
    );
    assert.equal(published, integrity);
  }
}
