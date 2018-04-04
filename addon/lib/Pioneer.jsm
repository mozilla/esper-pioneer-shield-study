/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(EXPORTED_SYMBOLS|Pioneer)" }]*/

const { utils: Cu } = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(
  this,
  "Config",
  "chrome://esper-pioneer-shield-study/content/Config.jsm",
);
XPCOMUtils.defineLazyModuleGetter(
  this,
  "PioneerUtils",
  "chrome://esper-pioneer-shield-study/content/PioneerUtils.jsm",
);

const Pioneer = {
  async startup(addonData) {
    Config.addonId = addonData.id;
    this.utils = new PioneerUtils(Config);
    const branch = await Pioneer.utils.chooseBranch();
    this.metadata = {
      packetVersion: "esper1",
      studyName: Config.studyName,
      branch: branch.name,
      addonId: addonData.id,
      addonVersion: addonData.version,
      pioneerUtilsVersion: "1.0.10",
      type: "pioneer-study-addon",
      testing: !Config.telemetry.removeTestingFlag,
    };
  },
};

this.EXPORTED_SYMBOLS = ["Pioneer"];
