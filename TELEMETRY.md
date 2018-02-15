# Telemetry sent by this addon

## Usual Firefox Telemetry is unaffected.

- No change: `main` and other pings are UNAFFECTED by this addon.
- Respects telemetry preferences.  If user has disabled telemetry, no telemetry will be sent.

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


2017-11-23T10:58:03.028Z
{
  "encryptedData": "eyJhbGciOiJSU0EtT0FFUCIsImVuYyI6IkEyNTZHQ00ifQ.0SvAEm1Qb-YN5tAIoBMycggxuOmRt3TssWEX8JzqBBhNFJk7DoTDPsEneKf8aUF3N2GaY0171t6BJQHLgkHwxc_gQQ2Xo0cnTy8VwTxB1YKtIkJXvzKoEI9AXzbAfp6MYa3YgB1r71_So2yd77rMZCE8A9q8JO7_Txy5_3daWqajEntGY0W1iZMU3gK4RUUEKqam5QhWsJX8OyGPo-bffclBywtuVHiGfklV3JIR9AHdFwlF29PdVoscBnNGyvTdpeK1eYmEh3ROyU4eUQ2wo5m96VkIdbcDDVN0uMK8x7LA4Nj-t4kYhlTyXiQlDJAddhsBzax_WmawrKWtcFGTMA.JCoJqB9i8pj4Id6c.SIWA7Jjy7l0AB5Bf9CIZuLGo8aYvmDuF_2j4BUGid2yx72-aGIb_VF33AKwqgOIqKvpy3DOcMkQ8G6HMFjSj5I7i0pnpH0r7GN0ZT2wQX6SbnBB7ZNmbOf6V1c3kLPy2DIfSzc8bGa1DaGQkfTaeVBrTXnnisN_mVV5vdBh3ztGR8miEU6nHBlDGvqlC_sXgGsopA75Qi-yEsXeFKlqz5cCY2THQJNSMXXjgfNc2OUYA19Tj8AMEBSpz0XCnzPCDqSwaLZtB6XLDM3j6N21AuGjcFWGSsmbySBY_1g3Iw-NjTtxQ2Tdlox6IdNNdpih9T25FGyFoTLHAL_9JnIICGaCHp6JaXyXsw-J3Sb8caOQG14CApREswLcHeH0GJShsd9Vzdfu9wi5ueBy_fBvrtONN9oQgiSMM-AleMjObz_suNIiBA6_1ADMPrc8aD1J-P2Mwrp4McUSOWF3O7R3k0txfs9H_96o8cDauvL9FUFAxk3oY-jUvGShbuIg87NWcIxOZK9Oj1Xo3tSRoJiswCiWwpJ0T6zMss7w-AuKoKrqXyaqnE-7W4-yQGbhZvergrvPdcWHbbnt5jZxlNVPirW-OLC0lxK2KA2hbuhsrAQvfBENr21uZXgsxKwyNO8tGBmpw6OMtmZaZL-peoQUdxyCYvKILFwiRp9Wb5EN3bpMoebsXeKL7akDJi43wppcEqyy4X5blldwQxdzQdb1W-cFuhaetyCAJHyUlJoa_YKALfLBuA-gIJv5kHlms8XwkaHV8ji1cLmb_lfp5Mh3Gq4aP14qnv0lRjkvzOqXbpjFRKhBwdsPXUPwPS1TFkB71ncpspi21f_5in3Ky7r0itZmmZHuRHRO85fEPjYs-86XyhPDDw0Kj2Kx2mVR3z02lXjzVEuXaooGXlm5ajoBM47bItTvWSxRpKS6Z9YXObKNM5i7P_BsyhyOohrth1qCiW6YHWdo2UdXXqjIOhC_YgpJcpqLZ0DOyoLQEUEpn5lHT9bMal6azosFH9JIPvnkPO2IibficrOXXa3Q_TKuKFrije1sayVzFDfs1H-mtRiUgC1Ag8mhyqiJPIMaEKhePxJWg9dumkIDovHvgy9XsLDzetjckMIEoz4zH0g025CQklwwatHAMcwiCxttti9p4aWYgfD_BzAflIdcbKu1S2FAALVmewzQeUhnS9cXEGDy-S2Uqm7SBRG0nNe4DfbLiOIK3BLlYgMmZEiWve9Tdkn-aBlBbQ3BFHf9W6tpc6zb-YeVqV2y3HDjluRGoH1vtExAUZ2iFR7ftwayqK8b1O45lUo0L6ga_xrGiJdk8dNayHAZ41ugu6LjpRJetBw78nYVw36zUojPoJ1EetVf5MGG7fneSTWhEKHMT-AIGOX-s9VHcvacAocMyRFwJWxwDLPBBvAGSISXuBLJK1E0U2F7MK9Pl2JFuZfPc9q69E-k4CqZZzPh3lTajiPaanIhBjQjleauon_fzcl2mxyy8TxWZgws1tDvb0gtrmrnFfin1yQnyidpgFatCnp4xPEkKfns.iKZwjZFLb9f4euFDoKtIzw",
  "encryptionKeyId": "pioneer-20170905",
  "pioneerId": "e032d5dc-2fcc-f648-abda-5fea8597d155",
  "schemaName": "esper-study-telemetry",
  "schemaVersion": 1,
  "studyName": "esper-pioneer-shield-study"
}

```

For a sample of the encrypted data before encryption, see [schemas/esper-study-telemetry.1.sample.json](./schemas/esper-study-telemetry.1.sample.json).
