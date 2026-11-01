# Static Data

Country reference data and localized names for JavaScript applications. Includes
249 ISO countries and territories, with no runtime dependencies or network calls.
Flag artwork is hosted separately as SVGs on `assets.avgeek.ltd/country-flags/`.

Package name: `@avgeek-labs/static-data`. Country data is available from the
`/geo` export, with ESM and TypeScript declarations for Node.js 26 and modern
browser bundlers.

```sh
npm install @avgeek-labs/static-data
```

```ts
import {
  getCountry,
  getCountryName,
  getCountryFlagUrl,
  getCountryOptions,
  filterCountries,
  searchCountries,
  getCountriesByCallingCode,
} from "@avgeek-labs/static-data/geo";

getCountry("in"); // India; also accepts IND or 356
getCountryName("IN", "ta"); // இந்தியா
getCountryFlagUrl("IN"); // https://assets.avgeek.ltd/country-flags/in.svg
getCountryOptions({ locale: "fr", filter: { isIndependent: true } });
filterCountries({ currencyCode: "EUR", isLandlocked: true });
searchCountries("भारत", "hi");
getCountriesByCallingCode("+1"); // All matching countries/territories
```

## API

| Export                                                           | Purpose                                                                                          |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `countries`                                                      | Deeply frozen country snapshot, sorted by alpha-2 code                                           |
| `queryCountries({ select?, where?, locale?, orderBy?, limit? })` | Filter, localize, sort, and select fields in one query                                           |
| `getCountry(code)`                                               | Find by alpha-2, alpha-3, or three-digit numeric string                                          |
| `getCountryByAlphaTwo(code)`                                     | Find by alpha-2 code                                                                             |
| `getCountryByAlphaThree(code)`                                   | Find by alpha-3 code                                                                             |
| `getCountryByNumeric(code)`                                      | Find by numeric string, retaining leading zeros                                                  |
| `getCountryName(code, locale?)`                                  | Localized common display name                                                                    |
| `getCountryFlagUrl(code)`                                        | Curated SVG URL                                                                                  |
| `getCountryOptions({ locale?, filter? })`                        | Localized, sorted `{ value, label, flagUrl }` picker options                                     |
| `filterCountries(filter?)`                                       | Combine geographic, currency, language, timezone, independence, driving, and measurement filters |
| `searchCountries(query, locale?)`                                | Search codes, names, aliases, native names, and localized names                                  |
| `getCountriesByCallingCode(code)`                                | Find every country sharing a calling code                                                        |
| `getParentCountry(code)`                                         | Find the administering/realm country, if recorded                                                |
| `getCountryTerritories(code)`                                    | Find territories linked to a country                                                             |
| `resolveLocale(locale?)`                                         | Resolve a BCP 47 locale to bundled localization                                                  |
| `supportedLocales`                                               | List the bundled locales                                                                         |
| `datasetInfo`                                                    | Snapshot and localization versions                                                               |

Unknown country codes return `undefined`; unknown calling codes return an empty
array. Codes are trimmed and alpha codes are case-insensitive. Numeric codes are
strings: use `"004"`, not `4`. Calling-code lookup is not phone-number parsing;
use a phone library for complete number validation and territory resolution.
Empty search text returns an empty array. Search removes diacritics and uses
substring matching; it does not transliterate scripts or apply fuzzy ranking.

All supplied filters must match. Region/subregion filters use UN M49 digit
strings. `officialLanguageCode` uses the stored ISO language codes, generally
ISO 639-3 (`eng`, `hin`), rather than the BCP 47 keys used for localization.
IANA timezone identifiers are matched exactly. Results containing countries
reference immutable data; modify copies if an application needs editable state.

## Queries

For a country/phone picker, request just the fields needed by the application:

```ts
import { queryCountries } from "@avgeek-labs/static-data/geo";

const countries = queryCountries({
  select: ["countryAlphaTwo", "countryName", "phonePrefix"],
  where: { hasCallingCode: true },
  locale: "en",
  orderBy: { field: "countryName", direction: "asc" },
});
// Includes { countryAlphaTwo: 'IN', countryName: 'India', phonePrefix: '+91' }
```

TypeScript infers the selected fields; unselected fields are not present in the
result type. Omit `select` to return every country field plus `phonePrefix`.
`phoneCallingCode` remains the stored digit string; `phonePrefix` is a convenience
field formatted with `+`, or null when no calling code is recorded.

