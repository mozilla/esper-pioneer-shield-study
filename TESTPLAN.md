# Test Plan for The ESPER experiment - Firefox Pioneer Study

## Manual / QA TEST Instructions

1. Install the shield addon from https://bugzilla.mozilla.org/show_bug.cgi?id=1414900#c4
1. Go to about:telemetry -> Click "current ping" -> Archived ping data -> ping, select shield-study-addon
1. Click on  "Raw Payload" and verify the ping is similar to https://github.com/motin/esper-pioneer-shield-study/blob/master/TELEMETRY.md
1. Copy the ping to left box of  http://jsondiff.com/
1. Go to about:addons and remove the addon
1. Open a new tab and visit a unique page 
1. Right click on any link from any page and click “Open Link in New Tab”
1. Bookmark the page
1. Open a new window and search “Mozilla” in the search bar
1. Create a new tab and search “Firefox” in the urlbar
1. Right-click any word and select to search for it in the context menu
1. Create a new tab and search "Firefox" in the tab contents search bar ("Search the Web")
1. Reinstall the addon
1. Go to about:telemetry in a new tab, or at least make sure to reload the previous page (this refreshes the archived ping data)
1. Copy the ping to the right side of the above online tool: http://jsondiff.com/
1. Compare the two pings using the online tool
1. Verify values of some fields are changed in the second ping. 

Note: To increment the search_counts attribute, you'll need to have performed at least one search using the firefox search bar and then reload the addon.

## Developer testing 

First, make sure you are on NPM 5+ installed so that the proper dependencies are installed using the package-lock.json file.

`$ npm install -g npm`

Clone the repo:

`$ git clone https://github.com/motin/esper-pioneer-shield-study.git -b prepare-for-qa`

After cloning the repo, you can run the following commands from the top level directory, one after another:

`$ npm install`

`$ npm run build`

This packages the add-on into `linked-addon.xpi` which is stored in `dist/`. This file is what you load into Firefox.

To do that, open your standard issue Firefox (with your ordinary profile) and load the `.xpi` using the following steps:

* Navigate to *about:config* and set `extensions.legacy.enabled` to `true`. This permits the loading of the embedded Web Extension since new versions of Firefox are becoming restricted to pure Web Extensions only.
* Navigate to *about:debugging* in your URL bar
* Select "Load Temporary Add-on"
* Find and select the `linked-addon.xpi` file you just built.

### Seeing the add-on in action

You should not see any UI element from this add-on, only log output in the Browser Console (`Tools > Web Developer > Browser Console`), which comes from shield utilities in general and this add-on.

### Note: checking "Correct Pings"

At add-on installation, the add-on will wait for Telemetry to be fully initialized 
(which can take over a minute if Firefox was just started), and finally collect the relevant telemetry and send a ping with that payload.
See [TELEMETRY.md](./TELEMETRY.md) for more details. 

### Example of how it appears when testing in Firefox

![Example of how it appears when testing in Firefox](https://user-images.githubusercontent.com/793037/32371249-d8389ac6-c098-11e7-890f-efb43344d162.jpg)

## Automated Testing

`npm run firefox` starts Firefox and automatically installs the add-on in a new profile and echoes the sent pings to the shell.

`npm test` verifies the telemetry payload as expected at firefox startup and add-on installation in a clean profile.

Code at [./test/functional_test.js](./test/functional_test.js).

Note: Both of these run in recently created profiles, leading to behavior-dependent such as browser engagement and search count telemetry not being available.  
