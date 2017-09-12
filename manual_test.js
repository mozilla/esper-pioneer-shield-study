/* eslint-env node */

/* This file is a helper script that will install the extension from the .xpi
 * file and setup useful preferences for debugging. This is the same setup
 * that the automated Selenium-Webdriver/Mocha tests run, except in this case
 * we can manually interact with the browser.
 * NOTE: If changes are made, they will not be reflected in the browser upon
 * reloading, as the .xpi file has not been recreated.
 */

const utils = require("./test/utils");
const firefox = require("selenium-webdriver/firefox");

const Context = firefox.Context;

(async() => {
  try {
    const driver = await utils.promiseSetupDriver();

    // add the share-button to the toolbar
    await utils.addShareButton(driver);
    // set the treatment
    await driver.executeAsyncScript((typeArg, callback) => {
      Components.utils.import("resource://gre/modules/Preferences.jsm");
      if (typeArg !== null) {
        Preferences.set("extensions.sharebuttonstudy.treatment", typeArg);
      }
      callback();
    }, "doorhangerAskToAdd");
    // install the addon
    await utils.installAddon(driver);

    // navigate to a regular page
    driver.setContext(Context.CONTENT);
    await driver.get("http://github.com/mozilla");
    driver.setContext(Context.CHROME);

    await utils.copyUrlBar(driver);
  } catch (e) {
    console.error(e); // eslint-disable-line no-console
  }
})();
