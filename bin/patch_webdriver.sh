#!/usr/bin/env bash

# patch for selenium-webdriver to fix sendKeys()
# see
#   - https://github.com/SeleniumHQ/selenium/commit/6907a129a3c02fe2dfc54700137e7f9aa025218a
#   - https://github.com/mozilla/geckodriver/issues/683

dir=$(cd -P -- "$(dirname -- "$0")" && pwd -P)
cd $dir
sed -i -e "2189s/.*/setParameter('text', keys.then(keys => keys.join('')))./" ../node_modules/selenium-webdriver/lib/webdriver.js
