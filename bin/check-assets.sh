#!/bin/bash
# Check if assets are up to date with alps-editor GitHub Pages

ASSET_URL="https://alps-asd.github.io/alps-editor/js/diagramAdapters.js"
LOCAL_FILE="src/assets/diagramAdapters.js"

# Download to temp file
TEMP_FILE=$(mktemp)
curl -s -o "$TEMP_FILE" "$ASSET_URL"

if [ $? -ne 0 ]; then
    echo "Error: Failed to download from $ASSET_URL"
    rm -f "$TEMP_FILE"
    exit 1
fi

# Compare SHA256
REMOTE_SHA=$(shasum -a 256 "$TEMP_FILE" | cut -d' ' -f1)
LOCAL_SHA=$(shasum -a 256 "$LOCAL_FILE" 2>/dev/null | cut -d' ' -f1)
rm -f "$TEMP_FILE"

echo "Local:  $LOCAL_SHA"
echo "Remote: $REMOTE_SHA"

if [ "$REMOTE_SHA" = "$LOCAL_SHA" ]; then
    echo "Status: Up to date"
    exit 0
else
    echo "Status: Update available (run 'npm run update-assets')"
    exit 1
fi
