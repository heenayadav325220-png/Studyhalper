#!/bin/bash

# StudyHelper APK Build Script

set -e

echo "📱 StudyHelper APK Build Script"
echo "================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Install dependencies
echo -e "${BLUE}Step 1: Installing dependencies...${NC}"
npm install

# Step 2: Add Android platform if not exists
if [ ! -d "android" ]; then
    echo -e "${BLUE}Step 2: Adding Android platform...${NC}"
    npx cap add android
else
    echo -e "${YELLOW}Android platform already exists${NC}"
fi

# Step 3: Build web app
echo -e "${BLUE}Step 3: Building web app...${NC}"
npm run build

# Step 4: Sync with Android
echo -e "${BLUE}Step 4: Syncing with Android...${NC}"
npx cap sync android

# Step 5: Ask which build type
echo -e "${BLUE}Step 5: Building APK...${NC}"
echo "Choose build type:"
echo "1) Debug APK (for testing)"
echo "2) Release APK (for distribution)"
read -p "Enter choice (1 or 2): " choice

cd android

if [ "$choice" = "1" ]; then
    echo -e "${BLUE}Building Debug APK...${NC}"
    ./gradlew assembleDebug
    echo -e "${GREEN}✓ Debug APK built successfully!${NC}"
    echo -e "${GREEN}Location: android/app/build/outputs/apk/debug/app-debug.apk${NC}"
elif [ "$choice" = "2" ]; then
    echo -e "${BLUE}Building Release APK...${NC}"
    read -p "Enter path to keystore file (or 'skip' to use debug): " keystore_path
    
    if [ "$keystore_path" != "skip" ] && [ -f "$keystore_path" ]; then
        read -p "Enter keystore password: " -s keystore_pass
        echo
        read -p "Enter key alias: " key_alias
        read -p "Enter key password: " -s key_pass
        echo
        
        ./gradlew assembleRelease \
          -Pandroid.injected.signing.store.file="$keystore_path" \
          -Pandroid.injected.signing.store.password="$keystore_pass" \
          -Pandroid.injected.signing.key.alias="$key_alias" \
          -Pandroid.injected.signing.key.password="$key_pass"
        echo -e "${GREEN}✓ Release APK built successfully!${NC}"
        echo -e "${GREEN}Location: android/app/build/outputs/apk/release/app-release.apk${NC}"
    else
        echo -e "${YELLOW}Building unsigned release APK...${NC}"
        ./gradlew assembleRelease
        echo -e "${YELLOW}Note: This APK is unsigned and cannot be published.${NC}"
    fi
else
    echo -e "${YELLOW}Invalid choice. Exiting.${NC}"
    exit 1
fi

cd ..

echo -e "${GREEN}✓ Build complete!${NC}"
