import assert from "node:assert/strict";

export const locales =
  "en ar bn de es fa fr gu hi id it ja ko mr pa pt ru sw ta te tr ur vi zh zh-Hant".split(
    " ",
  );
const strings = [
  "countryName",
  "countryAlphaTwo",
  "countryAlphaThree",
  "countryNumeric",
  "countryOfficialName",
  "flagUrl",
  "lastVerifiedAt",
];
const nullableStrings = [
  "phoneCallingCode",
  "regionCode",
  "regionName",
  "subregionCode",
  "subregionName",
  "parentCountryAlphaTwo",
];
const arrays = [
  "countryNativeNames",
  "countryAliases",
  "phoneAreaCodeSuffixes",
  "capitalCities",
  "currencyCodes",
  "officialLanguageCodes",
  "timeZoneIds",
  "countryCodeTopLevelDomains",
];
const fields = [
  ...strings,
  ...nullableStrings,
  ...arrays,
  "countryLocalizedNames",
  "drivingSide",
  "isIndependent",
  "isLandlocked",
  "measurementSystem",
].sort();

export function validateData(countries) {
  assert.equal(countries.length, 249, "Expected all 249 ISO entries");
  for (const field of [
    "countryAlphaTwo",
    "countryAlphaThree",
    "countryNumeric",
  ]) {
    assert.equal(
      new Set(countries.map((c) => c[field])).size,
      countries.length,
      `Duplicate ${field}`,
    );
  }
  const codes = new Set(countries.map((c) => c.countryAlphaTwo));
  for (const country of countries) {
    const code = country.countryAlphaTwo;
    assert.deepEqual(
      Object.keys(country).sort(),
      fields,
      `Unexpected fields for ${code}`,
    );
    for (const field of strings)
      assert.ok(
        typeof country[field] === "string" && country[field].length,
        `${code}.${field}`,
      );
    for (const field of nullableStrings)
      assert.ok(
        country[field] === null || typeof country[field] === "string",
        `${code}.${field}`,
      );
    for (const field of arrays)
      assert.ok(Array.isArray(country[field]), `${code}.${field}`);
    for (const field of arrays.filter(
      (f) => !["countryNativeNames", "capitalCities"].includes(f),
    )) {
      assert.ok(
        country[field].every((v) => typeof v === "string" && v.length),
        `${code}.${field} elements`,
      );
    }
    for (const name of country.countryNativeNames) {
      assert.ok(
        ["languageCode", "commonName", "officialName"].every(
          (f) => typeof name[f] === "string" && name[f].length,
        ),
        `${code} native name`,
      );
    }
    for (const capital of country.capitalCities) {
      assert.ok(
        typeof capital.name === "string" &&
          capital.name.length &&
          Array.isArray(capital.roles) &&
          capital.roles.every((r) => typeof r === "string"),
        `${code} capital`,
      );
    }
    assert.match(code, /^[A-Z]{2}$/);
    assert.match(country.countryAlphaThree, /^[A-Z]{3}$/);
    assert.match(country.countryNumeric, /^\d{3}$/);
    assert.equal(
      country.flagUrl,
      `https://assets.avgeek.ltd/country-flags/${code.toLowerCase()}.svg`,
    );
    assert.ok(
      Number.isFinite(Date.parse(country.lastVerifiedAt)),
      `${code} verification timestamp`,
    );
    assert.ok(
      country.phoneCallingCode === null ||
        /^\d{1,3}$/.test(country.phoneCallingCode),
      `${code} calling code`,
    );
    assert.ok(
      country.phoneAreaCodeSuffixes.every((v) => /^\d+$/.test(v)),
      `${code} area suffixes`,
    );
    assert.ok(
      country.parentCountryAlphaTwo === null ||
        (codes.has(country.parentCountryAlphaTwo) &&
          country.parentCountryAlphaTwo !== code),
      `${code} parent`,
    );
    assert.ok(
      country.isIndependent === null ||
        typeof country.isIndependent === "boolean",
      `${code} independence`,
    );
    assert.ok(
      !country.isIndependent || country.parentCountryAlphaTwo === null,
      `${code} independent parent`,
    );
    assert.equal(typeof country.isLandlocked, "boolean");
    assert.ok(
      ["metric", "uksystem", "ussystem"].includes(country.measurementSystem),
      `${code} units`,
    );
    assert.ok(
      [null, "left", "right"].includes(country.drivingSide),
      `${code} driving side`,
    );
    assert.deepEqual(
      Object.keys(country.countryLocalizedNames).sort(),
      [...locales].sort(),
      `${code} locales`,
    );
    assert.ok(
      Object.values(country.countryLocalizedNames).every(
        (v) => typeof v === "string" && v.trim().length,
      ),
      `${code} translated names`,
    );
  }
  return countries;
}
