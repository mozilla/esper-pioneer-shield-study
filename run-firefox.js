/* eslint-env node */

/* This file is a helper script that will install the extension from the .xpi
 * file and setup useful preferences for debugging. This is the same setup
 * that the automated Selenium-Webdriver/Mocha tests run, except in this case
 * we can manually interact with the browser.
 * NOTE: If changes are made, they will not be reflected in the browser upon
 * reloading, as the .xpi file has not been recreated.
 */

console.log("Starting up firefox");

require("geckodriver");
const firefox = require("selenium-webdriver/firefox");
const cmd = require("selenium-webdriver/lib/command");
const Fs = require("fs-extra");
const FxRunnerUtils = require("fx-runner/lib/utils");
const path = require("path");
const webdriver = require("selenium-webdriver");

const By = webdriver.By;
const Context = firefox.Context;
const until = webdriver.until;

const {
  promiseActualBinary,
  installAddon,
  promiseSetupDriver,
  getTelemetryPings,
  printPings,
  takeScreenshot
} = require("./test/utils");


const HELP = `
env vars:
- XPI (optional): path to xpi / addon
- FIREFOX_BINARY = 'nightly'

`;

const minimistHandler = {
  boolean: [ 'help' ],
  alias: { h: 'help', v: 'version' },
  '--': true,
};


(async() => {
  const minimist = require("minimist");
  const parsedArgs = minimist(process.argv.slice(2), minimistHandler);
  if (parsedArgs.help) {
    console.log(HELP);
    process.exit();
  }

  try {
    const driver = await promiseSetupDriver();
    console.log("Firefox started");

    // install the addon
    if (process.env.XPI) {
      const fileLocation = path.join(process.cwd(), process.env.XPI);
      console.log(fileLocation)
      await installAddon(driver, fileLocation);
      console.log("Load temporary addon.");
    }

    // navigate to a regular page
    driver.setContext(Context.CONTENT);
    driver.get("about:debugging");

    console.log("The addon should now be loaded and you should be able to interact with the addon in the newly opened Firefox instance.");

    await takeScreenshot(driver);
    console.log("Screenshot dumped");

    const telemetryPingsFilterOptions = {
      type: [ "shield-study", "shield-study-addon" ],
      headersOnly: false,
    };
    const pings = await getTelemetryPings(driver, telemetryPingsFilterOptions);
    console.log("Shield study telemetry pings: ");
    printPings(pings);

  } catch (e) {
    console.error(e); // eslint-disable-line no-console
  }
})();
