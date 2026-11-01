# Data sources and licenses

Code in this repository is licensed under MIT (`LICENSE`). Data is separately
licensed; the code license does not replace the upstream data terms.

The curated country database is an adapted database containing reference fields
derived from [mledoze/countries](https://github.com/mledoze/countries), licensed
under Open Database License 1.0 (`LICENSE-DATA`). The derived database is made
available under ODbL-1.0. Changes include selecting 249 ISO entries, curating
identifiers and calling codes, supplementing fields, adding administration
relationships and nullable independence classifications, and hosting flag URLs.
The country-data source revision used during enrichment was
`c9016cb1933528c21d69f2ff663788561d58f1fc`.

Localized country names are derived from
[Unicode CLDR JSON](https://github.com/unicode-org/cldr-json), distributed as
`cldr-localenames-full@48.2.0`, under Unicode License V3 (`LICENSE-UNICODE`).
Copyright © 2004–2026 Unicode, Inc. Names were selected for 249 ISO entries and
25 locales; territory-group and alternate-name entries are excluded.

Other verification references include UN M49 geographical regions, ISO country
identifiers, Unicode CLDR currency/language/measurement metadata, IANA timezone
and root-zone data, and national/territorial administration and dialing sources.
The snapshot was originally curated in the Avgeek Rootset Countries table.

Flag artwork is hosted externally and is not included in this repository or npm
tarball. This package supplies URLs; it does not grant additional rights in
national symbols or artwork. The R2 uploads preserve the existing flag assets.
