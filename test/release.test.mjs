import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const script = fileURLToPath(
  new URL("../scripts/check-release.mjs", import.meta.url),
);

test("release gate rejects mismatched tags and modified publication artifacts", async () => {
  const root = await mkdtemp(join(tmpdir(), "country-data-release-"));
  try {
    const tarball = Buffer.from("verified tarball fixture");
    const manifest = {
      name: "@avgeek-labs/static-data",
      version: "0.1.1",
      publishConfig: { registry: "https://npm.pkg.github.com" },
    };
    const report = {
      name: manifest.name,
      version: manifest.version,
      filename: "avgeek-labs-static-data-0.1.1.tgz",
      integrity: `sha512-${createHash("sha512").update(tarball).digest("base64")}`,
    };
    await mkdir(join(root, "artifacts"));
    await writeFile(join(root, "package.json"), JSON.stringify(manifest));
    await writeFile(
      join(root, "artifacts/package.json"),
      JSON.stringify(report),
    );
    const path = join(root, "artifacts", report.filename);
    await writeFile(path, tarball);
    const check = (tag) =>
      spawnSync(process.execPath, [script, "--candidate"], {
        cwd: root,
        env: { ...process.env, GITHUB_REF_NAME: tag },
        encoding: "utf8",
      });
    assert.equal(check("@avgeek-labs/static-data@0.1.1").status, 0);
    assert.notEqual(check("@avgeek-labs/static-data@0.1.0").status, 0);
    assert.notEqual(check("@avgeek-labs/static-data@0.1.1-beta.1").status, 0);
    await writeFile(path, "modified tarball");
    assert.notEqual(check("@avgeek-labs/static-data@0.1.1").status, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
