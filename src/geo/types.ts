export type MeasurementSystem = "metric" | "ussystem" | "uksystem";
export type DrivingSide = "left" | "right";

export interface NativeName {
  readonly languageCode: string;
  readonly commonName: string;
  readonly officialName: string;
}

export interface CapitalCity {
  readonly name: string;
  readonly roles: readonly string[];
}

export interface Country {
  readonly countryName: string;
  readonly countryAlphaTwo: string;
  readonly countryAlphaThree: string;
  readonly countryNumeric: string;
  readonly countryOfficialName: string;
  readonly countryNativeNames: readonly NativeName[];
  readonly countryAliases: readonly string[];
  readonly countryLocalizedNames: Readonly<Record<string, string>>;
  readonly flagUrl: string;
  readonly phoneCallingCode: string | null;
  readonly phoneAreaCodeSuffixes: readonly string[];
  readonly regionCode: string | null;
  readonly regionName: string | null;
  readonly subregionCode: string | null;
  readonly subregionName: string | null;
  readonly capitalCities: readonly CapitalCity[];
  readonly currencyCodes: readonly string[];
  readonly officialLanguageCodes: readonly string[];
  readonly timeZoneIds: readonly string[];
  readonly countryCodeTopLevelDomains: readonly string[];
  readonly drivingSide: DrivingSide | null;
  readonly lastVerifiedAt: string;
  readonly isIndependent: boolean | null;
  readonly parentCountryAlphaTwo: string | null;
  readonly isLandlocked: boolean;
  readonly measurementSystem: MeasurementSystem;
}

export interface CountryFilter {
  readonly regionCode?: string;
  readonly subregionCode?: string;
  readonly currencyCode?: string;
  /** ISO language code used by officialLanguageCodes, usually ISO 639-3. */
  readonly officialLanguageCode?: string;
  readonly timeZoneId?: string;
  readonly parentCountryAlphaTwo?: string;
  readonly isIndependent?: boolean;
  readonly isLandlocked?: boolean;
  readonly drivingSide?: DrivingSide;
  readonly measurementSystem?: MeasurementSystem;
}

export interface CountryOption {
  readonly value: string;
  readonly label: string;
  readonly flagUrl: string;
}

export interface CountryOptionsConfig {
  readonly locale?: string;
  readonly filter?: CountryFilter;
}

export interface CountryQueryRecord extends Country {
  /** Calling code formatted with a leading +, or null when unavailable. */
  readonly phonePrefix: string | null;
}

export interface CountryQueryFilter extends CountryFilter {
  readonly hasCallingCode?: boolean;
  readonly phoneCallingCode?: string;
}

export type CountrySortField =
  "countryName" | "countryAlphaTwo" | "countryAlphaThree" | "countryNumeric";

export interface CountryQuery<
  Field extends keyof CountryQueryRecord = keyof CountryQueryRecord,
> {
  readonly select?: readonly Field[];
  readonly where?: CountryQueryFilter;
  /** Localize countryName when supplied; other country fields retain their stored values. */
  readonly locale?: string;
  readonly orderBy?: {
    readonly field: CountrySortField;
    readonly direction?: "asc" | "desc";
  };
  readonly limit?: number;
}
