# 🛠️ Implementation Guide

Complete setup instructions for the Golf Coach app.

## Prerequisites

Before you begin, make sure you have:

- **Mac computer** (required for iOS development)
- **Node.js** 16+ and npm 8+ installed
- **Xcode** 14+ installed (download from Mac App Store)
- **Apple Developer Account** ($99/year for full features)
- **iOS device** (for testing Apple Sign In and iCloud)

## Step 1: Install Dependencies

```bash
cd golf-coach-app
npm install
```

This will install all required packages including:
- React Native and Expo
- Navigation libraries
- Storage and authentication libraries
- UI components

## Step 2: Apple Developer Account Setup

### 2.1 Create App Identifier

1. Go to https://developer.apple.com
2. Log in with your Apple ID
3. Navigate to **Certificates, Identifiers & Profiles**
4. Click **Identifiers** → **+ (Add)**
5. Select **App IDs** → **Continue**
6. Configure:
   - Description: `Golf Coach App`
   - Bundle ID: `com.yourname.golfcoach` (use explicit, not wildcard)
7. Under **Capabilities**, check:
   - ✅ Sign In with Apple
   - ✅ iCloud
8. Click **Continue** → **Register**

### 2.2 Configure iCloud Container

1. Still in **Identifiers**, click on your app ID
2. Scroll to **iCloud** capability
3. Click **Configure**
4. Click **+ (Add)** to create a new container
5. Enter identifier: `iCloud.com.yourname.golfcoach`
6. Click **Continue** → **Register**
7. Select your container and click **Continue**
8. Click **Save**

### 2.3 Create Provisioning Profile

1. Navigate to **Profiles** → **+ (Add)**
2. Select **iOS App Development** → **Continue**
3. Select your App ID → **Continue**
4. Select your developer certificate → **Continue**
5. Select your test devices → **Continue**
6. Name it `Golf Coach Development` → **Generate**
7. Download and double-click to install

## Step 3: Xcode Configuration

### 3.1 Open Project in Xcode

```bash
cd ios
open GolfCoachApp.xcworkspace
```

