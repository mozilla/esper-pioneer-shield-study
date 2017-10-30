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


/* Part 2:  The Tests */

describe("basic functional tests", function() {
  // This gives Firefox time to start, and us a bit longer during some of the tests.
  this.timeout(15000);

  let driver;
  let addonId;
  let pings;

  before(async() => {
    driver = await utils.promiseSetupDriver();
    // install the addon
    addonId = await utils.installAddon(driver);
    // allow our shield study addon some time to start
    await driver.sleep(1000);
    // collect sent pings
    pings = await utils.getTelemetryPings(driver, ["shield-study", "shield-study-addon"]);
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

  it("one proper shield-study-addon telemetry ping for the telemetry-payload event", async() => {

    const foundPings = utils.searchTelemetry([
      ping => ping.type === "shield-study-addon" && ping.payload.data.attributes.event === "telemetry-payload",
    ], pings);
    assert(foundPings.length === 1);

    const ping = foundPings[0];

    assert(ping.payload.shield_version === "4.1.0", "expected shield-study-utils version");

    // no undefined expected attributes

    const notUndefined = value => {
      return value !== "undefined"
    };

    const assertionsByAttribute = {
      "completeTelemetrySessionPayload": notUndefined,
      "uptime": notUndefined,
      "total_time": notUndefined,
      "profile_subsession_counter": notUndefined,
      "subsession_start_date": notUndefined,
      "timezone_offset": notUndefined,
      "places_bookmarks_count": notUndefined,
      "places_pages_count": notUndefined,
      "search_counts": notUndefined,
      "scalar_parent_browser_engagement_window_open_event_count": notUndefined,
      "scalar_parent_browser_engagement_total_uri_count": notUndefined,
      "scalar_parent_browser_engagement_navigation_urlbar": notUndefined,
      "scalar_parent_browser_engagement_navigation_contextmenu": notUndefined,
      "scalar_parent_browser_engagement_tab_open_event_count": notUndefined,
      "scalar_parent_browser_engagement_navigation_searchbar": notUndefined,
      "scalar_parent_browser_engagement_navigation_about_newtab": notUndefined,
      "scalar_parent_browser_engagement_unique_domains_count": notUndefined,
      "scalar_parent_browser_engagement_max_concurrent_window_count": notUndefined,
      "scalar_parent_browser_engagement_max_concurrent_tab_count": notUndefined,
      "scalar_parent_browser_engagement_unfiltered_uri_count": notUndefined,
    };

    const expected = {};
    const actual = {};

    for (const attribute in assertionsByAttribute) {
      expected[attribute] = true;
      const assertion = assertionsByAttribute[attribute];
      const actualValue = ping.payload.data.attributes[attribute];
      actual[attribute] = assertion(actualValue);
    }

    assert.deepEqual(expected, actual, "no expected attributes should be 'undefined'");

  });

});
