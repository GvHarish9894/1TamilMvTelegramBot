#!/bin/bash

# Install Chromium and dependencies for Puppeteer on Render.com
echo "Installing Chromium and dependencies..."

# Update package list
apt-get update

# Install Chromium and required dependencies
apt-get install -y \
  chromium-browser \
  chromium-codecs-ffmpeg \
  fonts-liberation \
  fonts-noto-color-emoji \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libdrm2 \
  libgbm1 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils

echo "Chromium installation complete"

# Install npm dependencies
echo "Installing Node.js dependencies..."
npm install

echo "Build complete!"
