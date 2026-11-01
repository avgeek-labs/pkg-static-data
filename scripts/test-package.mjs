import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const temporary = await mkdtemp(join(tmpdir(), "country-data-package-"));
const published = process.argv.includes("--published");
const candidate = process.argv.includes("--candidate");
assert.ok(
  !(published && candidate),
  "Choose a candidate or the published package.",
);
try {
  const destination = candidate ? join(root, "artifacts") : temporary;
  await mkdir(destination, { recursive: true });
  const packed = JSON.parse(
    execFileSync("npm", ["pack", "--json", "--pack-destination", destination], {
      cwd: root,
      encoding: "utf8",
    }),
  )[0];
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
    "@avgeek-labs:registry=https://npm.pkg.github.com\n//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}\n",
  );
  const manifest = JSON.parse(
    await readFile(join(root, "package.json"), "utf8"),
  );
  const target = published
    ? `${manifest.name}@${manifest.version}`
    : join(destination, packed.filename);
  execFileSync(
    "npm",
    [
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--registry=https://npm.pkg.github.com",
      target,
    ],
    { cwd: temporary, stdio: "pipe" },
  );
  const consumer = `import { geo } from '@avgeek-labs/static-data';
    if (geo.getCountry('IN')?.countryAlphaThree !== 'IND') throw new Error('Geo namespace failed');
    import { getCountry, getCountryName, getCountryOptions, getCountryFlagUrl, queryCountries } from '@avgeek-labs/static-data/geo';
    import data from '@avgeek-labs/static-data/geo/data' with { type: 'json' };
    if (getCountryFlagUrl('IN') !== 'https://assets.avgeek.ltd/country-flags/in.svg' || data.some(country => country.flagUrl !== 'https://assets.avgeek.ltd/country-flags/' + country.countryAlphaTwo.toLowerCase() + '.svg')) throw new Error('Packed flag URLs failed');
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
      resolve(root, "node_modules/typescript/bin/tsc"),
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
  if (candidate)
    await writeFile(
      join(destination, "package.json"),
      `${JSON.stringify(packed, null, 2)}\n`,
    );
  console.log(
    `${published ? "Published" : "Packed"} JavaScript and TypeScript consumers passed (${packed.size} bytes compressed).`,
  );
} finally {
  await rm(temporary, { recursive: true, force: true });
}
