/* eslint-env node, mocha */

/* Purpose:
 *
 * Tests that are SPECIFIC TO THIS ADDON's FUNCTIONALITY
 */

// for unhandled promise rejection debugging
process.on("unhandledRejection", r => console.log(r)); // eslint-disable-line no-console

const assert = require("assert");
const utils = require("./utils");
const webdriver = require("selenium-webdriver");
const firefox = require("selenium-webdriver/firefox");

const By = webdriver.By;
const Context = firefox.Context;
const until = webdriver.until;

/* Part 1:  Test helpers */

async function postTestReset(driver) {
  // reset the counter pref to 0 so that the treatment is always shown
  // reset the addedBool pref
  await driver.executeAsyncScript((...args) => {
    const callback = args[args.length - 1];
    /*
    TODO: add tests that confirm that the study is only executed a predefined set number of times
    Components.utils.import("resource://gre/modules/Preferences.jsm");
    const COUNTER_PREF = "extensions.template-shield-study.counter";
    const ADDED_BOOL_PREF = "extensions.template-shield-study.addedBool";
    if (Preferences.has(COUNTER_PREF)) {
      Preferences.set(COUNTER_PREF, 0);
    }
    if (Preferences.has(ADDED_BOOL_PREF)) {
      Preferences.set(ADDED_BOOL_PREF, false);
    }
    */
    callback();
  });
}

const notNullAssertion = value => {
  return value !== "null" && typeof value !== "undefined"
};

const nullAssertion = value => {
  return value === "null"
};


/* Part 2:  The Tests */

describe("preferences behavior tests", function() {
  // This gives Firefox time to start, and us a bit longer during some of the tests.
  this.timeout(5000);

  let driver;
  let addonId;
  let pings;

  before(async() => {
    driver = await utils.promiseSetupDriver();
    await utils.disableBasicTelemetry(driver);
  });

  after(async() => driver.quit());

  afterEach(async() => postTestReset(driver));

  it("preferences get behavior should be as expected", async() => {

    const basicTelemetryEnabled = await utils.getPreference(driver, "datareporting.healthreport.uploadEnabled");
    console.log('basicTelemetryEnabled', basicTelemetryEnabled);
    assert(basicTelemetryEnabled === false);

    const extendedTelemetryEnabled = await utils.getPreference(driver, "toolkit.telemetry.enabled");
    console.log('extendedTelemetryEnabled', extendedTelemetryEnabled);
    assert(extendedTelemetryEnabled === true);

    const nonExistantPreference = await utils.getPreference(driver, "foo.bar");
    console.log('nonExistantPreference', nonExistantPreference);
    assert(nonExistantPreference === null);

    const basicTelemetryEnabledWithTrueAsDefault = await utils.getPreference(driver, "datareporting.healthreport.uploadEnabled", true);
    console.log('basicTelemetryEnabledWithTrueAsDefault', basicTelemetryEnabledWithTrueAsDefault);
    assert(basicTelemetryEnabledWithTrueAsDefault === false);

    const extendedTelemetryEnabledWithTrueAsDefault = await utils.getPreference(driver, "toolkit.telemetry.enabled", true);
    console.log('extendedTelemetryEnabledWithTrueAsDefault', extendedTelemetryEnabledWithTrueAsDefault);
    assert(extendedTelemetryEnabledWithTrueAsDefault === true);

    const nonExistantPreferenceWithTrueAsDefault = await utils.getPreference(driver, "foo.bar", true);
    console.log('nonExistantPreferenceWithTrueAsDefault', nonExistantPreferenceWithTrueAsDefault);
    assert(nonExistantPreferenceWithTrueAsDefault === true);

  });

});

