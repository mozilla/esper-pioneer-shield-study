# The ESPER Experiment - Firefox Pioneer Study

Evaluating Similarity of Pioneers as Exemplars of Release

Assess the degree and sense in which users in opt-in cohort of Firefox Pioneer differ from the Firefox release channel population. This should be a one time collection of data that focuses on fields for which we have aggregate statistics pertaining to the firefox release population in Telemetry.

For more information, see [the ESPER Product Hypothesis Doc](https://docs.google.com/document/d/1AhPGfCUs8lafrs9EznhL80NmiL0z4tUKb7HCMXlPxH8/edit)

# Getting started

First, make sure you are on NPM 5+ installed so that the proper dependencies are installed using the package-lock.json file.

`$ npm install -g npm`

After cloning the repo, you can run the following commands from the top level directory, one after another:

```
$ npm install
$ npm run build
```

This packages the add-on into `linked-addon.xpi` which is stored in `dist/`. This file is what you load into Firefox.

Note: `linked-addon.xpi` is a symbolic link to the extension's true XPI, which is named based on the study's unique addon ID specified in `package.json`.

# Loading the Web Extension in Firefox

You can have Firefox automatically launched and the add-on installed by running:

`$ npm run firefox`

To load the extension manually instead, open (preferably) the [Developer Edition of Firefox](https://www.mozilla.org/firefox/developer/) and load the `.xpi` using the following steps:

* Navigate to *about:config* and set `extensions.legacy.enabled` to `true`. This permits the loading of the embedded Web Extension since new versions of Firefox are becoming restricted to pure Web Extensions only.
* Navigate to *about:debugging* in your URL bar
* Select "Load Temporary Add-on"
* Find and select the `linked-addon.xpi` file you just built.

# Seeing the add-on in action

To debug installation and loading of extensions, use the Browser Console which can be open from Firefox's top toolbar in `Tools > Web Developer > Browser Console`. This will display Shield (loading/telemetry) and `console.log()` output from the extensions that we build.

You should not see any UI element from this add-on, only log output in the Browser Console (`Tools > Web Developer > Browser Console`), which comes from shield utilities in general and this add-on.

See `TELEMETRY.md` for details on telemetry sent by the add-on.  

# Developing

You can automatically build recent changes and package them into a `.xpi` by running the following from the top level directory:

`$ npm run watch`

Now, anytime a file is changed and saved, node will repackage the add-on. You must reload the add-on as before, or by clicking the "Reload" under the add-on in *about:debugging*. Note that a hard re-load is recommended to clear local storage. To do this, simply remove the add-on and reload as before.

# Functional testing

Run the following to run the example set of functional tests:

`$ npm test`

Note: The functional tests are using async/await, so make sure you are running Node 7.6+

# Description of what goes on when this addon is started

During `bootstrap.js:startup(data, reason)`:

    a. `shieldUtils` imports and sets configuration from `Config.jsm`
    b. `bootstrap.js:chooseVariation` explicitly and deterministically chooses a variation from `studyConfig.weightedVariations`
    c.  the WebExtension starts up
    d.  `boostrap.js` listens for requests from the `webExtension` that are study related:  `["info", "telemetry", "endStudy"]`
    e.  `webExtension` (`background.js`) asks for `info` from `studyUtils` using `askShield` function.
    f.  Feature starts using the `variation` from that info.
    g.  Feature instruments user button to send `telemetry` and to `endStudy` if the button is clicked enough.

Tip: It is particularly useful to compare the source code of previously deployed shield studies with this template (and each other) to get an idea of what is actually relevant to change between studies vs what is mostly untouched boilerplate.

# Getting Data

Telemetry pings are loaded into S3 and re:dash. See `TELEMETRY.md` for more details.
