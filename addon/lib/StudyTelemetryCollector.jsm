"use strict";

/* global studyUtils */
/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(EXPORTED_SYMBOLS|StudyTelemetryCollector)" }]*/

const { utils: Cu } = Components;
Cu.import("resource://gre/modules/Console.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/PromiseUtils.jsm");

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
const { TelemetryController } = Cu.import("resource://gre/modules/TelemetryController.jsm", null);
const { TelemetrySession } = Cu.import("resource://gre/modules/TelemetrySession.jsm", null);

XPCOMUtils.defineLazyModuleGetter(this, "PlacesUtils",
  "resource://gre/modules/PlacesUtils.jsm");

/**
 * Note: Setting studyUtils in this constructor due to above comments
 */
class StudyTelemetryCollector {

  constructor(studyUtils, variation) {
    this.variation = variation;
    this.studyUtils = studyUtils;
  }

  async start() {

    this.studyUtils.telemetry({ event: "esper-init" });

    // Ensure that we collect telemetry payloads only after it is fully initiated
    TelemetrySession.delayedInit().then(() => {

      // Wait for the gather-telemetry notification before we gather telemetry
      const gatherPromise = PromiseUtils.defer();
      Services.obs.addObserver(gatherPromise.resolve, "gather-telemetry");
      TelemetrySession.observe(null, "idle-daily", null);
      gatherPromise.promise.then(() => {

        console.log("Received gather-telemetry notification.");
        Services.obs.removeObserver(gatherPromise.resolve, "gather-telemetry");

        try {

          this.collectAndSendTelemetry();

        } catch (ex) {
          // TODO: how are errors during study execution reported?
          // this.studyUtils.telemetryError();
          Components.utils.reportError(ex);
        }


      });

    });

  }

  async collectAndSendTelemetry() {

    const telemetryPingEnvelopeBasedAttributes = StudyTelemetryCollector.collectTelemetryPingEnvelopeBasedAttributes();
    const telemetrySubsessionPayloadBasedAttributes = StudyTelemetryCollector.collectTelemetrySubsessionPayloadBasedAttributes();

    console.log("telemetryPingEnvelopeBasedAttributes", telemetryPingEnvelopeBasedAttributes);
    console.log("telemetrySubsessionPayloadBasedAttributes", telemetrySubsessionPayloadBasedAttributes);

    StudyTelemetryCollector.collectPlacesDbBasedAttributes().then((placesDbBasedAttributes) => {

      console.log("placesDbBasedAttributes", placesDbBasedAttributes);

      const shieldPingAttributes = {
        event: "telemetry-payload",
        ...telemetryPingEnvelopeBasedAttributes,
        ...telemetrySubsessionPayloadBasedAttributes,
        ...placesDbBasedAttributes,
      };

      const shieldPingPayload = StudyTelemetryCollector.createShieldPingPayload(shieldPingAttributes);

      console.log("shieldPingPayload", shieldPingPayload);

      this.studyUtils.telemetry(shieldPingPayload);

    });

  }

  // TODO: @glind: move to shield study utils?
  static createShieldPingPayload(shieldPingAttributes) {

    const shieldPingPayload = {};

    // shield ping attributes must be strings
    for (const attribute in shieldPingAttributes) {
      let attributeValue = shieldPingAttributes[attribute];
      if (typeof attributeValue === "object") {
        attributeValue = JSON.stringify(attributeValue);
      }
      if (typeof attributeValue !== "string") {
        attributeValue = String(attributeValue);
      }
      shieldPingPayload[attribute] = attributeValue;
    }

    return shieldPingPayload;

  }

  /**
   * These attributes are already sent as part of the telemetry ping envelope
   * @returns {{}}
   */
  static collectTelemetryPingEnvelopeBasedAttributes() {

    const telemetrySessionCurrentPingData = TelemetryController.getCurrentPingData();
    console.log("telemetrySessionCurrentPingData", telemetrySessionCurrentPingData);

    const environment = telemetrySessionCurrentPingData.environment;
    const application = telemetrySessionCurrentPingData.application;

    return {
      "default_search_engine": environment.settings.defaultSearchEngine,
      "locale": environment.settings.locale,
      "os": environment.system.os.name,
      "normalized_channel": application.channel,
      "profile_creation_date": environment.profile.creationDate,
      "app_version": application.version,
      "system.memory_mb": environment.system.memoryMB,
      "system_cpu.cores": environment.system.cpu.cores,
      "system_cpu.speed_mhz": environment.system.cpu.speedMHz,
      "os_version": environment.system.os.version,
      "system_gfx.monitors[1].screen_width": environment.system.gfx.monitors[0] ? environment.system.gfx.monitors[0].screenWidth : undefined,
      "system_gfx.monitors[1].screen_width_zero_indexed": environment.system.gfx.monitors[1] ? environment.system.gfx.monitors[1].screenWidth : undefined,
    };

  }