describe("no esper-specific telemetry should be sent if basic telemetry is disabled in preferences", function() {
  // This gives Firefox time to start, and us a bit longer during some of the tests.
  this.timeout(15000);

  let driver;
  let addonId;
  let pings;

  before(async() => {
    driver = await utils.promiseSetupDriver();
    await utils.disableBasicTelemetry(driver);
    // install the addon
    addonId = await utils.installAddon(driver);
    // allow our shield study addon some time to send initial pings
    await driver.sleep(2000);
    // collect sent pings
    pings = await utils.getTelemetryPings(driver, ["shield-study", "shield-study-addon"]);
    // print sent pings
    console.log("Shield study telemetry pings: ");
    utils.printPings(pings);
  });

  after(async() => driver.quit());

  afterEach(async() => postTestReset(driver));

  it("should send shield telemetry pings", async() => {

    assert(pings.length > 0, "at least one shield telemetry ping");

  });

  it("at least one shield-study telemetry ping with study_state=installed", async() => {

    const foundPings = utils.searchTelemetry([
      ping => ping.type === "shield-study" && ping.payload.data.study_state === "installed",
    ], pings);
    assert(foundPings.length > 0, "at least one shield-study telemetry ping with study_state=installed");

  });

  it("at least one shield-study telemetry ping with study_state=enter", async() => {

    const foundPings = utils.searchTelemetry([
      ping => ping.type === "shield-study" && ping.payload.data.study_state === "enter",
    ], pings);
    assert(foundPings.length > 0, "at least one shield-study telemetry ping with study_state=enter");

  });

  it("no shield-study-addon telemetry ping for the esper-init event", async() => {

    const basicTelemetryEnabled = await utils.getPreference(driver, "datareporting.healthreport.uploadEnabled", false);
    console.log('basicTelemetryEnabled', basicTelemetryEnabled);

    const extendedTelemetryEnabled = await utils.getPreference(driver, "toolkit.telemetry.enabled", false);
    console.log('extendedTelemetryEnabled', extendedTelemetryEnabled);

    try {
      const foundPings = utils.searchTelemetry([
        ping => ping.type === "shield-study-addon" && ping.payload.data.attributes.event === "esper-init",
      ], pings);
    } catch (e) {
      assert(e.name === 'SearchError');
    }

  });

});

describe("no esper-specific telemetry should be sent if shield studies telemetry is disabled in preferences", function() {
  // This gives Firefox time to start, and us a bit longer during some of the tests.
  this.timeout(15000);

  let driver;
  let addonId;
  let pings;

  before(async() => {
    driver = await utils.promiseSetupDriver();
    await utils.disableShieldStudiesTelemetry(driver);
    // install the addon
    addonId = await utils.installAddon(driver);
    // allow our shield study addon some time to send initial pings
    await driver.sleep(2000);
    // collect sent pings
    pings = await utils.getTelemetryPings(driver, ["shield-study", "shield-study-addon"]);
    // print sent pings
    console.log("Shield study telemetry pings: ");
    utils.printPings(pings);
  });

  after(async() => driver.quit());

  afterEach(async() => postTestReset(driver));

  it("should send shield telemetry pings", async() => {

    assert(pings.length > 0, "at least one shield telemetry ping");

  });

  it("at least one shield-study telemetry ping with study_state=installed", async() => {

    const foundPings = utils.searchTelemetry([
      ping => ping.type === "shield-study" && ping.payload.data.study_state === "installed",
    ], pings);
    assert(foundPings.length > 0, "at least one shield-study telemetry ping with study_state=installed");

  });

  it("at least one shield-study telemetry ping with study_state=enter", async() => {

    const foundPings = utils.searchTelemetry([
      ping => ping.type === "shield-study" && ping.payload.data.study_state === "enter",
    ], pings);
    assert(foundPings.length > 0, "at least one shield-study telemetry ping with study_state=enter");

  });

  it("no shield-study-addon telemetry ping for the esper-init event", async() => {

    const basicTelemetryEnabled = await utils.getPreference(driver, "datareporting.healthreport.uploadEnabled", false);
    console.log('basicTelemetryEnabled', basicTelemetryEnabled);

    const extendedTelemetryEnabled = await utils.getPreference(driver, "toolkit.telemetry.enabled", false);
    console.log('extendedTelemetryEnabled', extendedTelemetryEnabled);

    try {
      const foundPings = utils.searchTelemetry([
        ping => ping.type === "shield-study-addon" && ping.payload.data.attributes.event === "esper-init",
      ], pings);
    } catch (e) {
      assert(e.name === 'SearchError');
    }

  });

});

