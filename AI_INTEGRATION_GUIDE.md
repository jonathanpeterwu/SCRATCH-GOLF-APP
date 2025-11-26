# 🤖 AI Integration Guide

This guide will walk you through setting up AI coaching in your Golf Coach app.

## Overview

The Golf Coach app uses AI to provide intelligent coaching advice across three specialized modes:
- **General Coach** - All-around golf advice
- **Practice Mode** - Structured practice plans
- **Strokes Gained Analysis** - Data-driven insights

## Supported AI Providers

The app supports two AI providers:
1. **Anthropic Claude** (recommended) - Best for detailed coaching and structured responses
2. **OpenAI GPT-4** - Alternative option with excellent performance

## Step 1: Choose Your AI Provider

### Option A: Anthropic Claude (Recommended)

**Why Anthropic?**
- Excellent at structured, detailed responses
- Great for coaching-style conversations
- Strong performance on technical golf advice
- Competitive pricing

**Get Your API Key:**
1. Go to https://console.anthropic.com
2. Sign up for an account (or log in)
3. Navigate to "API Keys" in the dashboard
4. Click "Create Key"
5. Copy your API key (starts with `sk-ant-`)

**Pricing:**
- Claude 3.5 Sonnet: ~$3 per million input tokens, ~$15 per million output tokens
- Typical coaching conversation: $0.01-0.05 per message
- Budget: $10-20/month for regular use

### Option B: OpenAI GPT-4

**Why OpenAI?**
- Well-known and widely used
- Excellent general-purpose performance
- Good at creative coaching advice

**Get Your API Key:**
1. Go to https://platform.openai.com
2. Sign up for an account (or log in)
3. Navigate to "API Keys"
4. Click "Create new secret key"
5. Copy your API key (starts with `sk-`)

**Pricing:**
- GPT-4 Turbo: ~$10 per million input tokens, ~$30 per million output tokens
- Typical coaching conversation: $0.02-0.08 per message
- Budget: $20-40/month for regular use

## Step 2: Configure the App

Open `src/services/aiChat.js` in your code editor.

### For Anthropic Claude:

```javascript
const AI_CONFIG = {
  // ... other config ...

  ANTHROPIC: {
    API_KEY: 'sk-ant-your-actual-key-here', // ← Replace this
    MODEL: 'claude-3-5-sonnet-20241022',
    API_URL: 'https://api.anthropic.com/v1/messages',
  },

  // Set this to 'anthropic'
  ACTIVE_PROVIDER: 'anthropic', // ← Make sure this is set
};
```

### For OpenAI GPT-4:

```javascript
const AI_CONFIG = {
  OPENAI: {
    API_KEY: 'sk-your-actual-key-here', // ← Replace this
    MODEL: 'gpt-4-turbo-preview',
    API_URL: 'https://api.openai.com/v1/chat/completions',
  },

  // Set this to 'openai'
  ACTIVE_PROVIDER: 'openai', // ← Make sure this is set
};
```

## Step 3: Test the Integration

### Using Mock Responses (No API Key Required)

If you want to test the app without an API key:

1. The app automatically falls back to mock responses if the AI API fails
2. Mock responses are pre-written examples for each mode
3. Great for testing the UI and flow before adding an API key

### Testing with Real AI

1. Run the app: `npm start`
2. Navigate to the Chat tab
3. Select a coaching mode
4. Ask a question like "What should I work on?"
5. Watch for the AI response

**If it works:**
- You'll see a detailed, personalized response
- The response will reference your golf bag and stats

**If it doesn't work:**
- Check the console for error messages
- Verify your API key is correct
- Make sure `ACTIVE_PROVIDER` matches your provider
- Check that you have credits/billing set up with your provider

## Understanding the Coaching Modes

### 1. 🏌️ General Coach Mode

**Best for:**
- General golf questions
- Swing thoughts and technique
- Course strategy
- Club selection advice
- Mental game tips

**Example questions:**
- "What should I focus on to lower my scores?"
- "How should I approach a tight dogleg left?"
- "Any tips for playing in the wind?"

**AI Behavior:**
- Balanced, conversational responses
- Considers your bag, handicap, and recent performance
- Provides actionable advice without overwhelming detail
- Mixes technical knowledge with practical wisdom

### 2. 🏋️ Practice Mode

**Best for:**
- Creating practice plans
- Specific drill recommendations
- Structured improvement programs
- Time-optimized practice sessions

**Example questions:**
- "Create a 60-minute practice plan for me"
- "What drills will help my putting?"
- "Design a short game practice session"

**AI Behavior:**
- Highly structured responses
- Always includes:
  - Exact time allocations (e.g., "15 minutes")
  - Specific drill names and setups
  - Rep counts (e.g., "20 reps")
  - Success criteria (e.g., "Make 15 out of 20")
  - Progression paths
- Efficient use of practice time
- Prioritizes based on your strokes gained data

### 3. 📊 Strokes Gained Analysis Mode

**Best for:**
- Understanding your SG data
- Identifying weaknesses
- Prioritizing practice areas
- Quantifying improvement opportunities

**Example questions:**
- "Analyze my recent performance"
- "Where am I losing the most strokes?"
- "What's my biggest scoring opportunity?"

