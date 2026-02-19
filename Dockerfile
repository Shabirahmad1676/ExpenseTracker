# Use n8n as the base image
FROM n8nio/n8n:latest

# Switch to root to install system dependencies
USER root

# CRITICAL V2 FIX: n8n recently moved to a distroless image and deleted 'apk'. 
# We must reinstall apk-tools manually before we can install Chrome.
RUN ARCH=$(uname -m) && \
    wget -qO- "http://dl-cdn.alpinelinux.org/alpine/latest-stable/main/${ARCH}/" | \
    grep -o 'href="apk-tools-static-[^"]*\.apk"' | head -1 | cut -d'"' -f2 | \
    xargs -I {} wget -q "http://dl-cdn.alpinelinux.org/alpine/latest-stable/main/${ARCH}/{}" && \
    tar -xzf apk-tools-static-*.apk && \
    ./sbin/apk.static -X http://dl-cdn.alpinelinux.org/alpine/latest-stable/main \
    -U --allow-untrusted add apk-tools && \
    rm -rf sbin apk-tools-static-*.apk

# NOW we can safely install Chromium and dependencies for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    nodejs \
    npm

# Tell Puppeteer to skip downloading Chrome (we use the installed Chromium)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create directory for our scripts
WORKDIR /home/node/scripts

# Copy our scraper and package files
COPY package.json .
COPY scripts/scrape_market.js .

# Install dependencies in the image
RUN npm install puppeteer firebase-admin dotenv

# Transfer ownership of the installed files back to the 'node' user
RUN chown -R node:node /home/node/scripts

# Switch back to n8n user
USER node