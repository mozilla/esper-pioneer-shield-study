"use strict";

/* global studyUtils */
/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(EXPORTED_SYMBOLS|StudyTelemetryCollector)" }]*/

const { utils: Cu } = Components;
Cu.import("resource://gre/modules/Console.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

const EXPORTED_SYMBOLS = this.EXPORTED_SYMBOLS = ["StudyTelemetryCollector"];

/*
Note: All combinations of below ended up with Component returned failure code: 0x8000ffff (NS_ERROR_UNEXPECTED) [nsIXPCComponents_Utils.import]
when trying to access the studyUtils object

const BASERESOURCE = "esper-pioneer-shield-study";
// const STUDYUTILSPATH = `resource://${BASERESOURCE}/StudyUtils.jsm`;
// const STUDYUTILSPATH = `${__SCRIPT_URI_SPEC__}/../../${studyConfig.studyUtilsPath}`;
// const { studyUtils } = Cu.import(STUDYUTILSPATH, {});
// XPCOMUtils.defineLazyModuleGetter(this, "studyUtils", STUDYUTILSPATH);
*/

// telemetry utils
const { TelemetrySession } = Cu.import("resource://gre/modules/TelemetrySession.jsm", null);

/**
 * Note: Setting studyUtils in this constructor due to above comments
 */
class StudyTelemetryCollector {

  constructor(studyUtils, variation) {
    this.variation = variation;
    this.studyUtils = studyUtils;
  }

  start() {

    this.studyUtils.telemetry({ event: "esper-init" });

    try {
      this.collectAndSendTelemetry();
    } catch (ex) {
      // TODO: how are errors during study execution reported?
      // this.studyUtils.telemetryError();
      Components.utils.reportError(ex);
    }

  }

  collectAndSendTelemetry() {

    const shieldPingPayload = {
      event: "telemetry-payload",
    };

    const shieldPingAttributes = this.collectShieldPingAttributes();

    // shield ping attributes must be strings
    for (const attribute in shieldPingAttributes) {
      let attributeValue = shieldPingAttributes[attribute];
      if (typeof attributeValue === 'object') {
        attributeValue = JSON.stringify(attributeValue);
      }
      if (typeof attributeValue !== 'string') {
        attributeValue = String(attributeValue);
      }
      shieldPingPayload[attribute] = attributeValue;
    }

    console.log("shieldPingPayload", shieldPingPayload);

    this.studyUtils.telemetry(shieldPingPayload);

  }

  collectShieldPingAttributes() {

    console.log("TelemetrySession", TelemetrySession);

    const REASON_GATHER_PAYLOAD = "gather-payload";
    const telemetrySessionPayload = TelemetrySession.getPayload(REASON_GATHER_PAYLOAD);

    console.log("telemetrySessionPayload", telemetrySessionPayload);

    const shieldPingAttributes = {
      completeTelemetrySessionPayload: telemetrySessionPayload,
    };

    shieldPingAttributes.uptime = telemetrySessionPayload.simpleMeasurements.uptime;
    shieldPingAttributes.total_time = telemetrySessionPayload.simpleMeasurements.totalTime;
    shieldPingAttributes.profile_subsession_counter = telemetrySessionPayload.info.profileSubsessionCounter;
    shieldPingAttributes.subsession_start_date = telemetrySessionPayload.info.subsessionStartDate;
    shieldPingAttributes.timezone_offset = telemetrySessionPayload.info.timezoneOffset;

    shieldPingAttributes.places_bookmarks_count = telemetrySessionPayload.processes.content.histograms.PLACES_BOOKMARKS_COUNT;
    shieldPingAttributes.places_pages_count = telemetrySessionPayload.processes.content.histograms.PLACES_PAGES_COUNT;
    shieldPingAttributes.search_counts = telemetrySessionPayload.processes.content.histograms.SEARCH_COUNT;

    shieldPingAttributes.scalar_parent_browser_engagement_window_open_event_count = telemetrySessionPayload.processes.parent.scalars["browser.engagement.window_open_event_count"];
    shieldPingAttributes.scalar_parent_browser_engagement_total_uri_count = telemetrySessionPayload.processes.parent.scalars["browser.engagement.total_uri_count"];
    shieldPingAttributes.scalar_parent_browser_engagement_navigation_urlbar = telemetrySessionPayload.processes.parent.scalars["browser.engagement.navigation_urlbar"];
    shieldPingAttributes.scalar_parent_browser_engagement_navigation_contextmenu = telemetrySessionPayload.processes.parent.scalars["browser.engagement.navigation_contextmenu"];
    shieldPingAttributes.scalar_parent_browser_engagement_tab_open_event_count = telemetrySessionPayload.processes.parent.scalars["browser.engagement.tab_open_event_count"];
    shieldPingAttributes.scalar_parent_browser_engagement_navigation_searchbar = telemetrySessionPayload.processes.parent.scalars["browser.engagement.navigation_searchbar"];
    shieldPingAttributes.scalar_parent_browser_engagement_navigation_about_newtab = telemetrySessionPayload.processes.parent.scalars["browser.engagement.navigation_about_newtab"];
    shieldPingAttributes.scalar_parent_browser_engagement_unique_domains_count = telemetrySessionPayload.processes.parent.scalars["browser.engagement.unique_domains_count"];
    shieldPingAttributes.scalar_parent_browser_engagement_max_concurrent_window_count = telemetrySessionPayload.processes.parent.scalars["browser.engagement.max_concurrent_window_count"];
    shieldPingAttributes.scalar_parent_browser_engagement_max_concurrent_tab_count = telemetrySessionPayload.processes.parent.scalars["browser.engagement.max_concurrent_tab_count"];
    shieldPingAttributes.scalar_parent_browser_engagement_unfiltered_uri_count = telemetrySessionPayload.processes.parent.scalars["browser.engagement.unfiltered_uri_count"];

    console.log("shieldPingAttributes", shieldPingAttributes);

    return shieldPingAttributes;

  }

}
