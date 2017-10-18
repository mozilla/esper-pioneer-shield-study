"use strict";

/* global studyUtils */
/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(EXPORTED_SYMBOLS|StudyTelemetryCollector)" }]*/

const { utils: Cu } = Components;
Cu.import("resource://gre/modules/Console.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

const EXPORTED_SYMBOLS = this.EXPORTED_SYMBOLS = ["StudyTelemetryCollector"];

XPCOMUtils.defineLazyModuleGetter(this, "RecentWindow",
  "resource:///modules/RecentWindow.jsm");

/*
Note: All combinations of below ended up with Component returned failure code: 0x8000ffff (NS_ERROR_UNEXPECTED) [nsIXPCComponents_Utils.import]
when trying to access the studyUtils object

const BASERESOURCE = "esper-pioneer-shield-study";
// const STUDYUTILSPATH = `resource://${BASERESOURCE}/StudyUtils.jsm`;
// const STUDYUTILSPATH = `${__SCRIPT_URI_SPEC__}/../../${studyConfig.studyUtilsPath}`;
// const { studyUtils } = Cu.import(STUDYUTILSPATH, {});
// XPCOMUtils.defineLazyModuleGetter(this, "studyUtils", STUDYUTILSPATH);
*/

// window utilities
function getMostRecentBrowserWindow() {
  return RecentWindow.getMostRecentBrowserWindow({
    private: false,
    allowPopups: false,
  });
}

/**
 * Note: Setting studyUtils in this constructor due to above comments
 */
class StudyTelemetryCollector {
  constructor(studyUtils, variation) {
    this.variation = variation;
    this.studyUtils = studyUtils;
  }

  start() {
    const recentWindow = getMostRecentBrowserWindow();
    if (recentWindow && recentWindow.gBrowser) {
      this.studyUtils.telemetry({ event: "most-recent-window-accessed" });
    } else {
      // the 'else' here could kill the study, NOT IMPLEMENTED
      this.studyUtils.telemetry({ event: "most-recent-window-not-available" });
    }
  }
}
