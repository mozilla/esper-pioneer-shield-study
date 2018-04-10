"use strict";

const { utils: Cu } = Components;
Cu.import("resource://gre/modules/Console.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(
  this,
  "Config",
  "chrome://esper-pioneer-shield-study/content/Config.jsm",
);
XPCOMUtils.defineLazyModuleGetter(
  this,
  "StudyTelemetryCollector",
  "chrome://esper-pioneer-shield-study/content/lib/StudyTelemetryCollector.jsm",
);
XPCOMUtils.defineLazyModuleGetter(
  this,
  "Pioneer",
  "chrome://esper-pioneer-shield-study/content/lib/Pioneer.jsm",
);

const REASONS = {
  APP_STARTUP: 1, // The application is starting up.
  APP_SHUTDOWN: 2, // The application is shutting down.
  ADDON_ENABLE: 3, // The add-on is being enabled.
  ADDON_DISABLE: 4, // The add-on is being disabled. (Also sent during uninstallation)
  ADDON_INSTALL: 5, // The add-on is being installed.
  ADDON_UNINSTALL: 6, // The add-on is being uninstalled.
  ADDON_UPGRADE: 7, // The add-on is being upgraded.
  ADDON_DOWNGRADE: 8, // The add-on is being downgraded.
};

// var log = createLog(studyConfig.study.studyName, config.log.bootstrap.level);  // defined below.
// log("LOG started!");

this.Bootstrap = {
  install() {},

  /**
   * @param addonData Array [ "id", "version", "installPath", "resourceURI", "instanceID", "webExtension" ]
   * @param reason
   * @returns {Promise.<void>}
   */
  async startup(addonData, reason) {
    // Check if the user is opted in to pioneer and if not end the study
    await Pioneer.startup(addonData);
    const events = Pioneer.utils.getAvailableEvents();

    const isEligible = await Pioneer.utils.isUserOptedIn();
    if (!isEligible) {
      // eslint-disable-next-line no-console
      console.log(
        "Not eligable for Pioneer study. Will uninstall the study add-on.",
      );
      Pioneer.utils.endStudy(events.INELIGIBLE);
      return;
    }

    // Fire this once per released version (only during INSTALL or UPGRADE), then we are done.
    if (reason === REASONS.ADDON_INSTALL || reason === REASONS.ADDON_UPGRADE) {
      new StudyTelemetryCollector().start();
    }
  },

  // Unload all resources used by the add-on (even those not loaded in bootstrap.js)
  shutdown() {
    Cu.unload("chrome://esper-pioneer-shield-study/content/Config.jsm");
    Cu.unload("chrome://esper-pioneer-shield-study/content/lib/Pioneer.jsm");
    Cu.unload(
      "chrome://esper-pioneer-shield-study/content/lib/StudyTelemetryCollector.jsm",
    );
    Cu.unload("chrome://esper-pioneer-shield-study/content/lib/Helpers.jsm");
  },

  uninstall() {},
};

// Expose bootstrap methods on the global
for (const methodName of ["install", "startup", "shutdown", "uninstall"]) {
  this[methodName] = Bootstrap[methodName].bind(Bootstrap);
}
