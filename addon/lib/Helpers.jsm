/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(EXPORTED_SYMBOLS|Helpers)" }]*/

const EXPORTED_SYMBOLS = this.EXPORTED_SYMBOLS = ["Helpers"];

this.Helpers = {

  /**
   * Converts:
   * {
   *   "ddg.searchbar": {
   *     "range": [1, 2],
   *     "bucket_count": 3,
   *     "histogram_type": 4,
   *     "values": { "0": 1, "1": 0 },
   *     "sum": 1
   *   },
   *   "foo.searchbar": {
   *     "range": [1, 2],
   *     "bucket_count": 3,
   *     "histogram_type": 4,
   *     "values": { "0": 1, "1": 0 },
   *     "sum": 1
   *   },
   * }
   * Into a scalar representing the total count of the searches.
   *
   * @param searchCountsHistogram undefined/null or as per above
   */
  searchCountsHistogramToScalarTotalCount(searchCountsHistogram) {
    if (typeof searchCountsHistogram === "undefined") {
      return 0;
    }
    if (searchCountsHistogram === null) {
      return 0;
    }
    let totalCount = 0;
    for (const attribute in searchCountsHistogram) {
      if (!searchCountsHistogram.hasOwnProperty(attribute)) {
        continue;
      }
      const attributeValue = searchCountsHistogram[attribute];
      if (attributeValue !== null && typeof attributeValue === "object") {
        if (attributeValue.hasOwnProperty("sum")) {
          totalCount += attributeValue.sum;
        }
      }
    }
    return totalCount;
  },

};
