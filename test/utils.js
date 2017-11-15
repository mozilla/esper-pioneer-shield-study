/* eslint-env node */
// The geckodriver package downloads and installs geckodriver for us.
// We use it by requiring it.
require("geckodriver");
const cmd = require("selenium-webdriver/lib/command");
const firefox = require("selenium-webdriver/firefox");
const Fs = require("fs-extra");
const FxRunnerUtils = require("fx-runner/lib/utils");
const path = require("path");
const webdriver = require("selenium-webdriver");

const By = webdriver.By;
const Context = firefox.Context;
const until = webdriver.until;

// Note: Geckodriver already has quite a good set of default preferences
// for disabling various items.
// https://github.com/mozilla/geckodriver/blob/master/src/marionette.rs
const FIREFOX_PREFERENCES = {
  // Ensure e10s is turned on.
  "browser.tabs.remote.autostart": true,
  "browser.tabs.remote.autostart.1": true,
  "browser.tabs.remote.autostart.2": true,

  // Improve debugging using `browser toolbox`.
  "devtools.chrome.enabled": true,
  "devtools.debugger.remote-enabled": true,
  "devtools.debugger.prompt-connection": false,

  // Removing warning for `about:config`
  "general.warnOnAboutConfig": false,

  // NECESSARY for all 57+ builds
  "extensions.legacy.enabled": true,

  // Enabled basic telemetry + shield studies by default when running tests
  "datareporting.healthreport.uploadEnabled": true,
  "app.shield.optoutstudies.enabled": true,

  // Set telemetry to initiate earlier than 60 seconds
  // TODO: figure out why setting this preference leads to profile_creation_date and default_search_engine not being set
  //"toolkit.telemetry.initDelay": 1,

  /** WARNING: gecko webdriver sets many additional prefs at:
    * https://dxr.mozilla.org/mozilla-central/source/testing/geckodriver/src/prefs.rs
    *
    * In, particular, this DISABLES actual telemetry uploading
    * ("toolkit.telemetry.server", Pref::new("https://%(server)s/dummy/telemetry/")),
    *
    */
};

// useful if we need to test on a specific version of Firefox
async function promiseActualBinary(binary) {
  try {
    const normalizedBinary = await FxRunnerUtils.normalizeBinary(binary);
    await Fs.stat(normalizedBinary);
    return normalizedBinary;
  } catch (ex) {
    if (ex.code === "ENOENT") {
      throw new Error(`Could not find ${binary}`);
    }
    throw ex;
  }
}




module.exports.promiseSetupDriver = async() => {
  const profile = new firefox.Profile();

  // TODO, allow 'actually send telemetry' here.
  Object.keys(FIREFOX_PREFERENCES).forEach((key) => {
    profile.setPreference(key, FIREFOX_PREFERENCES[key]);
  });

  // TODO glind, allow config to re-use profile
  const options = new firefox.Options();
  options.setProfile(profile);

  const builder = new webdriver.Builder()
    .forBrowser("firefox")
    .setFirefoxOptions(options);

  const binaryLocation = await promiseActualBinary(process.env.FIREFOX_BINARY || "nightly");
  //console.log(binaryLocation);
  await options.setBinary(new firefox.Binary(binaryLocation));
  const driver = await builder.build();
  // Firefox will be started up by now
  driver.setContext(Context.CHROME);

  return driver;
};

module.exports.disableBasicTelemetry = async(driver) => {
  return await module.exports.setPreference(driver, "datareporting.healthreport.uploadEnabled", false);
};

module.exports.disableShieldStudiesTelemetry = async(driver) => {
  return await module.exports.setPreference(driver, "app.shield.optoutstudies.enabled", false);
};

module.exports.setPreference = async(driver, prefName, prefValue) => {
  return await driver.executeAsyncScript((prefName, prefValue, callback) => {
    Components.utils.import("resource://gre/modules/Preferences.jsm");
    Preferences.set(prefName, prefValue);
    callback();
  }, prefName, prefValue);
};

module.exports.getPreference = async(driver, prefName, defaultValue) => {
  return await driver.executeAsyncScript((prefName, defaultValue, callback) => {
    Components.utils.import("resource://gre/modules/Preferences.jsm");
    const value = Preferences.get(prefName, defaultValue);
    callback(value);
  }, prefName, defaultValue);
};

