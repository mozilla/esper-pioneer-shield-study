/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(EXPORTED_SYMBOLS|Pioneer)" }]*/

const { utils: Cu } = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(
  this, "Config", "resource://esper-pioneer-shield-study/Config.jsm"
);
XPCOMUtils.defineLazyModuleGetter(
  this, "PioneerUtils", "resource://esper-pioneer-shield-study/PioneerUtils.jsm"
);

const Pioneer = {
  startup() {
    this.utils = new PioneerUtils(Config);
  },
};

this.EXPORTED_SYMBOLS = ["Pioneer"];