`where` supports all `CountryFilter` properties plus `hasCallingCode` and
`phoneCallingCode` (digits or a leading `+`). Conditions are combined with AND.
For example, `where: { phoneCallingCode: '+1' }` returns every matching entry,
preserving shared calling-code relationships. `hasCallingCode: false` selects
only entries without a calling code.

Supplying `locale` localizes `countryName`; official and native names retain
their stored values. Without it, names retain the snapshot's common names.
Sorting supports `countryName`, `countryAlphaTwo`, `countryAlphaThree`, and
`countryNumeric`, in either direction. Without sorting, results use alpha-2
snapshot order. `limit` applies after sorting and must be a non-negative safe
integer. Queries return new top-level objects, with shared immutable nested
data. This is a local package API, not an HTTP endpoint.

## Localization

Country display names come from Unicode CLDR 48.2, not machine translation.
There are 24 languages and 25 locale maps:

English, Arabic, Bengali, German, Spanish, Persian, French, Gujarati, Hindi,
Indonesian, Italian, Japanese, Korean, Marathi, Punjabi, Portuguese, Russian,
Swahili, Tamil, Telugu, Turkish, Urdu, Vietnamese, and Chinese (Simplified and
Traditional).

`countryLocalizedNames` is a locale-to-name object on each country. These are
common display names, not translations of official legal names. Locale fallback
is exact supported locale, supported base language, then English. Traditional
Chinese regional locales such as `zh-TW` and `zh-HK` resolve to `zh-Hant`.
Invalid BCP 47 tags throw `RangeError`; unsupported valid locales fall back to
English. Picker labels are sorted with `Intl.Collator`, so order can vary with
the runtime's ICU version. Country name content comes from the pinned snapshot.

## Data and maintenance

The geo snapshot in `src/geo/countries.json` contains country reference data;
applications do not contact an API. The `/geo/data` export provides the same raw
JSON snapshot. It was restored from the country-data 0.1.1 source archive.

The snapshot includes identifiers, official/native names and aliases, regional
classification, capitals, currencies, official language codes, IANA timezones,
country-code domains, calling codes and known area suffixes, driving side,
measurement defaults, independence and parent relationships, flag URLs, and the
last verification timestamp. Nulls mean a value is unavailable, inapplicable,
or intentionally unassigned; they must not be interpreted as false or an empty
identifier. Known area suffixes are not a complete dialing plan.

`isIndependent` is deliberately null for Palestine, Taiwan, Western Sahara,
Cook Islands, and Niue. Parent links describe administration or realm
relationships, not a general sovereignty adjudication; freely associated states
are not treated as dependencies. Antarctica is not assigned a parent.
`measurementSystem` follows CLDR defaults (`metric`, `ussystem`, `uksystem`),
not a claim that every measurement in a country uses that system.

To refresh, export all rows from Rootset as a JSON array (row objects with
`values`, or plain country objects), then run:

```sh
npm ci
node scripts/import-rootset.mjs /absolute/path/countries-export.json
npm run verify
```

Review the snapshot diff, update `datasetInfo` when its date/schema changes,
and commit it before release. Do not put Rootset credentials in this repository.
Import fails on missing fields, duplicate ISO identifiers, incomplete locale
maps, or missing parent references. The importer migrates legacy flag URLs from
the old hostname to the shared public-assets path. Tests validate the data and public API.
Package verification installs the packed tarball into a clean temporary project
and checks JavaScript and TypeScript consumers.

## Installation and releases

Use Node 26 and npm 11.20.0. The package is public on GitHub Packages. GitHub's
npm registry requires authentication for public packages too. Configure `.npmrc`:

```ini
@avgeek-labs:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

Supply `NODE_AUTH_TOKEN` with `read:packages` access for local installation.
The root export exposes a `geo` namespace; country lookups are available from
`@avgeek-labs/static-data/geo`.

For a data or API change, run `npm run changeset` and commit the version note.
GitHub Actions opens a release PR with the version and changelog. Merging it
publishes through `GITHUB_TOKEN` and creates a GitHub release and tag. Releases
run the full checks and a fresh registry consumer. Published versions are
immutable; corrections get a new version. On release PRs created by
`GITHUB_TOKEN`, use **Approve workflows to run** before merging. Manual CI
dispatch is also available.

## Licensing

Package code is MIT. The country database includes ODbL-1.0-derived reference
data; localized names are Unicode-3.0. See `NOTICE.md`, `LICENSE-DATA`, and
`LICENSE-UNICODE` for source attribution and data-license terms. License notices
are included in the npm tarball. A future public release must preserve them.
