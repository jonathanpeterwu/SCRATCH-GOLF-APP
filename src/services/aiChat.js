import axios from 'axios';
import { COACHING_MODES, SYSTEM_PROMPTS, buildContextPrompt } from './prompts';

// AI Service Configuration
const AI_CONFIG = {
  OPENAI: {
    API_KEY: 'YOUR_OPENAI_API_KEY', // Replace with your OpenAI API key
    MODEL: 'gpt-4-turbo-preview',
    API_URL: 'https://api.openai.com/v1/chat/completions',
  },
  ANTHROPIC: {
    API_KEY: 'YOUR_ANTHROPIC_API_KEY', // Replace with your Anthropic API key
    MODEL: 'claude-3-5-sonnet-20241022',
    API_URL: 'https://api.anthropic.com/v1/messages',
  },
  // Choose your AI provider
  ACTIVE_PROVIDER: 'anthropic', // 'openai' or 'anthropic'
};

class AIChat {
  constructor() {
    this.conversationHistory = [];
    this.currentMode = COACHING_MODES.GENERAL;
    this.userData = {
      user: null,
      golfBag: null,
      ghinData: null,
    };
  }

  // Set user context data
  setUserData(user, golfBag, ghinData) {
    this.userData = { user, golfBag, ghinData };
  }

  // Set coaching mode
  setMode(mode) {
    if (Object.values(COACHING_MODES).includes(mode)) {
      this.currentMode = mode;
      // Clear history when switching modes to avoid context confusion
      this.conversationHistory = [];
    }
  }

  // Generate AI response
  async generateResponse(userMessage) {
    try {
      // Validate configuration
      this.validateConfig();

      // Add user message to history
      this.conversationHistory.push({
        role: 'user',
        content: userMessage,
      });

      // Get response from active provider
      let assistantMessage;
      if (AI_CONFIG.ACTIVE_PROVIDER === 'openai') {
        assistantMessage = await this.getOpenAIResponse();
      } else {
        assistantMessage = await this.getAnthropicResponse();
      }

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage,
      });

      return assistantMessage;
    } catch (error) {
      console.error('AI Chat Error:', error);
      throw error;
    }
  }

  // OpenAI API integration
  async getOpenAIResponse() {
    try {
      // Build context
      const systemPrompt = SYSTEM_PROMPTS[this.currentMode];
      const contextPrompt = buildContextPrompt(
        this.userData.user,
        this.userData.golfBag,
        this.userData.ghinData
      );

      // Prepare messages
      const messages = [
        {
          role: 'system',
          content: systemPrompt + contextPrompt,
        },
        ...this.conversationHistory,
      ];

      // Make API request
      const response = await axios.post(
        AI_CONFIG.OPENAI.API_URL,
        {
          model: AI_CONFIG.OPENAI.MODEL,
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AI_CONFIG.OPENAI.API_KEY}`,
          },
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API Error:', error.response?.data || error.message);
      throw new Error('Failed to get response from OpenAI');
    }
  }

  // Anthropic API integration
  async getAnthropicResponse() {
    try {
      // Build context
      const systemPrompt = SYSTEM_PROMPTS[this.currentMode];
      const contextPrompt = buildContextPrompt(
        this.userData.user,
        this.userData.golfBag,
        this.userData.ghinData
      );

      // Convert conversation history to Anthropic format
      const messages = this.conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // Make API request
      const response = await axios.post(
        AI_CONFIG.ANTHROPIC.API_URL,
        {
          model: AI_CONFIG.ANTHROPIC.MODEL,
          max_tokens: 1024,
          system: systemPrompt + contextPrompt,
          messages: messages,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': AI_CONFIG.ANTHROPIC.API_KEY,
            'anthropic-version': '2023-06-01',
          },
        }
      );

      return response.data.content[0].text;
    } catch (error) {
      console.error('Anthropic API Error:', error.response?.data || error.message);
      throw new Error('Failed to get response from Anthropic');
    }
  }

  // Get a mock response (for testing without API keys)
  getMockResponse(userMessage) {
    const responses = {
      [COACHING_MODES.GENERAL]: `Great question! Based on your handicap index of ${this.userData.ghinData?.handicapIndex || 'your current level'}, I'd recommend focusing on consistency. Looking at your bag, you have a solid setup. Let's work on course management and smart decision-making to shave off a few strokes.`,

      [COACHING_MODES.PRACTICE]: `Here's your 60-minute practice session:

**Warm-up (10 min)**
• 5 min: Dynamic stretches and alignment stick work
• 5 min: Wedge swings with rhythm focus (20 swings)

**Iron Practice (25 min)**
• Gate drill with 7-iron: 15 reps through alignment gate
• Target practice: 20 shots to flags at 100, 125, 150 yards
• Success goal: 12/20 within 30 feet

**Short Game (15 min)**
• Chipping ladder: 5-10-15-20-25 yard chips (3 reps each)
• Bunker: 10 shots focusing on consistent depth

**Putting (10 min)**
• Gate drill from 6 feet: 20 putts (goal: 15/20 through gate)
• Lag putting: 6 putts from 30-40 feet

Track your results and let me know how it goes!`,

      [COACHING_MODES.STROKES_GAINED]: `Let me analyze your data:

**SG: Off-the-Tee**: ${this.userData.ghinData?.recentScores?.[0]?.strokesGained?.offTee || '-0.3'}
You're close to scratch level here. No major concerns.

**SG: Approach**: ${this.userData.ghinData?.recentScores?.[0]?.strokesGained?.approach || '-1.5'} 🔴
This is your biggest opportunity! You're losing 1.5 strokes per round on approach shots. Improving this by even 0.5 strokes would drop your scores by 1-2 shots.

**SG: Around-the-Green**: ${this.userData.ghinData?.recentScores?.[0]?.strokesGained?.aroundGreen || '0.2'} 🟢
Actually a strength! Keep it up.

**Recommendation**: Dedicate 60% of practice time to iron play and distance control. Focus on hitting more greens in regulation.`,
    };

    return responses[this.currentMode] || responses[COACHING_MODES.GENERAL];
  }

  // Validate API configuration
  validateConfig() {
    const provider = AI_CONFIG.ACTIVE_PROVIDER;

    if (provider === 'openai') {
      if (AI_CONFIG.OPENAI.API_KEY === 'YOUR_OPENAI_API_KEY') {
        throw new Error('OpenAI API key not configured. Please add your API key in aiChat.js');
      }
    } else if (provider === 'anthropic') {
      if (AI_CONFIG.ANTHROPIC.API_KEY === 'YOUR_ANTHROPIC_API_KEY') {
        throw new Error('Anthropic API key not configured. Please add your API key in aiChat.js');
      }
    } else {
      throw new Error('Invalid AI provider configured');
    }
  }

  // Clear conversation history
  clearHistory() {
    this.conversationHistory = [];
  }

  // Get current mode
  getMode() {
    return this.currentMode;
  }
}

// Export singleton instance
export default new AIChat();
