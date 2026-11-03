import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const temporary = await mkdtemp(join(tmpdir(), "country-data-package-"));
const published = process.argv.includes("--published");
try {
  const packed = JSON.parse(
    execFileSync(
      process.env.npm_execpath,
      ["pack", "--json", "--pack-destination", temporary],
      {
        cwd: root,
        encoding: "utf8",
      },
    ),
  );
  const files = new Set(packed.files.map((file) => file.path));
  for (const file of [
    "dist/geo/index.js",
    "dist/geo/index.d.ts",
    "dist/geo/countries.json",
    "LICENSE",
    "LICENSE-DATA",
    "LICENSE-UNICODE",
    "NOTICE.md",
  ])
    assert.ok(files.has(file), `Missing ${file}`);
  assert.ok(
    ![...files].some(
      (path) => path.startsWith("src/") || path.includes(".env"),
    ),
  );
  await writeFile(
    join(temporary, "package.json"),
    '{"type":"module","private":true}',
  );
  await writeFile(
    join(temporary, ".npmrc"),
    "@avgeek-labs:registry=https://npm.pkg.github.com\n",
  );
  const manifest = JSON.parse(
    await readFile(join(root, "package.json"), "utf8"),
  );
  await writeFile(
    join(temporary, "pnpm-workspace.yaml"),
    'minimumReleaseAgeExclude:\n  - "@avgeek-labs/*"\n',
  );
  const target = published
    ? `${manifest.name}@${manifest.version}`
    : packed.filename;
  execFileSync(
    process.env.npm_execpath,
    [
      "add",
      "--ignore-scripts",
      target,
      `typescript@${manifest.devDependencies.typescript}`,
    ],
    { cwd: temporary, stdio: "pipe" },
  );
  const installed = join(temporary, "node_modules/@avgeek-labs/static-data");
  for (const file of [
    "LICENSE",
    "LICENSE-DATA",
    "LICENSE-UNICODE",
    "NOTICE.md",
  ]) {
    assert.deepEqual(
      await readFile(join(installed, file)),
      await readFile(join(root, file)),
      `${file} must remain intact in the installed package`,
    );
  }
  assert.deepEqual(
    JSON.parse(
      await readFile(join(installed, "dist/geo/countries.json"), "utf8"),
    ),
    JSON.parse(await readFile(join(root, "src/geo/countries.json"), "utf8")),
    "The installed package must preserve the entire country snapshot",
  );
  const installedManifest = JSON.parse(
    await readFile(join(installed, "package.json"), "utf8"),
  );
  assert.deepEqual(installedManifest.exports, manifest.exports);
  assert.equal(installedManifest.publishConfig.access, "public");
  assert.equal(Object.keys(installedManifest.dependencies ?? {}).length, 0);
  const consumer = `import { geo } from '@avgeek-labs/static-data';
    if (geo.getCountry('IN')?.countryAlphaThree !== 'IND') throw new Error('Geo namespace failed');
    import { getCountry, getCountryName, getCountryOptions, getCountryFlagUrl, queryCountries } from '@avgeek-labs/static-data/geo';
    import data from '@avgeek-labs/static-data/geo/data' with { type: 'json' };
    if (getCountryFlagUrl('IN') !== 'https://static.avgeek.ltd/geo/country-flags/in.svg' || data.some(country => country.flagUrl !== 'https://static.avgeek.ltd/geo/country-flags/' + country.countryAlphaTwo.toLowerCase() + '.svg')) throw new Error('Packed flag URLs failed');
    if (getCountry('IND')?.countryNumeric !== '356' || getCountryName('IN', 'ta') !== 'இந்தியா' || data.length !== 249 || getCountryOptions().length !== 249 || queryCountries({ select: ['phonePrefix'], where: { phoneCallingCode: '91' } })[0]?.phonePrefix !== '+91') throw new Error('Packed API failed');`;
  await writeFile(join(temporary, "consumer.mjs"), consumer);
  execFileSync(process.execPath, [join(temporary, "consumer.mjs")], {
    cwd: temporary,
    stdio: "pipe",
  });
  await writeFile(
    join(temporary, "consumer.ts"),
    `import { getCountry, filterCountries, queryCountries, type Country } from '@avgeek-labs/static-data/geo';
    const country: Country | undefined = getCountry('IN');
    filterCountries({ isIndependent: true, currencyCode: 'INR' });
    if (country) {
      // @ts-expect-error Country records are immutable.
      country.countryName = 'Changed';
      // @ts-expect-error Nested arrays are immutable.
      country.currencyCodes.push('XXX');
    }
    // @ts-expect-error Invalid measurement system.
    filterCountries({ measurementSystem: 'imperial' });
    const results = queryCountries({ select: ['countryAlphaTwo', 'phonePrefix'], where: { hasCallingCode: true } });
    const prefix: string | null = results[0].phonePrefix;
    // @ts-expect-error Unselected fields are not exposed.
    results[0].countryName;
    // @ts-expect-error Unknown fields cannot be selected.
    queryCountries({ select: ['unknownField'] });
    // @ts-expect-error Sorting on arrays is unsupported.
    queryCountries({ orderBy: { field: 'currencyCodes' } });
    const all: Country = queryCountries()[0];`,
  );
  execFileSync(
    process.execPath,
    [
      resolve(temporary, "node_modules/typescript/bin/tsc"),
      "--noEmit",
      "--strict",
      "--module",
      "NodeNext",
      "--target",
      "ES2022",
      "consumer.ts",
    ],
    { cwd: temporary, stdio: "pipe" },
  );
  execFileSync(
    process.execPath,
    [
      resolve(temporary, "node_modules/typescript/bin/tsc"),
      "--noEmit",
      "--strict",
      "--module",
      "ESNext",
      "--moduleResolution",
      "Bundler",
      "--target",
      "ES2022",
      "--lib",
      "ES2022,ES2022.Intl",
      "consumer.ts",
    ],
    { cwd: temporary, stdio: "pipe" },
  );
  console.log(
    `${published ? "Published" : "Packed"} JavaScript and portable TypeScript consumers passed; data, licenses, exports, and public access preserved.`,
  );
} finally {
  await rm(temporary, { recursive: true, force: true });
}
