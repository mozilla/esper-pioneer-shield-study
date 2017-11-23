"use strict";

/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(EXPORTED_SYMBOLS|StudyTelemetryCollector)" }]*/

const { utils: Cu } = Components;
Cu.import("resource://gre/modules/Console.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/Preferences.jsm");
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
const { TelemetryEnvironment } = Cu.import("resource://gre/modules/TelemetryEnvironment.jsm", null);

XPCOMUtils.defineLazyModuleGetter(this, "PlacesUtils",
  "resource://gre/modules/PlacesUtils.jsm");
XPCOMUtils.defineLazyServiceGetter(this, "Telemetry",
  "@mozilla.org/base/telemetry;1", "nsITelemetry");

/**
 * Note: Setting studyUtils in this constructor due to above comments
 */
class StudyTelemetryCollector {

  constructor(pioneerUtils) {
    this.pioneerUtils = pioneerUtils;
  }

  async start() {

    console.log('ESPER Study init. Will now await full telemetry initialization before collecting the payload for this study.');

    // Ensure that we collect telemetry payloads only after it is fully initialized
    // See http://searchfox.org/mozilla-central/rev/423b2522c48e1d654e30ffc337164d677f934ec3/toolkit/components/telemetry/TelemetryController.jsm#295
    await TelemetryController.promiseInitialized();

    try {

      this.collectAndSendTelemetry();

    } catch (ex) {
      // TODO: how are errors during study execution reported?
      // this.pioneerUtils.telemetryError();
      Components.utils.reportError(ex);
    }

  }

  async telemetry(schemaName, schemaVersion, payload) {
    if (await this.allowedToSendTelemetry()) {
      await this.pioneerUtils.submitEncryptedPing(schemaName, schemaVersion, payload);
      console.log('ESPER Telemetry sent (encrypted)', JSON.stringify(payload));
    } else {
      console.log('ESPER Telemetry not sent due to privacy preferences', JSON.stringify(payload));
    }
  }

  async allowedToSendTelemetry() {

    // Main Telemetry preference that determines whether Telemetry data is collected and uploaded.
    const basicTelemetryEnabled = Preferences.get("datareporting.healthreport.uploadEnabled");

    console.log('allowedToSendTelemetry: basicTelemetryEnabled', basicTelemetryEnabled);

    // This preference determines the build. True means pre-release version of Firefox, false means release version of Firefox.
    const extendedTelemetryEnabled = Preferences.get("toolkit.telemetry.enabled");

    console.log('allowedToSendTelemetry: extendedTelemetryEnabled', extendedTelemetryEnabled);

    // Allow pioneer studies
    const isEligible = await this.pioneerUtils.isUserOptedIn();

    console.log('allowedToSendTelemetry: isEligible', isEligible);

    // do not run study if basic telemetry is disabled
    if (basicTelemetryEnabled === false) {
      return false;
    }

    // do not care if extended telemetry is disabled or enabled
    /*
    if (extendedTelemetryEnabled === false) {
      return false;
    }
    */

    // do not run study if shield studies are disabled
    if (isEligible === false) {
      return false;
    }

    return true;

  }

  async collectAndSendTelemetry() {

    const telemetryEnvironmentBasedAttributes = StudyTelemetryCollector.collectTelemetryEnvironmentBasedAttributes();
    const telemetrySubsessionPayloadBasedAttributes = StudyTelemetryCollector.collectTelemetrySubsessionPayloadBasedAttributes();
    const telemetryScalarBasedAttributes = StudyTelemetryCollector.collectTelemetryScalarBasedAttributes();

    console.log("telemetryEnvironmentBasedAttributes", telemetryEnvironmentBasedAttributes);
    console.log("telemetrySubsessionPayloadBasedAttributes", telemetrySubsessionPayloadBasedAttributes);
    console.log("telemetryScalarBasedAttributes", telemetryScalarBasedAttributes);

    StudyTelemetryCollector.collectPlacesDbBasedAttributes().then((placesDbBasedAttributes) => {

      console.log("placesDbBasedAttributes", placesDbBasedAttributes);

      const shieldPingAttributes = {
        ...telemetryEnvironmentBasedAttributes,
        ...telemetrySubsessionPayloadBasedAttributes,
        ...telemetryScalarBasedAttributes,
        ...placesDbBasedAttributes,
      };

      const shieldPingPayload = StudyTelemetryCollector.createShieldPingPayload(shieldPingAttributes);

      // Add additional add-on metadata to the payload since pioneer-utils doesn't seem to do include the same metadata as shield-utils
      shieldPingPayload.pioneerAddonMetadata = this.pioneerUtils.pioneerAddonMetadata;

      console.log("shieldPingPayload", shieldPingPayload);

      this.telemetry("esper-study-telemetry", 1, shieldPingPayload);

    });

  }

