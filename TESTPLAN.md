# Test Plan for The ESPER experiment - Firefox Pioneer Study

## Manual / QA TEST Instructions

First, make sure you are on NPM 5+ installed so that the proper dependencies are installed using the package-lock.json file.

`$ npm install -g npm`

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

Install the signed version of [the QA Shield Study Helper Add-on](https://bugzilla.mozilla.org/show_bug.cgi?id=1407757) and then reload the esper add-on (from *about:debugging*). 

Click on the QA Shield Study Helper Add-on to see the sent pings. 

At start-up, the add-on will send a "esper-init" event and then wait for Telemetry to be fully initialized (which can take over a minute), and then collect the relevant telemetry and send a ping with that payload. See `TELEMETRY.md` for more details. 

### Example of how it appears when testing in Firefox

![Example of how it appears when testing in Firefox](https://user-images.githubusercontent.com/793037/32371249-d8389ac6-c098-11e7-890f-efb43344d162.jpg)

## Automated Testing

`npm run firefox` starts Firefox and automatically installs the add-on in a new profile and echoes the sent pings to the shell.

`npm test` verifies the telemetry payload as expected at firefox startup and add-on installation in a clean profile.

Code at [./test/functional_test.js].

Note: Both of these run in recently created profiles, leading to behavior-dependent such as browser engagement and search count telemetry not being available.  
