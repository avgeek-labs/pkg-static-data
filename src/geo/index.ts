import snapshot from "./countries.json" with { type: "json" };
import type {
  Country,
  CountryFilter,
  CountryOption,
  CountryOptionsConfig,
  CountryQuery,
  CountryQueryRecord,
} from "./types.js";

export type {
  Country,
  CountryFilter,
  CountryOption,
  CountryOptionsConfig,
  CountryQuery,
  CountryQueryRecord,
  CountryQueryFilter,
  CountrySortField,
  NativeName,
  CapitalCity,
  DrivingSide,
  MeasurementSystem,
} from "./types.js";

function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

/** Immutable snapshot of the curated country data. */
export const countries: readonly Country[] = freeze(
  snapshot as unknown as Country[],
);
export const supportedLocales = Object.freeze([
  "en",
  "ar",
  "bn",
  "de",
  "es",
  "fa",
  "fr",
  "gu",
  "hi",
  "id",
  "it",
  "ja",
  "ko",
  "mr",
  "pa",
  "pt",
  "ru",
  "sw",
  "ta",
  "te",
  "tr",
  "ur",
  "vi",
  "zh",
  "zh-Hant",
] as const);
export type SupportedLocale = (typeof supportedLocales)[number];
export const datasetInfo = Object.freeze({
  source: "Rootset Countries",
  schemaVersion: 40,
  localizationSource: "Unicode CLDR 48.2",
  snapshotDate: "2026-10-18",
  countryCount: countries.length,
});

const byAlphaTwo = new Map(
  countries.map((country) => [country.countryAlphaTwo, country]),
);
const byAlphaThree = new Map(
  countries.map((country) => [country.countryAlphaThree, country]),
);
const byNumeric = new Map(
  countries.map((country) => [country.countryNumeric, country]),
);

/** Resolve an ISO alpha-2, alpha-3, or three-digit numeric string. Unknown codes return undefined. */
export function getCountry(code: string): Country | undefined {
  const normalized = code.trim().toUpperCase();
  return (
    byAlphaTwo.get(normalized) ??
    byAlphaThree.get(normalized) ??
    byNumeric.get(normalized)
  );
}

export function getCountryByAlphaTwo(code: string): Country | undefined {
  return byAlphaTwo.get(code.trim().toUpperCase());
}

export function getCountryByAlphaThree(code: string): Country | undefined {
  return byAlphaThree.get(code.trim().toUpperCase());
}

/** Numeric identifiers stay strings so leading zeros are preserved. */
export function getCountryByNumeric(code: string): Country | undefined {
  return byNumeric.get(code.trim());
}

/** Canonicalize a BCP 47 locale, falling back to its language and then English. */
export function resolveLocale(locale = "en"): SupportedLocale {
  const tag = new Intl.Locale(locale);
  const canonical = tag.baseName;
  if ((supportedLocales as readonly string[]).includes(canonical))
    return canonical as SupportedLocale;
  const maximized = tag.maximize();
  if (tag.language === "zh" && maximized.script === "Hant") return "zh-Hant";
  if ((supportedLocales as readonly string[]).includes(tag.language))
    return tag.language as SupportedLocale;
  return "en";
}

export function getCountryName(
  code: string,
  locale = "en",
): string | undefined {
  const country = getCountry(code);
  if (!country) return undefined;
  return (
    country.countryLocalizedNames[resolveLocale(locale)] ?? country.countryName
  );
}

export function getCountryFlagUrl(code: string): string | undefined {
  return getCountry(code)?.flagUrl;
}

export function getParentCountry(code: string): Country | undefined {
  const parent = getCountry(code)?.parentCountryAlphaTwo;
  return parent ? byAlphaTwo.get(parent) : undefined;
}

export function getCountryTerritories(code: string): readonly Country[] {
  const country = getCountry(code);
  return country
    ? countries.filter(
        (item) => item.parentCountryAlphaTwo === country.countryAlphaTwo,
      )
    : [];
}

/** Accept digits with an optional leading +. This is a code lookup, not a phone-number parser. */
export function getCountriesByCallingCode(code: string): readonly Country[] {
  const normalized = code.trim().replace(/^\+/, "");
  if (!/^\d{1,3}$/.test(normalized)) return [];
  return countries.filter((country) => country.phoneCallingCode === normalized);
}