  // TODO: @glind: move to shield study utils / pioneer utils?
  static createShieldPingPayload(shieldPingAttributes) {

    const shieldPingPayload = {};

    // shield ping attributes must be strings
    for (const attribute in shieldPingAttributes) {
      let attributeValue = shieldPingAttributes[attribute];
      if (typeof attributeValue === "undefined") {
        attributeValue = "null";
      }
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
  static collectTelemetryEnvironmentBasedAttributes() {

    const environment = TelemetryEnvironment.currentEnvironment;
    console.log("TelemetryEnvironment.currentEnvironment", environment);

    return {
      "defaultSearchEngine": environment.settings.defaultSearchEngine,
      "locale": environment.settings.locale,
      "os": environment.system.os.name,
      "normalizedChannel": environment.settings.update.channel,
      "profileCreationDate": environment.profile.creationDate,
      "appVersion": environment.build.version,
      "systemMemoryMb": environment.system.memoryMB,
      "systemCpuCores": environment.system.cpu.cores,
      "systemCpuSpeedMhz": environment.system.cpu.speedMHz,
      "osVersion": environment.system.os.version,
      "systemGfxMonitors1ScreenWidth": environment.system.gfx.monitors[0] ? environment.system.gfx.monitors[0].screenWidth : undefined,
      "systemGfxMonitors1ScreenWidthZeroIndexed": environment.system.gfx.monitors[1] ? environment.system.gfx.monitors[1].screenWidth : undefined,
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
    attributes.totalTime = payload.simpleMeasurements.totalTime;
    attributes.profileSubsessionCounter = payload.info.profileSubsessionCounter;
    attributes.subsessionStartDate = payload.info.subsessionStartDate;
    attributes.timezoneOffest = payload.info.timezoneOffset;

    // firefox/browser/modules/BrowserUsageTelemetry.jsm
    attributes.searchCounts = payload.keyedHistograms.SEARCH_COUNTS;

    return attributes;

  }

  static collectTelemetryScalarBasedAttributes() {

    const attributes = {};

    // firefox/browser/modules/test/browser/head.js

    function getParentProcessScalars(aChannel, aKeyed = false, aClear = false) {
      const scalars = aKeyed ?
        Services.telemetry.snapshotKeyedScalars(aChannel, aClear).parent :
        Services.telemetry.snapshotScalars(aChannel, aClear).parent;
      return scalars || {};
    }

    // firefox/browser/modules/test/browser/browser_UsageTelemetry.js

    const MAX_CONCURRENT_TABS = "browser.engagement.max_concurrent_tab_count";
    const TAB_EVENT_COUNT = "browser.engagement.tab_open_event_count";
    const MAX_CONCURRENT_WINDOWS = "browser.engagement.max_concurrent_window_count";
    const WINDOW_OPEN_COUNT = "browser.engagement.window_open_event_count";
    const TOTAL_URI_COUNT = "browser.engagement.total_uri_count";
    const UNIQUE_DOMAINS_COUNT = "browser.engagement.unique_domains_count";
    const UNFILTERED_URI_COUNT = "browser.engagement.unfiltered_uri_count";

    const scalars = getParentProcessScalars(Telemetry.DATASET_RELEASE_CHANNEL_OPTIN);

    function getScalar(scalars, scalarName) {
      if (!(scalarName in scalars)) {
        console.log(`Scalar ${scalarName} is not set`);
        return;
      }
      return scalars[scalarName];
    }

    console.log('scalars', scalars);

    attributes.spbeMaxConcurrentWindowCount = getScalar(scalars, MAX_CONCURRENT_WINDOWS);
    attributes.spbeMaxConcurrentTabCount = getScalar(scalars, MAX_CONCURRENT_TABS);
    attributes.spbeTabOpenEventCount = getScalar(scalars, TAB_EVENT_COUNT);
    attributes.spbeWindowOpenEventCount = getScalar(scalars, WINDOW_OPEN_COUNT);
    attributes.spbeUniqueDomainsCount = getScalar(scalars, UNIQUE_DOMAINS_COUNT);
    attributes.spbeTotalUriCount = getScalar(scalars, TOTAL_URI_COUNT);
    attributes.spbeUnfilteredUriCount = getScalar(scalars, UNFILTERED_URI_COUNT);

    function getKeyedScalar(scalars, scalarName, key) {
      if (!(scalarName in scalars)) {
        console.log(`Keyed scalar ${scalarName} is not set`);
        return;
      }
      if (!(key in scalars[scalarName])) {
        console.log(`Keyed scalar ${scalarName} has not key ${key}`);
        return;
      }
      return scalars[scalarName][key];
    }

    const keyedScalars = getParentProcessScalars(Telemetry.DATASET_RELEASE_CHANNEL_OPTIN, true, false);

    console.log('keyedScalars', keyedScalars);

    // firefox/browser/modules/test/browser/browser_UsageTelemetry_searchbar.js

    const SCALAR_SEARCHBAR = "browser.engagement.navigation.searchbar";

    attributes.spbeNavigationSearchbar = getKeyedScalar(keyedScalars, SCALAR_SEARCHBAR, "search_enter");

    // firefox/browser/modules/test/browser/browser_UsageTelemetry_content.js

    const BASE_PROBE_NAME = "browser.engagement.navigation.";
    const SCALAR_CONTEXT_MENU = BASE_PROBE_NAME + "contextmenu";
    const SCALAR_ABOUT_NEWTAB = BASE_PROBE_NAME + "about_newtab";

    attributes.spbeNavigationAboutNewtab = getKeyedScalar(keyedScalars, SCALAR_ABOUT_NEWTAB, "search_enter");
    attributes.spbeNavigationContextmenu = getKeyedScalar(keyedScalars, SCALAR_CONTEXT_MENU, "search");

    // firefox/browser/modules/test/browser/browser_UsageTelemetry_urlbar.js

    const SCALAR_URLBAR = "browser.engagement.navigation.urlbar";

    attributes.spbeNavigationUrlbar = getKeyedScalar(keyedScalars, SCALAR_URLBAR, "search_enter");

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
          placesPagesCount: placesDbTelemetryResults[0][1],
          placesBookmarksCount: placesDbTelemetryResults[1][1],
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
