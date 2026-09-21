# Ensemble daily apparent-temperature method

## Provider fields and request identity

The ensemble uses Open-Meteo's documented daily variables
`apparent_temperature_max` and `apparent_temperature_min`. They are requested
alongside `temperature_2m_max` and `temperature_2m_min` in the existing single
multi-model Forecast API request. Consequently, each value has the same
latitude, longitude, requested elevation, timezone, local date, and model suffix
as its corresponding actual-temperature value.

Open-Meteo documents these as daily apparent-temperature maxima and minima in
the Forecast API daily weather variables:
https://open-meteo.com/en/docs#daily_parameter_definition

The multi-model response convention appends the selected model identifier to
each variable. Parsing therefore reads only matching suffixes (for example,
`apparent_temperature_max_gfs_seamless` is paired only with the GFS actual
temperature fields):
https://open-meteo.com/en/docs#models

## Inclusion and aggregation

For a source and local date to contribute, all four daily values must be finite:
actual maximum, actual minimum, apparent maximum, and apparent minimum. The
apparent maximum must also be greater than or equal to the apparent minimum.
Missing, non-finite, partial, or inverted apparent pairs are omitted together.

`feelsLikeMaxMean` and `feelsLikeMinMean` are separately rounded to one decimal
place after averaging the accepted source daily extrema. They are not extrema
calculated from hourly samples or from an hourly ensemble mean. The same
human-readable source labels appear in `feelsLikeSources` and the accepted
values appear on that day's `perSource` entry. With no accepted model pair, both
means are `null` and the source list is empty.

## Coverage limitation

MET Norway Locationforecast currently provides instantaneous air temperature
but no native, comparable daily apparent-temperature maximum/minimum fields. It
is deliberately excluded from apparent-temperature means rather than applying
a local formula or mixing in an unrelated model. MET Norway remains unchanged
as an air-temperature and precipitation fallback, including the existing
MET-only snow fallback.