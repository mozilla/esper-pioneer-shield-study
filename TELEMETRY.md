# Telemetry sent by this addon

## Usual Firefox Telemetry is unaffected.

- No change: `main` and other pings are UNAFFECTED by this addon.
- Respects telemetry preferences.  If user has disabled telemetry, no telemetry will be sent.

## `shield-study` pings (common to all shield-studies)

`shield-studies-addon-utils` sends the usual packets.

The STUDY SPECIFIC ENDINGS this study supports are:

- "voted",
- "notification-x"
- "window-or-fx-closed"

## `shield-study-addon` pings, specific to THIS study.

No user interaction is instrumented in this study. 

Appendix (telemetry fields to be collected):

Meta
geo_country, geo_city, normalized_channel, app_version

Profile
profile_creation_date, profile_subsession_counter, subsession_start_date, timezone_offset

System
os, os_version, system.memory_mb, system_cpu.cores, system_cpu.speed_mhz, system_gfx.monitors[1].screen_width
    
Simple Measures
uptime, total_time, default_search_engine, locale

Histograms
places_bookmarks_count, places_pages_count, search_counts

Scalars
scalar_parent_browser_engagement_max_concurrent_tab_count, 
scalar_parent_browser_engagement_max_concurrent_window_count, 
scalar_parent_browser_engagement_navigation_about_newtab, 
scalar_parent_browser_engagement_navigation_contextmenu, 
scalar_parent_browser_engagement_navigation_searchbar, 
scalar_parent_browser_engagement_navigation_urlbar,
scalar_parent_browser_engagement_tab_open_event_count,
scalar_parent_browser_engagement_total_uri_count, 
scalar_parent_browser_engagement_unfiltered_uri_count,
scalar_parent_browser_engagement_unique_domains_count,
scalar_parent_browser_engagement_window_open_event_count

## Example sequence for a 'voted => not sure' interaction

These are the `payload` fields from all pings in the `shield-study` and `shield-study-addon` buckets.

```

// common fields

branch        esper-pioneer        // should describe Question text
study_name    esper-pioneer-shield-study
addon_version 1.0.0
version       3

2017-10-09T14:16:18.042Z shield-study
{
  "study_state": "enter"
}
2017-10-09T14:16:18.055Z shield-study
{
  "study_state": "installed"
}
2017-10-09T14:16:18.066Z shield-study-addon
{
  "attributes": {
    "event": "probed",
    "telemetry": {
      "foo": "bar"
    }
  }
}
2017-10-09T16:29:44.188Z shield-study
{
  "study_state": "ended-neutral",
  "study_state_fullname": "voted"
}
2017-10-09T16:29:44.191Z shield-study
{
  "study_state": "exit"
}
```
