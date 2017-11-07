# Telemetry sent by this addon

## Usual Firefox Telemetry is unaffected.

- No change: `main` and other pings are UNAFFECTED by this addon.
- Respects telemetry preferences.  If user has disabled telemetry, no telemetry will be sent.

## `shield-study` pings (common to all shield-studies)

`shield-studies-addon-utils` sends the usual packets.

This study has no surveys and as such has NO SPECIFIC ENDINGS.

## `shield-study-addon` pings, specific to THIS study.

No user interaction is instrumented in this study. Instead, the add-on performs a one-time collection of a large 
subset of telemetry fields for the cohort of users participating in the Firefox Pioneer project. The collection of 
normal telemetry variables for this cohort in conjunction with the extended data collection unique to Pioneer will 
allow both quantitative and qualitative comparison of the Pioneer cohort to the Firefox release population. 

At add-on installation, the add-on will send a "esper-init" event, wait for Telemetry to be fully initialized 
(which can take over a minute if Firefox was just started), and finally collect the relevant telemetry and send a ping with that payload.

### Attributes

Collected from the current telemetry environment:

```
default_search_engine
locale
os
normalized_channel
profile_creation_date
app_version
system.memory_mb
system_cpu.cores
system_cpu.speed_mhz
os_version
system_gfx.monitors[1].screen_width
system_gfx.monitors[1].screen_width_zero_indexed
``` 

Collected from the current telemetry subsession ping payload (since scalars are only reported with subsession pings): 

```
uptime
total_time
profile_subsession_counter
subsession_start_date
timezone_offset
places_bookmarks_count_histogram
places_pages_count_histogram
search_counts
scalar_parent_browser_engagement_window_open_event_count
scalar_parent_browser_engagement_total_uri_count
scalar_parent_browser_engagement_navigation_urlbar
scalar_parent_browser_engagement_navigation_contextmenu
scalar_parent_browser_engagement_tab_open_event_count
scalar_parent_browser_engagement_navigation_searchbar
scalar_parent_browser_engagement_navigation_about_newtab
scalar_parent_browser_engagement_unique_domains_count
scalar_parent_browser_engagement_max_concurrent_window_count
scalar_parent_browser_engagement_max_concurrent_tab_count
scalar_parent_browser_engagement_unfiltered_uri_count
``` 

Collected by querying the places sqlite database in the same way that ordinary telemetry would do, if it would do it predictably:

```
places_bookmarks_count
places_pages_count
``` 

Not collected by the add-on, but is added by server-side telemetry processing based on the user's IP:

```
geo_country
geo_city
```

When a certain probe is not set in the current telemetry environment, the string "null" is set instead. 

### Peculiarities

1. The places_bookmarks_count_histogram and places_pages_count_histogram attributes are only available occasionally in the telemetry session due to performance reasons. We collect both the histograms as present in the current telemetry session (using the attributes places_bookmarks_count_histogram and places_pages_count_histogram) as well as the actual values that telemetry occasionally would collect. The places_bookmarks_count and places_pages_count attributes will always include the values based on the current database contents.
1. Contrary to what the [documentation](https://firefox-source-docs.mozilla.org/toolkit/components/telemetry/telemetry/data/main-ping.html) states ("Flag and count histograms are always created and submitted, with their default value being respectively false and 0. Other histogram types (see Choosing a Histogram Type) are not created nor submitted if no data was added to them."), the search_counts histogram is empty until a search has been executed.
1. Scalars and most histograms are only submitted if data was added to them.
1. Config/preference-related attributes are generally only defined if they defer from the browser default preferences.
1. Regarding `system_gfx.monitors[1].screen_width`, we want to collect the screen widthof the user's primary monitor. During collection, the primary monitor values are found at `environment.system.gfx.monitors[0].screenWidth` but the assumption is that this value ends up at `system_gfx.monitors[1].screen_width` in Re:dash after data processing. To be able to verify this assumption, the `system_gfx.monitors[1].screen_width_zero_indexed` is also submitted, corresponding to `environment.system.gfx.monitors[1].screenWidth` (Example of values when a Macbook is connected to an external display, which is set as the primary display: [Screenshot](https://www.dropbox.com/s/u3hs2uy3sald4yr/Screenshot%202017-11-03%2014.05.06.png?dl=0))

## Example sequence

These are the `payload` fields from all pings in the `shield-study` and `shield-study-addon` buckets. (Reversed chronological order)

```

// common fields

branch        pioneer
study_name    esper-pioneer-shield-study
addon_version 0.2.0
version       3


2017-11-06T10:11:28.819Z shield-study-addon
{
  "attributes": {
    "app_version": "58.0a1",
    "default_search_engine": "google",
    "event": "telemetry-payload",
    "locale": "en-US",
    "normalized_channel": "nightly",
    "os": "Darwin",
    "os_version": "16.7.0",
    "places_bookmarks_count": "10",
    "places_bookmarks_count_histogram": "null",
    "places_pages_count": "10",
    "places_pages_count_histogram": "null",
    "profile_creation_date": "17476",
    "profile_subsession_counter": "1",
    "scalar_parent_browser_engagement_max_concurrent_tab_count": "1",
    "scalar_parent_browser_engagement_max_concurrent_window_count": "1",
    "scalar_parent_browser_engagement_navigation_about_newtab": "null",
    "scalar_parent_browser_engagement_navigation_contextmenu": "null",
    "scalar_parent_browser_engagement_navigation_searchbar": "null",
    "scalar_parent_browser_engagement_navigation_urlbar": "null",
    "scalar_parent_browser_engagement_tab_open_event_count": "null",
    "scalar_parent_browser_engagement_total_uri_count": "null",
    "scalar_parent_browser_engagement_unfiltered_uri_count": "1",
    "scalar_parent_browser_engagement_unique_domains_count": "null",
    "scalar_parent_browser_engagement_window_open_event_count": "null",
    "search_counts": "null",
    "subsession_start_date": "2017-11-06T12:00:00.0+02:00",
    "system.memory_mb": "16384",
    "system_cpu.cores": "4",
    "system_cpu.speed_mhz": "2500",
    "system_gfx.monitors[1].screen_width": "1680",
    "system_gfx.monitors[1].screen_width_zero_indexed": "null",
    "timezone_offset": "120",
    "total_time": "60",
    "uptime": "1"
  }
}
2017-11-06T10:10:30.947Z shield-study-addon
{
  "attributes": {
    "event": "esper-init"
  }
}
2017-11-06T10:10:30.946Z shield-study
{
  "study_state": "installed"
}
2017-11-06T10:10:30.942Z shield-study
{
  "study_state": "enter"
}

```

To trigger the search_counts data, you'll need to have performed at least one search using the firefox search bar and then reload the addon. 
The sent attribute may look like this:

```
"search_counts":"{\"ddg.searchbar\":{\"range\":[1,2],\"bucket_count\":3,\"histogram_type\":4,\"values\":{\"0\":1,\"1\":0},\"sum\":1}}"
```

# Retrieving data for analysis

Telemetry pings are loaded into S3 and re:dash. Published queries:

* [ESPER Pioneer Shield Study - All Telemetry Payloads](https://sql.telemetry.mozilla.org/queries/48557/source)
* [ESPER Pioneer Shield Study - Number of clients](https://sql.telemetry.mozilla.org/queries/48440/source)