  /**
   * Scalars are only submitted if data was added to them, and are only reported with subsession pings.
   * Thus, we use the current telemetry subsession payload for these attributes
   * @returns {{}}
   */
  static collectTelemetrySubsessionPayloadBasedAttributes() {

    const telemetrySubsessionCurrentPingData = TelemetryController.getCurrentPingData(true);
    console.log("telemetrySubsessionCurrentPingData", telemetrySubsessionCurrentPingData);

    const payload = telemetrySubsessionCurrentPingData.payload;

    const attributes = {};

    attributes.uptime = payload.simpleMeasurements.uptime;
    attributes.total_time = payload.simpleMeasurements.totalTime;
    attributes.profile_subsession_counter = payload.info.profileSubsessionCounter;
    attributes.subsession_start_date = payload.info.subsessionStartDate;
    attributes.timezone_offset = payload.info.timezoneOffset;

    // firefox/toolkit/components/places/PlacesDBUtils.jsm
    // Collect the histogram payloads if present
    attributes.places_bookmarks_count_histogram = payload.processes.content.histograms.PLACES_BOOKMARKS_COUNT;
    attributes.places_pages_count_histogram = payload.processes.content.histograms.PLACES_PAGES_COUNT;

    // firefox/browser/modules/BrowserUsageTelemetry.jsm
    attributes.search_counts = payload.processes.content.histograms.SEARCH_COUNTS;
    attributes.scalar_parent_browser_engagement_max_concurrent_window_count = payload.processes.parent.scalars["browser.engagement.max_concurrent_window_count"];
    attributes.scalar_parent_browser_engagement_max_concurrent_tab_count = payload.processes.parent.scalars["browser.engagement.max_concurrent_tab_count"];
    attributes.scalar_parent_browser_engagement_tab_open_event_count = payload.processes.parent.scalars["browser.engagement.tab_open_event_count"];
    attributes.scalar_parent_browser_engagement_window_open_event_count = payload.processes.parent.scalars["browser.engagement.window_open_event_count"];
    attributes.scalar_parent_browser_engagement_unique_domains_count = payload.processes.parent.scalars["browser.engagement.unique_domains_count"];
    attributes.scalar_parent_browser_engagement_total_uri_count = payload.processes.parent.scalars["browser.engagement.total_uri_count"];
    attributes.scalar_parent_browser_engagement_unfiltered_uri_count = payload.processes.parent.scalars["browser.engagement.unfiltered_uri_count"];
    attributes.scalar_parent_browser_engagement_navigation_about_newtab = payload.processes.parent.scalars["browser.engagement.navigation_about_newtab"];
    attributes.scalar_parent_browser_engagement_navigation_contextmenu = payload.processes.parent.scalars["browser.engagement.navigation_contextmenu"];
    attributes.scalar_parent_browser_engagement_navigation_searchbar = payload.processes.parent.scalars["browser.engagement.navigation_searchbar"];
    attributes.scalar_parent_browser_engagement_navigation_urlbar = payload.processes.parent.scalars["browser.engagement.navigation_urlbar"];

    return attributes;

  }

  /**
   * Collects the places-db-related telemetry by querying the database directly rather relying on telemetry since, due to performance reasons,
   * regular telemetry only collects this telemetry occasionally.
   *
   * An earlier attempt to gather the places-db-related telemetry was to await PlacesDBUtils.telemetry() and then fetch the populated histograms
   * but PlacesDBUtils.telemetry() does not return a promise, it just updates the current telemetry session with additional histograms when db queries are ready
   * and I found no reliant way to ensure these histograms being available in the current telemetry session.
   *
   * @returns {Promise}
   */
  static async collectPlacesDbBasedAttributes() {

    return new Promise((resolve, reject) => {

      StudyTelemetryCollector.queryPlacesDbTelemetry().then((placesDbTelemetryResults) => {

        resolve({
          places_pages_count: placesDbTelemetryResults[0][1],
          places_bookmarks_count: placesDbTelemetryResults[1][1],
        });

      }).catch(ex => reject(ex));

    });

  }

  /**
   * Based on code in firefox/toolkit/components/places/PlacesDBUtils.jsm
   *
   * @returns {Promise.<A|Promise.<*[]>|Promise.<Array.<T>>>}
   */
  static async queryPlacesDbTelemetry() {

    const probes = [
      {
        histogram: "PLACES_PAGES_COUNT",
        query: "SELECT count(*) FROM moz_places",
      },

      {
        histogram: "PLACES_BOOKMARKS_COUNT",
        query: `SELECT count(*) FROM moz_bookmarks b
                    JOIN moz_bookmarks t ON t.id = b.parent
                    AND t.parent <> :tags_folder
                    WHERE b.type = :type_bookmark`,
      },

    ];

    const params = {
      tags_folder: PlacesUtils.tagsFolderId,
      type_folder: PlacesUtils.bookmarks.TYPE_FOLDER,
      type_bookmark: PlacesUtils.bookmarks.TYPE_BOOKMARK,
      places_root: PlacesUtils.placesRootId,
    };

    const promises = [];

    for (let i = 0; i < probes.length; i++) {
      const probe = probes[i];

      const promiseDone = new Promise((resolve, reject) => {
        const filteredParams = {};
        for (const p in params) {
          if (probe.query.includes(`:${p}`)) {
            filteredParams[p] = params[p];
          }
        }
        PlacesUtils.promiseDBConnection()
          .then(db => db.execute(probe.query, filteredParams))
          .then(rows => resolve([probe, rows[0].getResultByIndex(0)]))
          .catch(() => reject(new Error("Unable to get telemetry from database.")));
      });

      promises.push(promiseDone);

    }

    return Promise.all(promises);

  }

}
