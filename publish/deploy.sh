#!/bin/bash
set -e

# prerequisite: s3cmd --configure

# Generate cache-busting version (Unix timestamp)
CACHE_VERSION=$(date +%s)

# Inject cache version into index.html
sed -i "s/CACHE_VERSION/$CACHE_VERSION/g" /workspace/site-root/index.html

# Apply bucket policy for public read access
s3cmd setpolicy /workspace/publish/bucket-policy.json s3://camden-wander/

# Sync with explicit MIME types for CSS files
s3cmd sync \
    --delete-removed \
    --exclude '*' \
    --include '*.css' \
    --mime-type='text/css' \
    /workspace/site-root/ \
    s3://camden-wander/

# Sync with explicit MIME types for JavaScript files
s3cmd sync \
    --delete-removed \
    --exclude '*' \
    --include '*.js' \
    --mime-type='application/javascript' \
    /workspace/site-root/ \
    s3://camden-wander/

# Sync with explicit MIME types for HTML files
s3cmd sync \
    --delete-removed \
    --exclude '*' \
    --include '*.html' \
    --mime-type='text/html' \
    /workspace/site-root/ \
    s3://camden-wander/

# Sync HLS playlist files
s3cmd sync \
    --delete-removed \
    --exclude '*' \
    --include '*.m3u8' \
    --mime-type='application/vnd.apple.mpegurl' \
    /workspace/site-root/ \
    s3://camden-wander/

# Sync HLS segment files
s3cmd sync \
    --delete-removed \
    --exclude '*' \
    --include '*.ts' \
    --mime-type='video/mp2t' \
    /workspace/site-root/ \
    s3://camden-wander/

# Sync remaining files with auto-detection
s3cmd sync \
    --delete-removed \
    --guess-mime-type \
    --exclude '*.md' \
    --exclude '*.css' \
    --exclude '*.js' \
    --exclude '*.html' \
    --exclude '*.m3u8' \
    --exclude '*.ts' \
    /workspace/site-root/ \
    s3://camden-wander/

# Restore CACHE_VERSION placeholder in index.html
sed -i "s/$CACHE_VERSION/CACHE_VERSION/g" /workspace/site-root/index.html