module.exports.installAddon = async(driver, fileLocation) => {
  // references:
  //    https://bugzilla.mozilla.org/show_bug.cgi?id=1298025
  //    https://github.com/mozilla/geckodriver/releases/tag/v0.17.0
  fileLocation = fileLocation || path.join(process.cwd(), process.env.XPI);

  const executor = driver.getExecutor();
  executor.defineCommand("installAddon", "POST", "/session/:sessionId/moz/addon/install");
  const installCmd = new cmd.Command("installAddon");

  const session = await driver.getSession();
  installCmd.setParameters({ sessionId: session.getId(), path: fileLocation, temporary: true });
  return executor.execute(installCmd);
};

module.exports.uninstallAddon = async(driver, id) => {
  const executor = driver.getExecutor();
  executor.defineCommand("uninstallAddon", "POST", "/session/:sessionId/moz/addon/uninstall");
  const uninstallCmd = new cmd.Command("uninstallAddon");

  const session = await driver.getSession();
  uninstallCmd.setParameters({ sessionId: session.getId(), id });
  await executor.execute(uninstallCmd);
};

// Returns array of pings of type `type` in sorted order by timestamp
// first element is most recent ping
// as seen in shield-study-addon-util's `utils.jsm`
module.exports.getTelemetryPings = async(driver, options) => {
  // callback is how you get the return back from the script
  return driver.executeAsyncScript(async(options, callback) => {
    let {type, n, timestamp, headersOnly} = options;
    Components.utils.import("resource://gre/modules/TelemetryArchive.jsm");
    // {type, id, timestampCreated}
    let pings = await TelemetryArchive.promiseArchivedPingList();
    if (type) {
      if (!(type instanceof Array)) {
        type = [type];  // Array-ify if it's a string
      }
    }
    if (type) pings = pings.filter(p => type.includes(p.type));

    if (timestamp) pings = pings.filter(p => p.timestampCreated > timestamp);

    pings.sort((a, b) => b.timestampCreated - a.timestampCreated);
    if (n) pings = pings.slice(0, n);
    const pingData = headersOnly ? pings : pings.map(ping => TelemetryArchive.promiseArchivedPingById(ping.id));

    callback(await Promise.all(pingData));
  }, options);
};

module.exports.searchTelemetry = (conditionArray, telemetryArray) => {
  const resultingPings = [];
  for (const condition of conditionArray) {
    const index = telemetryArray.findIndex(ping => condition(ping));
    if (index === -1) {
      throw new SearchError(condition);
    }
    resultingPings.push(telemetryArray[ index ]);
  }
  return resultingPings;
};

module.exports.printPings = async(pings) => {

  if (pings.length === 0) {
    console.log('No pings');
    return;
  }

  const p0 = pings[0].payload;
  // print common fields
  console.log(
    `
// common fields

branch        ${p0.branch}
study_name    ${p0.study_name}
addon_version ${p0.addon_version}
version       ${p0.version}

    `
  )

  pings.forEach(p => {
    console.log(p.creationDate, p.payload.type);
    console.log(JSON.stringify(p.payload.data, null, 2))
  })

};

module.exports.writePingsJson = async(pings, filepath = "./pings.json") => {
  try {
    return await Fs.outputFile(filepath,
      JSON.stringify(pings, null, '\t'));
  } catch (error) {
    throw error;
  }
};

module.exports.takeScreenshot = async(driver, filepath = "./screenshot.png") => {
  try {
    const data = await driver.takeScreenshot();
    return await Fs.outputFile(filepath,
      data, "base64");
  } catch (screenshotError) {
    throw screenshotError;
  }
};

module.exports.gotoURL = async(driver, url) => {
  // navigate to a regular page
  driver.setContext(Context.CONTENT);
  await driver.get(url);
  driver.setContext(Context.CHROME);
};

class SearchError extends Error {
  constructor(condition) {
    const message = `Could not find ping satisfying condition: ${condition.toString()}`;
    super(message);
    this.message = message;
    this.name = "SearchError";
  }
}
