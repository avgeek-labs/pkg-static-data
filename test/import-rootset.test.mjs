import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

test("Rootset imports migrate legacy flag URLs and still reject unrelated hosts", async () => {
  const directory = await mkdtemp(join(tmpdir(), "country-data-import-"));
  try {
    await cp(
      new URL("../scripts/", import.meta.url),
      join(directory, "scripts"),
      { recursive: true },
    );
    await mkdir(join(directory, "src/geo"), { recursive: true });
    const snapshot = JSON.parse(
      await readFile(
        new URL("../src/geo/countries.json", import.meta.url),
        "utf8",
      ),
    );
    const exported = join(directory, "export.json");
    for (const origin of [
      "https://oss-country-flags.avgeek.ltd/",
      "https://assets.avgeek.io/country-flags/",
      "https://assets.avgeek.ltd/country-flags/",
      "https://static.avgeek.ltd/geo/country-flags/",
    ]) {
      const rows = snapshot.map((country) => ({
        values: {
          ...country,
          flagUrl: country.flagUrl.replace(
            "https://static.avgeek.ltd/geo/country-flags/",
            origin,
          ),
        },
      }));
      await writeFile(exported, JSON.stringify(rows));
      execFileSync(process.execPath, [
        join(directory, "scripts/import-rootset.mjs"),
        exported,
      ]);
      assert.deepEqual(
        JSON.parse(
          await readFile(join(directory, "src/geo/countries.json"), "utf8"),
        ),
        snapshot,
      );
    }
    const rows = structuredClone(snapshot).map((values) => ({ values }));
    rows[0].values.flagUrl = "https://example.com/ad.svg";
    await writeFile(exported, JSON.stringify(rows));
    assert.throws(() =>
      execFileSync(
        process.execPath,
        [join(directory, "scripts/import-rootset.mjs"), exported],
        { stdio: "pipe" },
      ),
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