**AI Behavior:**
- Data-driven analysis
- Interprets SG numbers in plain English
- Compares you to scratch and PGA Tour benchmarks
- Estimates potential score improvements
- Prioritizes practice based on maximum impact
- References your variance and consistency

## How Context Is Passed to the AI

Every message you send includes:

### Your Golf Bag
```
Driver: Titleist TSR3 (9°)
Woods: 3W (15°)
Irons: 5-PW
Wedges: 50° GW, 54° SW, 58° LW
Putter: Scotty Cameron Newport 2
```

### Your GHIN Data
```
GHIN: 1234567
Handicap Index: 12.4
Recent Rounds: 20 scores available
```

### Variance Analysis
```
Last 5 rounds: Avg 12.3, Range 3.2 (10.8-14.0)
Last 10 rounds: Avg 12.5, Range 4.1 (10.3-14.4)
...
```

### Strokes Gained
```
🟢 Off-the-Tee: +0.2 (strength)
🔴 Approach: -1.5 (opportunity)
🟢 Around-the-Green: +0.3 (strength)
🟡 Putting: -0.4 (neutral)
```

The AI uses ALL of this context to give you personalized, relevant advice!

## Customizing the Prompts

Want to adjust the coaching style? Edit the prompts in `src/services/prompts.js`:

### Example: Making General Coach More Technical

```javascript
export const SYSTEM_PROMPTS = {
  [COACHING_MODES.GENERAL]: `You are an expert PGA golf coach with biomechanics expertise...

Add more technical language here, reference specific angles, positions, etc.
`,
};
```

### Example: Making Practice Mode Shorter

```javascript
[COACHING_MODES.PRACTICE]: `Create concise 30-minute practice plans...

Focus on maximum efficiency, minimal setup time...
`,
```

## Monitoring Usage and Costs

### Anthropic Console
- View usage: https://console.anthropic.com/settings/usage
- Set spending limits in settings
- Monitor tokens per request

### OpenAI Dashboard
- View usage: https://platform.openai.com/usage
- Set monthly spending limits
- Monitor API usage patterns

### Typical Costs

**Light Use** (5-10 messages/day):
- Anthropic: $5-10/month
- OpenAI: $10-15/month

**Regular Use** (20-30 messages/day):
- Anthropic: $15-25/month
- OpenAI: $30-50/month

**Heavy Use** (50+ messages/day):
- Anthropic: $40-60/month
- OpenAI: $80-120/month

## Troubleshooting

### Error: "API key not configured"
- Make sure you replaced `YOUR_ANTHROPIC_API_KEY` or `YOUR_OPENAI_API_KEY`
- Check that your API key doesn't have extra spaces
- Verify `ACTIVE_PROVIDER` matches your chosen provider

### Error: "Failed to get response"
- Check your internet connection
- Verify your API key is valid
- Make sure you have credits/billing set up
- Check the console for detailed error messages

### Responses are too short
- The AI tries to be concise by default
- Ask follow-up questions for more detail
- Adjust the `max_tokens` parameter in `aiChat.js`

### Responses don't reference my data
- Make sure you've added clubs in the Bag tab
- Connect your GHIN in the Stats tab
- The AI needs context to personalize responses

### Mock responses still showing
- This means the real AI API failed
- Check the console for the error
- Fix the API configuration and try again

## Best Practices

### Getting the Most from AI Coaching

1. **Provide Context**: "I struggled with my driver on the last round..." gives better responses than "Help with driver"

2. **Be Specific**: "Create a 45-minute putting practice session focused on lag putting" is better than "Help me putt better"

3. **Use the Right Mode**:
   - Technical questions → General Coach
   - Want a practice plan → Practice Mode
   - Have SG data → SG Analysis Mode

4. **Ask Follow-ups**: "Can you elaborate on that drill?" or "What if I only have 30 minutes?"

5. **Reference Your Data**: The AI knows your bag and stats, but you can say "Based on my SG data..." to prompt analysis

### Staying Within Budget

1. **Set API Limits**: Both providers let you set monthly spending caps
2. **Use Mock Mode for Testing**: Test UI changes without using API credits
3. **Clear Irrelevant History**: Long conversations use more tokens
4. **Choose Appropriate Model**: Claude Sonnet or GPT-4 Turbo are cost-effective

## Advanced Configuration

### Adjusting Temperature

In `aiChat.js`, the `temperature` parameter controls creativity:

```javascript
// More creative, varied responses
temperature: 0.9

// Balanced (default)
temperature: 0.7

// More focused, consistent responses
temperature: 0.5
```

### Adjusting Max Tokens

Controls response length:

```javascript
// Shorter responses
max_tokens: 500

// Balanced (default)
max_tokens: 1000

// Longer, more detailed responses
max_tokens: 2000
```

Note: Longer responses cost more!

### Using Conversation History

The app maintains conversation history automatically. To reset:
- Tap "Clear Chat" in the Chat screen
- History clears when switching modes

## Summary

1. ✅ Choose Anthropic or OpenAI
2. ✅ Get your API key
3. ✅ Add it to `src/services/aiChat.js`
4. ✅ Set `ACTIVE_PROVIDER`
5. ✅ Test with a message
6. ✅ Start getting expert golf coaching!

Now you're ready to receive personalized AI golf coaching! ⛳🤖
