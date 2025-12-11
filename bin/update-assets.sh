#!/bin/bash
# Update assets from alps-editor GitHub Pages

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

if [ "$REMOTE_SHA" = "$LOCAL_SHA" ]; then
    echo "Already up to date (SHA256: $LOCAL_SHA)"
    rm -f "$TEMP_FILE"
    exit 0
fi

# Update
mv "$TEMP_FILE" "$LOCAL_FILE"
echo "Updated $LOCAL_FILE"
echo "  Old SHA256: $LOCAL_SHA"
echo "  New SHA256: $REMOTE_SHA"
