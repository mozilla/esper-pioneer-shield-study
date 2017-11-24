"use strict";

/* global  __SCRIPT_URI_SPEC__  */
/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(startup|shutdown|install|uninstall)" }]*/

const { utils: Cu } = Components;
Cu.import("resource://gre/modules/Console.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(
  this, "Config", "resource://esper-pioneer-shield-study/Config.jsm"
);
XPCOMUtils.defineLazyModuleGetter(
  this, "StudyTelemetryCollector", "resource://esper-pioneer-shield-study/lib/StudyTelemetryCollector.jsm"
);
XPCOMUtils.defineLazyModuleGetter(
  this, "Pioneer", "resource://esper-pioneer-shield-study/lib/Pioneer.jsm"
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
  install() {
  },

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
      console.log('Not eligable for Pioneer study. Will uninstall the study add-on.');
      Pioneer.utils.endStudy(events.INELIGIBLE);
      return;
    }

    // Fire this once per released version (only during INSTALL or UPGRADE), then we are done.
    if (reason === REASONS.ADDON_INSTALL || reason === REASONS.ADDON_UPGRADE) {
      new StudyTelemetryCollector(Pioneer.utils).start();
    }
  },

  // Unload all resources used by the add-on (even those not loaded in bootstrap.js)
  shutdown() {
    Cu.unload("resource://esper-pioneer-shield-study/Config.jsm");
    Cu.unload("resource://esper-pioneer-shield-study/lib/Pioneer.jsm");
    Cu.unload("resource://esper-pioneer-shield-study/lib/StudyTelemetryCollector.jsm");
    Cu.unload("resource://esper-pioneer-shield-study/lib/Helpers.jsm");
  },

  uninstall() {
  },
};

// Expose bootstrap methods on the global
for (const methodName of ["install", "startup", "shutdown", "uninstall"]) {
  this[methodName] = Bootstrap[methodName].bind(Bootstrap);
}

/** CONSTANTS and other bootstrap.js utilities */

// logging
// function createLog(name, levelWord) {
//  Cu.import("resource://gre/modules/Log.jsm");
//  var L = Log.repository.getLogger(name);
//  L.addAppender(new Log.ConsoleAppender(new Log.BasicFormatter()));
//  L.level = Log.Level[levelWord] || Log.Level.Debug; // should be a config / pref
//  return L;
// }
