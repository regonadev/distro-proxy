#!/usr/bin/env bash
set -o errexit

# Bağımlılıkları yükleyin
npm install

# Puppeteer için önbellek dizinini oluşturun
export PUPPETEER_CACHE_DIR=/opt/render/.cache/puppeteer
mkdir -p $PUPPETEER_CACHE_DIR

# Chromium'u indirin
npx puppeteer browsers install chrome

# Önbelleği yapı önbelleğiyle senkronize edin
cp -R $PUPPETEER_CACHE_DIR /opt/render/project/src/.cache/puppeteer
