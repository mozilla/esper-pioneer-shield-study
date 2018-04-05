# Telemetry sent by this add-on

## Usual Firefox Telemetry is unaffected.

* No change: `main` and other pings are UNAFFECTED by this add-on.
* Respects telemetry preferences. If user has disabled telemetry, no telemetry will be sent.

## `pioneer-study` pings (common to all pioneer-studies)

`pioneer-utils` sends the usual packets.

This study has no surveys and as such has NO SPECIFIC ENDINGS.

## `pioneer-study` pings, specific to THIS study.

No user interaction is instrumented in this study. Instead, the add-on performs a one-time collection of a large
subset of telemetry fields for the cohort of users participating in the Firefox Pioneer project. The collection of
normal telemetry variables for this cohort in conjunction with the extended data collection unique to Pioneer will
allow both quantitative and qualitative comparison of the Pioneer cohort to the Firefox release population.

At add-on installation, the add-on will wait for Telemetry to be fully initialized
(which can take over a minute if Firefox was just started), and finally collect the relevant telemetry and send a ping with that payload.

### Attributes

Collected from the current telemetry environment:

```
defaultSearchEngine
locale
os
appUpdateChannel
profileCreationDate
appVersion
systemMemoryMb
systemCpuCores
systemCpuSpeedMhz
osVersion
systemGfxMonitors1ScreenWidth
systemGfxMonitors1ScreenWidthZeroIndexed
```

Collected from the current telemetry subsession ping payload:

```
uptime
totalTime
profileSubsessionCounter
subsessionStartDate
timezoneOffest
searchCounts
```

Note: To increment the search_counts attribute, you'll need to have performed at least one search using the firefox search bar and then reload the addon.

Collected using `Services.telemetry.snapshotScalars` and `Services.telemetry.snapshotKeyedScalars` (spbe is short for scalar_parent_browser_engagement):

```
spbeWindowOpenEventCount
spbeTotalUriCount
spbeNavigationUrlbar
spbeNavigationContextmenu
spbeTabOpenEventCount
spbeNavigationSearchbar
spbeNavigationAboutNewtab
spbeUniqueDomainsCount
spbeMaxConcurrentWindowCount
spbeMaxConcurrentTabCount
spbeUnfilteredUriCount
```

Collected by querying the places sqlite database in the same way that ordinary telemetry would do, if it would do it predictably:

```
placesBookmarksCount
placesPagesCount
```

Not collected by the add-on, but is added by server-side telemetry processing based on the user's IP:

```
metadata.geoCountry
metadata.geoCity
```

When a certain probe is not set in the current telemetry environment, the string "null" is set instead.

### Peculiarities

