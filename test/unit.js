/* eslint-env node */
/* eslint no-console:off */

const Helpers = require("../addon/lib/Helpers.jsm").Helpers;

const empty1 = undefined;

console.log("should be 0", Helpers.searchCountsHistogramToScalarTotalCount(empty1));

const empty2 = null;

console.log("should be 0", Helpers.searchCountsHistogramToScalarTotalCount(empty2));

const oneEngine = {
  "ddg.searchbar": {
    "range": [1, 2],
    "bucket_count": 3,
    "histogram_type": 4,
    "values": { "0": 1, "1": 0 },
    "sum": 1,
  },
};

console.log("should be 1", Helpers.searchCountsHistogramToScalarTotalCount(oneEngine));

const twoEngines = {
  "ddg.searchbar": {
    "range": [1, 2],
    "bucket_count": 3,
    "histogram_type": 4,
    "values": { "0": 1, "1": 0 },
    "sum": 2,
  },
  "foo.searchbar": {
    "range": [1, 2],
    "bucket_count": 3,
    "histogram_type": 4,
    "values": { "0": 1, "1": 0 },
    "sum": 3,
  },
};

console.log("should be 5", Helpers.searchCountsHistogramToScalarTotalCount(twoEngines));

const faulty = {
  "ddg.searchbar": null,
  "foo.searchbar": {
    "range": [1, 2],
    "bucket_count": 3,
    "histogram_type": 4,
    "values": { "0": 1, "1": 0 },
    "sum___": 3,
  },
  "bar.searchbar": {
    "range": [1, 2],
    "bucket_count": 3,
    "histogram_type": 4,
    "values": { "0": 1, "1": 0 },
    "sum": 3,
  },
};

console.log("should be 3", Helpers.searchCountsHistogramToScalarTotalCount(faulty));