/** All supplied filters must match; null independence values do not match true or false. */
export function filterCountries(
  filter: CountryFilter = {},
): readonly Country[] {
  return countries.filter(
    (country) =>
      (filter.regionCode === undefined ||
        country.regionCode === filter.regionCode) &&
      (filter.subregionCode === undefined ||
        country.subregionCode === filter.subregionCode) &&
      (filter.currencyCode === undefined ||
        country.currencyCodes.includes(
          filter.currencyCode.trim().toUpperCase(),
        )) &&
      (filter.officialLanguageCode === undefined ||
        country.officialLanguageCodes.includes(
          filter.officialLanguageCode.trim().toLowerCase(),
        )) &&
      (filter.timeZoneId === undefined ||
        country.timeZoneIds.includes(filter.timeZoneId)) &&
      (filter.parentCountryAlphaTwo === undefined ||
        country.parentCountryAlphaTwo ===
          filter.parentCountryAlphaTwo.trim().toUpperCase()) &&
      (filter.isIndependent === undefined ||
        country.isIndependent === filter.isIndependent) &&
      (filter.isLandlocked === undefined ||
        country.isLandlocked === filter.isLandlocked) &&
      (filter.drivingSide === undefined ||
        country.drivingSide === filter.drivingSide) &&
      (filter.measurementSystem === undefined ||
        country.measurementSystem === filter.measurementSystem),
  );
}

function searchKey(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/** Match codes, common/official names, aliases, native names, and the selected localized name. */
export function searchCountries(
  query: string,
  locale = "en",
): readonly Country[] {
  const term = searchKey(query.trim());
  if (!term) return [];
  const language = resolveLocale(locale);
  return countries.filter((country) =>
    [
      country.countryAlphaTwo,
      country.countryAlphaThree,
      country.countryNumeric,
      country.countryName,
      country.countryOfficialName,
      country.countryLocalizedNames[language] ?? "",
      ...country.countryAliases,
      ...country.countryNativeNames.flatMap((name) => [
        name.commonName,
        name.officialName,
      ]),
    ].some((name) => searchKey(name).includes(term)),
  );
}

/** Localized, alphabetically sorted alpha-2 options suitable for country pickers. */
export function getCountryOptions({
  locale = "en",
  filter = {},
}: CountryOptionsConfig = {}): readonly CountryOption[] {
  const language = resolveLocale(locale);
  const collator = new Intl.Collator(language);
  return filterCountries(filter)
    .map((country) => ({
      value: country.countryAlphaTwo,
      label: country.countryLocalizedNames[language] ?? country.countryName,
      flagUrl: country.flagUrl,
    }))
    .sort(
      (a, b) =>
        collator.compare(a.label, b.label) || a.value.localeCompare(b.value),
    );
}

/** Filter, localize, sort, and project countries in one offline query. */
export function queryCountries<
  const Field extends keyof CountryQueryRecord = keyof CountryQueryRecord,
>({
  select,
  where = {},
  locale,
  orderBy,
  limit,
}: CountryQuery<Field> = {}): readonly Pick<CountryQueryRecord, Field>[] {
  if (limit !== undefined && (!Number.isSafeInteger(limit) || limit < 0)) {
    throw new RangeError("limit must be a non-negative safe integer");
  }
  const language = locale === undefined ? undefined : resolveLocale(locale);
  const { hasCallingCode, phoneCallingCode, ...filter } = where;
  const callingCode = phoneCallingCode?.trim().replace(/^\+/, "");
  let results: CountryQueryRecord[] = filterCountries(filter)
    .filter(
      (country) =>
        (hasCallingCode === undefined ||
          (country.phoneCallingCode !== null) === hasCallingCode) &&
        (callingCode === undefined || country.phoneCallingCode === callingCode),
    )
    .map((country) => ({
      ...country,
      countryName:
        language === undefined
          ? country.countryName
          : (country.countryLocalizedNames[language] ?? country.countryName),
      phonePrefix:
        country.phoneCallingCode === null
          ? null
          : `+${country.phoneCallingCode}`,
    }));
  if (orderBy) {
    const collator = new Intl.Collator(language ?? "en");
    const direction = orderBy.direction === "desc" ? -1 : 1;
    results.sort(
      (a, b) =>
        direction *
        (collator.compare(a[orderBy.field], b[orderBy.field]) ||
          a.countryAlphaTwo.localeCompare(b.countryAlphaTwo)),
    );
  }
  if (limit !== undefined) results = results.slice(0, limit);
  return results.map((country) =>
    select === undefined
      ? country
      : (Object.fromEntries(
          select.map((field) => [field, country[field]]),
        ) as Pick<CountryQueryRecord, Field>),
  );
}
