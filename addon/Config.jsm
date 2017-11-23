"use strict";

/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(Config|EXPORTED_SYMBOLS)" }]*/

const EXPORTED_SYMBOLS = ["Config"];

const Config = {
  addonId: "esper-pioneer-shield-study@shield.mozilla.org",
  studyName: "esper-pioneer-shield-study",
  branches: [
    { name: "pioneer", weight: 1 },
  ],
  telemetry: {
    "removeTestingFlag": true,
  },
};