1. The places_bookmarks_count and places_pages_count attributes are only available occasionally in the ordinary telemetry session due to performance reasons. To be certain that we get values, we query the current database contents using the same queries as telemetry uses.
1. Contrary to what the [documentation](https://firefox-source-docs.mozilla.org/toolkit/components/telemetry/telemetry/data/main-ping.html) states ("Flag and count histograms are always created and submitted, with their default value being respectively false and 0. Other histogram types (see Choosing a Histogram Type) are not created nor submitted if no data was added to them."), the search_counts histogram is empty until a search has been executed.
1. Scalars and most histograms are only submitted if data was added to them.
1. Config/preference-related attributes are generally only defined if they defer from the browser default preferences.
1. Regarding `system_gfx.monitors[1].screen_width`, we want to collect the screen width of the user's primary monitor. During collection, the primary monitor values are found at `environment.system.gfx.monitors[0].screenWidth` but the assumption is that this value ends up at `system_gfx.monitors[1].screen_width` in Re:dash after data processing. To be able to verify this assumption, the `system_gfx.monitors[1].screen_width_zero_indexed` is also submitted, corresponding to `environment.system.gfx.monitors[1].screenWidth` (Example of values when a Macbook is connected to an external display, which is set as the primary display: [Screenshot](https://www.dropbox.com/s/u3hs2uy3sald4yr/Screenshot%202017-11-03%2014.05.06.png?dl=0))

## Example sequence

These are the `payload` fields from the ping sent via pioneer utils.

```
// common fields

schemaName     esper-study-telemetry
schemaVersion  1
studyName      esper-pioneer-shield-study


2018-04-05T06:49:26.754Z
{
  "encryptedData": "eyJhbGciOiJSU0EtT0FFUCIsImVuYyI6IkEyNTZHQ00ifQ.B8hKxBw_Pxkbl-SsF3ktdioryEbnT_yv6Zfh476sj-L9UvflZ-YO0_OFvxEtzArnkK5KSCSOg-R7GEC_SYnl6PDmR0ywT-GT7lr6uY6Y_L5zzlGX4ezuVeQ2sb6hJOIW1HmcIcI92U00IimgcxzIe0qpDIWSOwWravQLB2v0I1w6bGr0S1BtzXol1AC-Qzsn3HRKe0S2-ryCWm4x78V3f8aapIY5Fe7ukcD3qg6g2F4YQbFSyd60EhSt-aMfUmKTpLQ4SoSlj17wXPUj5kQ_6xENlS9R36rnA8MOoGpI5GetAKMjxNGhWfchlMWtTZoYml80bSpBccN9R7EKOSdS4w.w_n9g-w0LU-4sMcc.YA0Qm1RAFAnYX1Y5exDNalo6Oe4mexAH3Yr0oVtComOfO03Utrrbv5VtVQuhqrY6k1rN9CX9Ysijda6eZ6v2RyfsA-cLyL1jD_fTVTcDLWgb8U9Ivb_jghP50M_mQCWl3lvmF5M-w-DPmIM061_NgnIyhFhUgivkrYnvFvHKRTPyU2SfO6SM7N8abcFoH59nRScsb3OnVcg8tDFpMqfMVRq-Sh_Mv8NG79iekQKLknzzROfffREivLX2c353D7oGYr1zrEDiSCm1hSlmk09-A7TQwe6eVQwnE4Qd69mv-C5_N28jBL86mBnrhUqgLVH4FqYAxc8rKFbgz7deX5uS6ohqmavuLsycu1HCdbAhJ1M72zjtvuWOOrzZNWF3-nvksIUS_-K8BMZkrqsmk-_YHyNccquvvj4fAbWc3mfJexugqrynWHauhNrg6YwOBdj-yPy4zUnTBdaKq-RqmH7bnBp9snLZethR_n67yQD4zsjinjhz-P3Fx0mRPFTIg7STUXgQbph1RNUMZmst_TZB9GlIAEyUSuJ52riKIJdEfOXYG7l9k6AOH3tUS5O2MjX7sbU0PEoZbSSOGBu50JoRUnW-Bes7SBIGx_s8yuuCT_8iDzekhfuS-IyOF9BXhDFPdojGvFTixDLmn_4OhxDLetuQZWzz9FNbHh0P-hYj2IOukMDK4LeiW23cPWplsjponyAmgVUhzQAMFMQ0ir64zD8ZlIdVKwprhDZMNW5JbmRWrf2W2_qpERI8QYk51pT9Tv68OmaJf5z-Q7rQUBf5L_pyrsM_q82EI3vy5w-lA5-kwVQ6SDvjwB16W9zbaDsA5cnX5yGqKGqQM-AuUxCuSZjceOE4YsVN54dQ0wrPFLzISyqNJQJz20Jbx-VlndViXDR6ytdQp3U3aBHBRQ_O64wbbHQ6QKT9lqJS12emboFvKFGQO3uiUrqze12O6jYNYiBZcqc265ipYOCtYl6FqiZfMd4WDWp8oVR8UIcLoKgFw-6IeIzpWK84n-dR2gxxEWjLTom8Ok_ybMs91CYTx7Tc0CF8jTQxGBMHN9ZT-Haq9lSEP-rwLdyTOUgg7TZkYNuodI-dj7gSAmF-aTNM3IrJBXgz0nxrJyByJufnyLUuzszKjbeLoVz1tIxHeJ0LKNiPUJdxvM0zcNgQfywlWZkUp_gNKWVVGt89qdN69q1NS8R6tcllLWvpjlMmrf4QQEA5pfMfDx1gqW237Ansq-9554My42P5NvyIof93rje-nI5vzgJX_qxP3uuev3Ot-YtSk2v-9A2lRgGGZ_EvwVmmC0zwBP3JyU7217NYbYaY7tFSZskMiUqg3wRqLkF2210UE4m6obHeoU-KRdp8ASipQziqNS0iYQ6vUUqd8zwEf-lcJtGUfDii9BN83_4dKRKpAOLuDpUcMDkiX5WK8R3Am7EfU--VDDehA1EHPGs9_Oyx4eZ8lf0u0vILtsLJe1UJfjvWQJ1CtQmPWy0wZYdUJIrZ8zy_VrqRwK9tAzx-9P0SgZp1-husEfv5_qlFlT-k.SNFLyOJPmKZPbLam7yCnIA",
  "encryptionKeyId": "pioneer-20170905",
  "pioneerId": "77761daa-318a-e745-abe9-62d7325872e9",
  "schemaName": "esper-study-telemetry",
  "schemaVersion": 1,
  "studyName": "esper-pioneer-shield-study"
}
```

For a sample of the encrypted data before encryption, see [schemas/esper-study-telemetry.1.sample.json](./schemas/esper-study-telemetry.1.sample.json).