(If `.xcworkspace` doesn't exist yet, run `npx pod-install` first)

### 3.2 Configure Signing & Capabilities

1. In Xcode, select your project in the left sidebar
2. Select the target `GolfCoachApp`
3. Go to **Signing & Capabilities** tab

#### General Settings:
- Bundle Identifier: `com.yourname.golfcoach` (match your App ID)
- Team: Select your development team
- Signing Certificate: Select your certificate

#### Add Capabilities:

**Sign In with Apple:**
1. Click **+ Capability**
2. Search for "Sign In with Apple"
3. Click to add

**iCloud:**
1. Click **+ Capability**
2. Search for "iCloud"
3. Click to add
4. Under iCloud, check:
   - ✅ CloudKit
   - ✅ Key-value storage
5. Click **+ (Container)** and select your container

**Background Modes** (optional, for background sync):
1. Click **+ Capability**
2. Search for "Background Modes"
3. Check: ✅ Remote notifications

### 3.3 Update Info.plist

The `Info.plist` file needs some additions:

```xml
<key>NSAppleEventsUsageDescription</key>
<string>This app needs access to Apple Sign In</string>
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.yourname.golfcoach</string>
    </array>
  </dict>
</array>
```

## Step 4: Update app.json

Edit `app.json` in the project root:

```json
{
  "expo": {
    "name": "Golf Coach",
    "slug": "golf-coach-app",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourname.golfcoach",
      "supportsTablet": true,
      "infoPlist": {
        "NSAppleEventsUsageDescription": "This app uses Apple Sign In for authentication"
      },
      "entitlements": {
        "com.apple.developer.icloud-container-identifiers": [
          "iCloud.com.yourname.golfcoach"
        ],
        "com.apple.developer.ubiquity-kvstore-identifier": "$(AppIdentifierPrefix)com.yourname.golfcoach",
        "com.apple.developer.icloud-services": [
          "CloudKit"
        ]
      }
    }
  }
}
```

## Step 5: Configure Storage Services

### 5.1 Update CloudStorage Configuration

Edit `src/services/storage.js` if needed. The current implementation should work out of the box, but you can customize:

```javascript
// Custom iCloud container (optional)
const CLOUD_CONTAINER = 'iCloud.com.yourname.golfcoach';
```

### 5.2 Test Storage

The app uses:
- **AsyncStorage** for local data
- **expo-cloud-storage** for iCloud backup
- Automatic fallback if iCloud is unavailable

## Step 6: AI Integration

See [AI_INTEGRATION_GUIDE.md](./AI_INTEGRATION_GUIDE.md) for complete AI setup.

Quick setup:

1. Get an API key (Anthropic or OpenAI)
2. Edit `src/services/aiChat.js`:
   ```javascript
   ANTHROPIC_API_KEY: 'sk-ant-your-key-here'
   ACTIVE_PROVIDER: 'anthropic'
   ```

## Step 7: GHIN Integration (Optional)

### 7.1 Get GHIN API Access

1. Visit https://www.ghin.com/api
2. Request API access (may require approval)
3. Receive your API key

### 7.2 Configure GHIN Service

Edit `src/services/ghin.js`:

```javascript
const GHIN_API_KEY = 'your_ghin_api_key_here';
```

### 7.3 Test Without GHIN

The app includes mock GHIN data for testing:
- Just enter any GHIN number
- Click "Connect GHIN"
- Tap "OK" when prompted about demo mode
- Mock data will be loaded automatically

## Step 8: Build and Run

### 8.1 Start Development Server

```bash
npm start
```

### 8.2 Run on iOS Simulator (Basic Testing)

```bash
npm run ios
```

**Note:** Apple Sign In and iCloud do NOT work in the simulator! You need a real device.

### 8.3 Run on Physical Device

#### Method 1: Expo Go (Quick, but limited)

1. Install Expo Go from App Store
2. Scan QR code from `npm start`
3. **Limitation:** Apple Sign In and iCloud won't work with Expo Go

#### Method 2: Development Build (Recommended)

```bash
# Build for device
npx expo run:ios --device

# Select your connected device
# App will install and run
```

### 8.4 Run on Android (Optional)

```bash
npm run android
```

**Note:** Apple Sign In is iOS only. Android will need alternative authentication.

## Step 9: Testing Checklist

### ✅ Apple Sign In
- [ ] Open app on physical iOS device
- [ ] Tap "Sign in with Apple"
- [ ] Complete authentication
- [ ] Verify user data is stored

### ✅ Golf Bag
- [ ] Navigate to Bag tab
- [ ] Add a driver (brand, model, loft)
- [ ] Add other clubs
- [ ] Close and reopen app
- [ ] Verify clubs are saved

### ✅ iCloud Sync
- [ ] Add some clubs
- [ ] Go to Profile tab
- [ ] Tap "Sync to iCloud Now"
- [ ] Verify success message
- [ ] Install app on another iOS device (same Apple ID)
- [ ] Verify data syncs

### ✅ Chat
- [ ] Navigate to Chat tab
- [ ] Tap mode button, try all 3 modes
- [ ] Send a message in each mode
- [ ] Verify AI responses (or mock responses)
- [ ] Check that context includes your bag

### ✅ GHIN Stats
- [ ] Navigate to Stats tab
- [ ] Enter GHIN number (or use demo)
- [ ] Tap "Connect GHIN"
- [ ] Verify variance analysis displays
- [ ] Check strokes gained breakdown
- [ ] Verify recent rounds show

## Step 10: Production Build

### 10.1 Update Version

Edit `package.json` and `app.json`:

```json
"version": "1.0.0"
```

### 10.2 Create Production Build

```bash
# iOS
npx expo build:ios

# Or use EAS Build (recommended)
npm install -g eas-cli
eas build --platform ios
```

### 10.3 Submit to App Store

1. Archive the build in Xcode
2. Upload to App Store Connect
3. Fill out App Store listing
4. Submit for review

Full App Store submission guide: https://docs.expo.dev/submit/ios/

## Troubleshooting

### Build Errors

**Error: Module not found**
```bash
rm -rf node_modules
npm install
cd ios && pod install && cd ..
```

**Error: Unable to resolve module**
```bash
npm start -- --reset-cache
```

**CocoaPods errors**
```bash
cd ios
pod deintegrate
pod install
cd ..
```

### Apple Sign In Issues

**"Sign In with Apple is not available"**
- You're probably on the simulator
- Test on a real device
- Check that capability is enabled in Xcode

**"Error signing in with Apple"**
- Verify bundle identifier matches App ID
- Check provisioning profile is valid
- Ensure capability is enabled in Developer Portal

### iCloud Sync Issues

**"iCloud sync failed"**
- Check that device is signed into iCloud
- Verify iCloud capability is enabled
- Confirm container identifier matches
- Check iCloud Drive is enabled on device

**Data not syncing between devices**
- Make sure both devices use same Apple ID
- Check that both have iCloud enabled
- Try manual sync from Profile tab
- Wait a few minutes (iCloud sync isn't instant)

### GHIN Issues

**"Failed to fetch GHIN data"**
- Check API key is correct
- Verify GHIN number is valid
- Use demo mode for testing

**Mock data not loading**
- This is fine! Mock data is a fallback
- Real GHIN API requires valid credentials
- Mock data shows what the UI will look like

### AI Issues

**"Failed to get response from AI"**
- Check API key is correct in `aiChat.js`
- Verify you have credits with provider
- Check internet connection
- See AI_INTEGRATION_GUIDE.md for details

**Responses don't include my data**
- Make sure clubs are added in Bag tab
- Connect GHIN in Stats tab
- Context is automatically included

## Performance Optimization

### Reducing Bundle Size

1. Remove unused dependencies from `package.json`
2. Enable Hermes engine (already configured in Expo)
3. Use production build for App Store

### Improving Sync Performance

1. Sync only on significant changes
2. Batch updates to iCloud
3. Use incremental sync where possible

### Optimizing AI Costs

1. Limit conversation history length
2. Use shorter max_tokens for responses
3. Consider caching common responses

## Security Best Practices

### API Keys

- **NEVER** commit API keys to git
- Use environment variables in production
- Consider using a backend proxy for API calls

### User Data

- All user data is stored locally and in iCloud
- No data is sent to external servers (except AI providers)
- Users control their data

### Authentication

- Apple Sign In provides privacy-protected emails
- Credentials stored securely in Keychain
- No password management needed

## Next Steps

After completing setup:

1. ✅ Read [AI_INTEGRATION_GUIDE.md](./AI_INTEGRATION_GUIDE.md) for AI setup
2. ✅ Read [COACHING_MODES_REFERENCE.md](./COACHING_MODES_REFERENCE.md) for mode details
3. ✅ Customize the prompts in `src/services/prompts.js`
4. ✅ Add your branding and colors
5. ✅ Test thoroughly on real devices
6. ✅ Submit to App Store!

## Resources

- **Expo Docs**: https://docs.expo.dev
- **React Native Docs**: https://reactnative.dev
- **Apple Developer**: https://developer.apple.com
- **Anthropic API**: https://docs.anthropic.com
- **OpenAI API**: https://platform.openai.com/docs
- **GHIN API**: https://www.ghin.com/api

## Support

For issues with this implementation:
1. Check the troubleshooting section above
2. Review the relevant documentation
3. Search for similar issues online
4. Open an issue on GitHub

---

**You're all set!** 🎉 Start coaching some golfers! ⛳
