#!/usr/bin/env bash

echo "$@"

set -eu
#set -o xtrace

<<ABOUT
How this works:

- all files in the "addon" directory will be copied into $XPI
ABOUT


BASE_DIR="$(dirname "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)")"
TMP_DIR=$(mktemp -d)
DEST="${TMP_DIR}/addon"
XPI_NAME=$(node -p -e "require('./package.json').addon.id").xpi
echo ${XPI_NAME}


mkdir -p $DEST

# deletes the temp directory
function cleanup {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

# fill templates, could be fancier
echo $PWD
alias moustache='/node_modules/bin/mustache'
mustache package.json template/install.rdf.mustache > addon/install.rdf
mustache package.json template/chrome.manifest.mustache > addon/chrome.manifest

cp -rp addon/* $DEST

pushd $DEST
zip -r $DEST/${XPI_NAME} *
mkdir -p $BASE_DIR/dist
mv "${XPI_NAME}" $BASE_DIR/dist

# also link 'addon.xpi' to it.
cd $BASE_DIR/dist
rm -f addon.xpi
ln -s "${XPI_NAME}" addon.xpi

echo
echo "SUCCESS: xpi at ${BASE_DIR}/dist/${XPI}"
popd

