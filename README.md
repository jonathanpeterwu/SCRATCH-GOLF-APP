# ⛳ Golf Coach App

A comprehensive React Native golf coaching app with AI-powered advice, iCloud sync, Apple Sign In, and GHIN integration.

## 🎯 Features

### 🏌️ Golf Bag Management
- Store your complete club setup (driver, woods, hybrids, irons, wedges, putter)
- Add detailed club information (brand, model, number, loft)
- Your bag is used as context in AI coaching conversations

### 💬 AI Coach Chat with 3 Modes
- **General Coach Mode** 🏌️ - All-around golf advice and strategy
- **Practice Mode** 🏋️ - Structured practice plans with specific drills and rep counts
- **Strokes Gained Analysis** 📊 - Data-driven insights from your performance metrics

Each mode has expert pre-written prompts designed by golf professionals to give you the best coaching experience.

### 📊 GHIN Integration
- Connect your GHIN account to pull handicap and recent rounds
- Variance analysis for last 5, 10, 15, and 20 rounds
- Strokes gained breakdown:
  - Off-the-Tee
  - Approach
  - Around-the-Green
  - Putting
  - Tee-to-Green
- Visual indicators show strengths and improvement areas

### 🔐 Apple Sign In
- Secure authentication with Apple ID
- Privacy-focused, no password management
- Credentials stored securely

### ☁️ iCloud Sync
- Automatic backup of all data to iCloud
- Syncs across all your Apple devices
- Manual sync option available
- Local storage with cloud backup

## 📁 Project Structure

```
golf-coach-app/
├── App.js                          # Main navigation setup
├── package.json                    # Dependencies
├── babel.config.js                 # Babel configuration
│
├── src/
│   ├── services/
│   │   ├── auth.js                # Apple Sign In integration
│   │   ├── storage.js             # Local + iCloud storage
│   │   ├── ghin.js                # GHIN API integration
│   │   ├── prompts.js             # Expert coaching prompts for each mode
│   │   └── aiChat.js              # AI service (OpenAI/Anthropic)
│   │
│   ├── store/
│   │   └── appStore.js            # Zustand state management
│   │
│   └── screens/
│       ├── LoginScreen.js         # Apple authentication
│       ├── GolfBagScreen.js       # Bag management
│       ├── ChatScreen.js          # AI coach chat with modes
│       ├── StatsScreen.js         # GHIN stats & variance
│       └── ProfileScreen.js       # Settings & sync
│
├── README.md                       # This file
├── AI_INTEGRATION_GUIDE.md        # AI setup instructions
├── IMPLEMENTATION_GUIDE.md        # Detailed setup guide
└── COACHING_MODES_REFERENCE.md    # Quick reference for modes
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Apple Developer Account

See [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) for detailed instructions on:
- Setting up Sign In with Apple capability
- Configuring iCloud container
- App identifier and provisioning profiles

### 3. Configure AI Integration

See [AI_INTEGRATION_GUIDE.md](./AI_INTEGRATION_GUIDE.md) for:
- Getting an Anthropic or OpenAI API key
- Configuring the API in `src/services/aiChat.js`
- Understanding the coaching modes

### 4. Optional: Configure GHIN Integration

Edit `src/services/ghin.js` and add your GHIN API key:

```javascript
const GHIN_API_KEY = 'your_ghin_api_key_here';
```

Get a GHIN API key from: https://www.ghin.com/api

### 5. Run the App

```bash
# Start Metro bundler
npm start

# Run on iOS (requires Mac)
npm run ios

# Run on Android
npm run android
```

## 📱 How to Use

### First Time Setup
1. **Sign In with Apple** - Tap the Apple Sign In button
2. **Add Your Clubs** - Go to the Bag tab and add your clubs
3. **Connect GHIN** (optional) - Go to Stats tab and enter your GHIN number
4. **Start Chatting** - Go to Chat tab and ask your coach anything!

### Using Chat Modes
The app has 3 specialized coaching modes. Tap the colored mode button at the top of the Chat screen to switch:

1. **🏌️ General Coach** (Green) - Ask about swing thoughts, course strategy, club selection
2. **🏋️ Practice Mode** (Orange) - Get structured practice plans with drills and rep counts
3. **📊 SG Analysis** (Blue) - Understand your strokes gained data and prioritize practice

Each mode has suggested starter questions to help you get started!

### Syncing Your Data
All data is automatically synced to iCloud. You can also manually sync from the Profile tab.

## 🔧 Configuration Files

### Key Files to Configure

1. **`src/services/aiChat.js`** - Add your AI API key here
2. **`src/services/ghin.js`** - Add your GHIN API key here (optional)
3. **`app.json`** - Update app name, bundle identifier, etc.

## 🛠️ Development

### Technologies Used
- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform
- **React Navigation** - Navigation library
- **Zustand** - State management
- **Gifted Chat** - Chat UI
- **AsyncStorage** - Local storage
- **expo-cloud-storage** - iCloud sync
- **expo-apple-authentication** - Apple Sign In
- **Anthropic Claude / OpenAI GPT-4** - AI coaching

### State Management
The app uses Zustand for state management. The main store is in `src/store/appStore.js` and contains:
- User authentication state
- Golf bag data
- GHIN data
- Chat history

### Data Flow
```
User Input → Screen Component → App Store → Services (AI, Storage, GHIN)
              ↓                                    ↓
         Local State                          AsyncStorage + iCloud
```

## 📖 Additional Documentation

- **[AI_INTEGRATION_GUIDE.md](./AI_INTEGRATION_GUIDE.md)** - Complete AI setup guide
- **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Apple Developer setup
- **[COACHING_MODES_REFERENCE.md](./COACHING_MODES_REFERENCE.md)** - Quick mode reference

## 🐛 Troubleshooting

### App won't build
- Make sure you've run `npm install`
- Check that you're using Node.js 16+ and npm 8+
- Try clearing the cache: `rm -rf node_modules && npm install`

### Apple Sign In not working
- Make sure you've enabled "Sign In with Apple" capability in Xcode
- Check that you're testing on a real iOS device (doesn't work on simulator)
- See IMPLEMENTATION_GUIDE.md for detailed setup

### iCloud sync not working
- Enable iCloud capability in Xcode
- Create an iCloud container in Apple Developer Portal
- Make sure you're signed into iCloud on your device

### AI responses not working
- Check that you've added your API key in `src/services/aiChat.js`
- Verify your API key is valid and has credits
- Check the console for error messages

### GHIN data not loading
- Make sure you've added your GHIN API key in `src/services/ghin.js`
- Verify your GHIN number is correct
- The app includes mock data for testing without a real GHIN account

## 📄 License

MIT License - feel free to use this app for personal or commercial projects!

## 🤝 Contributing

This is an open-source project. Feel free to submit issues and pull requests!

## 💡 Future Enhancements

Potential features for future versions:
- Video swing analysis
- GPS rangefinder integration
- Tee time booking
- Tournament tracking
- Social features (compare stats with friends)
- Apple Watch app for on-course tracking

## 📧 Support

For issues or questions, please open an issue on GitHub.

---

**Happy golfing!** ⛳🏌️
