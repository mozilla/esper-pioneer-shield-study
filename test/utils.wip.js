/* let's actually just make this a constant */
const MODIFIER = (function getModifierKey() {
  const modifierKey = process.platform === "darwin" ?
    webdriver.Key.COMMAND : webdriver.Key.CONTROL;
  return modifierKey;
})();


module.exports.promiseAddonButton = async(driver) => {
  driver.setContext(Context.CHROME);
  try {
    return await driver.wait(until.elementLocated(
      By.id("social-share-button")), 1000);
  } catch (e) {
    // if there an error, the button was not found
    // so return null
    return null;
  }
};



// TODO glind general wrapper for 'async with callback'?


/* Firefox UI helper functions */

// such as:  "social-share-button"
module.exports.addButtonFromCustomizePanel = async(driver, buttonId) =>
  driver.executeAsyncScript((callback) => {
    // see https://dxr.mozilla.org/mozilla-central/rev/211d4dd61025c0a40caea7a54c9066e051bdde8c/browser/base/content/browser-social.js#193
    Components.utils.import("resource:///modules/CustomizableUI.jsm");
    CustomizableUI.addWidgetToArea(buttonId, CustomizableUI.AREA_NAVBAR);
    callback();
  });

module.exports.removeButtonFromNavbar = async(driver, buttonId) => {
  try {
    await driver.executeAsyncScript((callback) => {
      Components.utils.import("resource:///modules/CustomizableUI.jsm");
      CustomizableUI.removeWidgetFromArea(buttonId);
      callback();
    });

    // TODO glind fix this, I think this is supposed to prove it's dead.
    const button = await module.exports.promiseAddonButton(driver);
    return button === null;
  } catch (e) {
    if (e.name === "TimeoutError") {
      return false;
    }
    throw (e);
  }
};

/* this is NOT WORKING FOR UNKNOWN HARD TO EXLAIN REASONS
=> Uncaught WebDriverError: InternalError: too much recursion
module.exports.allAddons = async(driver) => {
  // callback is how you get the return back from the script
  return driver.executeAsyncScript(async(callback,) => {
    Components.utils.import("resource://gre/modules/AddonManager.jsm");
    const L = await AddonManager.getAllAddons();
    callback(await L);
  });
};
*/




// TODO glind, this interface feels janky
// this feels like it wants to be $ like.
// not obvious right now, moving on!
class getChromeElementBy {
  static async _get1(driver, method, selector ) {
    driver.setContext(Context.CHROME);
    try {
      return await driver.wait(until.elementLocated(
        By[method](selector)), 1000);
    } catch (e) {
      // if there an error, the button was not found
      console.log(e);
      return null;
    }
  }
  static async id(driver, id) { return this._get1(driver, "id", id); }

  static async className(driver, className) { return this._get1(driver, "className", className); }

  static async tagName(driver, tagName) { return this._get1(driver, "tagName", tagName); }
}
module.exports.getChromeElementBy = getChromeElementBy;





// TODO glind, specific to share-button-study but useful to demo patterns.
// TODO glind, generalize, document, or destroy

// module.exports.copyUrlBar = async(driver) => {
//   const urlBar = await getChromeElementBy.id(driver,'urlbar');
//   const urlBar = await module.exports.promiseUrlBar(driver);
//   await urlBar.sendKeys(webdriver.Key.chord(MODIFIER, "A"));
//   await urlBar.sendKeys(webdriver.Key.chord(MODIFIER, "C"));
// };

// module.exports.testAnimation = async(driver) => {
//   const button = await module.exports.promiseAddonButton(driver);
//   if (button === null) { return { hasClass: false, hasColor: false }; }
//
//   const buttonClassString = await button.getAttribute("class");
//   const buttonColor = await button.getCssValue("background-color");
//
//   const hasClass = buttonClassString.split(" ").includes("social-share-button-on");
//   const hasColor = buttonColor.includes("43, 153, 255");
//   return { hasClass, hasColor };
// };

// module.exports.waitForClassAdded = async(driver) => {
//  try {
//    const animationTest = await driver.wait(async() => {
//      const { hasClass } = await module.exports.testAnimation(driver);
//      return hasClass;
//    }, 1000);
//    return animationTest;
//  } catch (e) {
//    if (e.name === "TimeoutError") { return null; }
//    throw (e);
//  }
// };
//
// module.exports.waitForAnimationEnd = async(driver) => {
//  try {
//    return await driver.wait(async() => {
//      const { hasClass, hasColor } = await module.exports.testAnimation(driver);
//      return !hasClass && !hasColor;
//    }, 1000);
//  } catch (e) {
//    if (e.name === "TimeoutError") { return null; }
//    throw (e);
//  }
// };


// module.exports.testPanel = async(driver, panelId) => {
//   driver.setContext(Context.CHROME);
//   try { // if we can't find the panel, return false
//     return await driver.wait(async() => {
//       // need to execute JS, since state is not an HTML attribute, it's a property
//       const panelState = await driver.executeAsyncScript((panelIdArg, callback) => {
//         const shareButtonPanel = window.document.getElementById(panelIdArg);
//         if (shareButtonPanel === null) {
//           callback(null);
//         } else {
//           const state = shareButtonPanel.state;
//           callback(state);
//         }
//       }, panelId);
//       return panelState === "open";
//     }, 1000);
//   } catch (e) {
//     if (e.name === "TimeoutError") { return null; }
//     throw e;
//   }
// };


// module.exports.closePanel = async(driver, target = null) => {
//   if (target !== null) {
//     target.sendKeys(webdriver.Key.ESCAPE);
//   } else {
//     const urlbar = await module.exports.promiseUrlBar(driver);
//     await urlbar.sendKeys(webdriver.Key.ESCAPE);
//   }
// };