describe("basic functional tests", function() {
  // This gives Firefox time to start, and us a bit longer during some of the tests.
  this.timeout(75000);

  let driver;
  let addonId;
  let pings;

  before(async() => {
    driver = await utils.promiseSetupDriver();
    // install the addon
    addonId = await utils.installAddon(driver);
    // allow our shield study addon some time to send initial pings
    await driver.sleep(2000);
    // wait for telemetry to be fully initialized
    await driver.sleep(60000);
    // collect sent pings
    pings = await utils.getTelemetryPings(driver, ["shield-study", "shield-study-addon"]);
    // print sent pings
    console.log("Shield study telemetry pings: ");
    utils.printPings(pings);
  });

  after(async() => driver.quit());

  afterEach(async() => postTestReset(driver));

  it("should send shield telemetry pings", async() => {

    assert(pings.length > 0, "at least one shield telemetry ping");

  });

  it("at least one shield-study telemetry ping with study_state=installed", async() => {

    const foundPings = utils.searchTelemetry([
      ping => ping.type === "shield-study" && ping.payload.data.study_state === "installed",
    ], pings);
    assert(foundPings.length > 0, "at least one shield-study telemetry ping with study_state=installed");

  });

  it("at least one shield-study telemetry ping with study_state=enter", async() => {

    const foundPings = utils.searchTelemetry([
      ping => ping.type === "shield-study" && ping.payload.data.study_state === "enter",
    ], pings);
    assert(foundPings.length > 0, "at least one shield-study telemetry ping with study_state=enter");

  });

  it("one shield-study-addon telemetry ping for the esper-init event", async() => {

    const foundPings = utils.searchTelemetry([
      ping => ping.type === "shield-study-addon" && ping.payload.data.attributes.event === "esper-init",
    ], pings);
    assert(foundPings.length === 1);

  });

  it("one proper shield-study-addon telemetry ping for the telemetry-payload event as expected at startup with a clean profile", async() => {

    const foundPings = utils.searchTelemetry([
      ping => ping.type === "shield-study-addon" && ping.payload.data.attributes.event === "telemetry-payload",
    ], pings);
    assert(foundPings.length === 1);

    const ping = foundPings[0];

    assert(ping.payload.shield_version === "4.1.0", "expected shield-study-utils version");

    // no unexpected data attributes

    const assertionsByAttribute = {
      "default_search_engine": notNullAssertion,
      "locale": notNullAssertion,
      "os": notNullAssertion,
      "normalized_channel": notNullAssertion,
      "profile_creation_date": notNullAssertion,
      "app_version": notNullAssertion,
      "system.memory_mb": notNullAssertion,
      "system_cpu.cores": notNullAssertion,
      "system_cpu.speed_mhz": notNullAssertion,
      "os_version": notNullAssertion,
      "system_gfx.monitors[1].screen_width": notNullAssertion,
      // "system_gfx.monitors[1].screen_width_zero_indexed": nullAssertion, // we make no assertion since we can't assume that the tester doesn't have an extra monitor connected
      "uptime": notNullAssertion,
      "total_time": notNullAssertion,
      "profile_subsession_counter": notNullAssertion,
      "subsession_start_date": notNullAssertion,
      "timezone_offset": notNullAssertion,
      "places_bookmarks_count": notNullAssertion,
      "places_bookmarks_count_histogram": nullAssertion,
      "places_pages_count": notNullAssertion,
      "places_pages_count_histogram": nullAssertion,
      "search_counts": nullAssertion,
      "scalar_parent_browser_engagement_max_concurrent_window_count": notNullAssertion,
      "scalar_parent_browser_engagement_max_concurrent_tab_count": notNullAssertion,
      "scalar_parent_browser_engagement_tab_open_event_count": nullAssertion,
      "scalar_parent_browser_engagement_window_open_event_count": nullAssertion,
      "scalar_parent_browser_engagement_unique_domains_count": nullAssertion,
      "scalar_parent_browser_engagement_total_uri_count": nullAssertion,
      "scalar_parent_browser_engagement_unfiltered_uri_count": nullAssertion,
      "scalar_parent_browser_engagement_navigation_about_newtab": nullAssertion,
      "scalar_parent_browser_engagement_navigation_contextmenu": nullAssertion,
      "scalar_parent_browser_engagement_navigation_searchbar": nullAssertion,
      "scalar_parent_browser_engagement_navigation_urlbar": nullAssertion,
    };

    const expected = {};
    const actual = {};

    for (const attribute in assertionsByAttribute) {
      expected[attribute] = true;
      const assertion = assertionsByAttribute[attribute];
      const actualValue = ping.payload.data.attributes[attribute];
      actual[attribute] = assertion(actualValue);
    }

    assert.deepEqual(expected, actual, "only expected attributes encountered");

  });

});
