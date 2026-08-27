# ⛳ Golf Coach App

A comprehensive React Native golf coaching app with AI-powered advice, iCloud sync, Apple Sign In, and GHIN integration.

## 🎯 Features

### ⛳ Course Rankings
- Ranked catalog of publicly bookable courses across Pinehurst, Scotland, England, and the US - municipals, daily-fee tracks, resorts, and members' clubs that sell visitor times
- Filter by trip destination, search by course, city, country, or architect; sort by ranking, training value, fit, golfer rating, green fee, or difficulty
- Rate a course across five categories (conditions, layout, value, pace, facilities) and leave a review
- Rankings use a Bayesian (shrunk) average, so one glowing review can't push a course to #1 - but a run of them moves it
- UK green fees are shown in pounds, US fees in dollars

### 🎯 Ranked Around Your Game
- Every course carries a `traits` block: how hard it leans on driving, approach, around-the-green, and putting, plus wind, ground game, and how penal a miss is - all on 0-100
- Your game profile lives on the same scale, built from GHIN strokes gained (or your handicap alone if you have no rounds logged), so a course demand and your skill compare directly
- **Training value** ranks courses by how hard they test what you're working on. **Fit** ranks them by how well they suit the game you have today. They deliberately disagree
- Set your focus in Profile → Game Focus, or leave it and it follows your two weakest strokes gained categories
- Log rounds you've played; links and heathland rounds build a links-experience score that changes how a Scotland trip reads

### 🤖 AI Training Agent
- Builds a preparation brief per course: what it will ask of you, where your game is exposed, drills to do before the trip, how to play it on the day, and bag notes based on the clubs you actually carry
- Every brief is computed locally first - the gaps, the drills, the expected score band (WHS course handicap adjusted for fit) all come from your numbers and the course's traits, and work with no API key and no network
- With an AI provider configured in `aiChat.js`, the same computed numbers are handed to the model, which writes the prose version above them. The model interprets; it never invents the figures
- Briefs are cached in the private database and rebuilt when your handicap, skills, focus, or links experience change

### 🗓️ Tee Time Booking
- Every course publishes a tee sheet: real tee windows, intervals, and per-slot pricing with early-bird and twilight discounts
- Live availability per slot (out of a foursome), with past times and full groups blocked
- Book 1-4 players up to 14 days out, add a cart, leave a note for the pro shop, and get a confirmation code
- Upcoming and past tee times in one place, with cancellation

> **Note:** there is no live booking backend yet. Bookings are written to the private database on the device, and the "other golfers" filling up each sheet are derived deterministically from the course and date - the same slot always shows the same availability. Swapping in a real provider (GolfNow, Supreme Golf, a club's own API) means replacing the two functions in `src/services/teeTimes.js` that produce a sheet and confirm a booking; the screens and the private database stay as they are. Green fees and tee windows in `src/data/courses.js` are approximate - confirm with the course.

### 🔒 Private On-Device Database
- Ratings, reviews, and bookings live in a private database on the device (`src/services/db.js`)
- Rows are namespaced per signed-in user, so two accounts on one device never see each other's data
- Nothing in it is synced to iCloud or any server; sign-out clears it from memory, and "Clear All Data" deletes every row
- Includes a one-call export of everything the app holds for a user

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
│   ├── data/
│   │   └── courses.js             # Public course catalog + per-course demands
│   │
│   ├── services/
│   │   ├── auth.js                # Apple Sign In integration
│   │   ├── storage.js             # Local + iCloud storage
│   │   ├── db.js                  # Private per-user on-device database
│   │   ├── rankings.js            # Bayesian course ranking
│   │   ├── reviews.js             # Course ratings and reviews
│   │   ├── teeTimes.js            # Tee sheets, pricing, bookings
│   │   ├── gameProfile.js         # Strokes gained -> skill profile + focus
│   │   ├── courseFit.js           # Course demands vs your game
│   │   ├── coursePreview.js       # The AI training agent
│   │   ├── playLog.js             # Rounds played, links experience
│   │   ├── ghin.js                # GHIN API integration
│   │   ├── prompts.js             # Coaching prompts + training-agent prompt
│   │   └── aiChat.js              # AI service (OpenAI/Anthropic)
│   │
│   ├── store/
│   │   └── appStore.js            # Zustand state management
│   │
│   ├── hooks/
│   │   └── useGameProfile.js      # One shared game profile for every screen
│   │
│   ├── components/
│   │   ├── CourseDetail.js        # Course page: fit, brief, reviews, tee sheet
│   │   ├── TrainingBrief.js       # Renders a training brief
│   │   ├── GameFocusCard.js       # What you're working on
│   │   └── StarRating.js          # Star display + star input
│   │
│   └── screens/
│       ├── LoginScreen.js         # Apple authentication
│       ├── CoursesScreen.js       # Ranked, searchable course list
│       ├── TeeTimesScreen.js      # Upcoming and past bookings
│       ├── GolfBagScreen.js       # Bag management
│       ├── ChatScreen.js          # AI coach chat with modes
│       ├── StatsScreen.js         # GHIN stats & variance
│       └── ProfileScreen.js       # Settings & sync
│
├── tests/                          # Logic suites, run with `npm test`
├── .github/workflows/ci.yml        # Test + web build on every push and PR
│
├── README.md                       # This file
├── DEPLOY.md                       # Where this ships and how
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
