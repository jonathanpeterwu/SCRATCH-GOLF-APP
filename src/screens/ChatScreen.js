import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { GiftedChat, Bubble, InputToolbar } from 'react-native-gifted-chat';
import { useAppStore } from '../store/appStore';
import { saveToStorage } from '../services/storage';
import aiChat from '../services/aiChat';
import {
  COACHING_MODES,
  getModeInfo,
  getStarterQuestions,
} from '../services/prompts';

export default function ChatScreen() {
  const { user, golfBag, ghinData, chatHistory, addMessage, clearChat } = useAppStore();
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentMode, setCurrentMode] = useState(COACHING_MODES.GENERAL);

  useEffect(() => {
    // Load chat history
    if (chatHistory && chatHistory.length > 0) {
      setMessages(chatHistory);
    } else {
      // Show welcome message
      setMessages([
        {
          _id: 1,
          text: getWelcomeMessage(),
          createdAt: new Date(),
          user: {
            _id: 2,
            name: 'Golf Coach',
            avatar: '⛳',
          },
        },
      ]);
    }

    // Set user data in AI service
    aiChat.setUserData(user, golfBag, ghinData);
  }, []);

  const getWelcomeMessage = () => {
    return `Welcome to Golf Coach! 🏌️

I'm your AI golf coach, here to help you improve your game. I can help with:

• Swing thoughts and technique tips
• Course strategy and shot selection
• Practice plans and drills
• Analyzing your strokes gained data
• Equipment advice

Tap the coaching mode button above to switch between different coaching styles!

What would you like to work on today?`;
  };

  const handleModeChange = (newMode) => {
    setCurrentMode(newMode);
    aiChat.setMode(newMode);
    setModalVisible(false);

    const modeInfo = getModeInfo(newMode);
    const message = {
      _id: Math.random().toString(),
      text: `Switched to ${modeInfo.emoji} ${modeInfo.name}\n\n${modeInfo.description}`,
      createdAt: new Date(),
      user: {
        _id: 2,
        name: 'Golf Coach',
        avatar: '⛳',
      },
    };

    setMessages(previousMessages => GiftedChat.append(previousMessages, [message]));
    addMessage(message);
  };

  const onSend = useCallback(async (newMessages = []) => {
    const userMessage = newMessages[0];

    // Add user message
    setMessages(previousMessages => GiftedChat.append(previousMessages, newMessages));
    addMessage(userMessage);

    // Show typing indicator
    setIsTyping(true);

    try {
      // Get AI response
      let responseText;
      try {
        responseText = await aiChat.generateResponse(userMessage.text);
      } catch (error) {
        // Fallback to mock response if AI fails
        console.warn('AI API failed, using mock response:', error.message);
        responseText = aiChat.getMockResponse(userMessage.text);
      }

      // Create assistant message
      const assistantMessage = {
        _id: Math.random().toString(),
        text: responseText,
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'Golf Coach',
          avatar: '⛳',
        },
      };

      // Add assistant message
      setMessages(previousMessages =>
        GiftedChat.append(previousMessages, [assistantMessage])
      );
      addMessage(assistantMessage);

      // Save to storage
      await saveToStorage('CHAT_HISTORY', useAppStore.getState().chatHistory);
    } catch (error) {
      console.error('Error getting AI response:', error);
      Alert.alert('Error', 'Failed to get response. Please try again.');
    } finally {
      setIsTyping(false);
    }
  }, []);

  const handleStarterQuestion = (question) => {
    const message = {
      _id: Math.random().toString(),
      text: question,
      createdAt: new Date(),
      user: {
        _id: 1,
        name: user?.fullName?.givenName || 'You',
      },
    };
    onSend([message]);
  };

  const handleClearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear the chat history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            clearChat();
            await saveToStorage('CHAT_HISTORY', []);
            setMessages([
              {
                _id: 1,
                text: getWelcomeMessage(),
                createdAt: new Date(),
                user: {
                  _id: 2,
                  name: 'Golf Coach',
                  avatar: '⛳',
                },
              },
            ]);
          },
        },
      ]
    );
  };

  const renderBubble = (props) => {
    const modeInfo = getModeInfo(currentMode);
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: modeInfo.color,
          },
          left: {
            backgroundColor: '#f0f0f0',
          },
        }}
        textStyle={{
          right: {
            color: '#fff',
          },
          left: {
            color: '#333',
          },
        }}
      />
    );
  };

  const renderInputToolbar = (props) => {
    return (
      <InputToolbar
        {...props}
        containerStyle={styles.inputToolbar}
        primaryStyle={{ alignItems: 'center' }}
      />
    );
  };

  const modeInfo = getModeInfo(currentMode);
  const starterQuestions = getStarterQuestions(currentMode);

  return (
    <View style={styles.container}>
      {/* Mode Header */}
      <View style={[styles.modeHeader, { backgroundColor: modeInfo.color }]}>
        <View style={styles.modeInfo}>
          <Text style={styles.modeEmoji}>{modeInfo.emoji}</Text>
          <View>
            <Text style={styles.modeName}>{modeInfo.name}</Text>
            <Text style={styles.modeDescription}>{modeInfo.description}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.modeButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.modeButtonText}>Change Mode</Text>
        </TouchableOpacity>
      </View>

      {/* Starter Questions */}
      {messages.length <= 1 && (
        <View style={styles.starterQuestions}>
          <Text style={styles.starterTitle}>Try asking:</Text>
          {starterQuestions.map((question, index) => (
            <TouchableOpacity
              key={index}
              style={styles.starterButton}
              onPress={() => handleStarterQuestion(question)}
            >
              <Text style={styles.starterButtonText}>{question}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Chat */}
      <GiftedChat
        messages={messages}
        onSend={messages => onSend(messages)}
        user={{
          _id: 1,
          name: user?.fullName?.givenName || 'You',
        }}
        renderBubble={renderBubble}
        renderInputToolbar={renderInputToolbar}
        isTyping={isTyping}
        placeholder="Ask your golf coach..."
        alwaysShowSend
        scrollToBottom
      />

      {/* Clear Chat Button */}
      {messages.length > 1 && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearChat}
        >
          <Text style={styles.clearButtonText}>Clear Chat</Text>
        </TouchableOpacity>
      )}

      {/* Mode Selection Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Coaching Mode</Text>

            {Object.values(COACHING_MODES).map(mode => {
              const info = getModeInfo(mode);
              const isActive = mode === currentMode;

              return (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.modeOption,
                    { borderColor: info.color },
                    isActive && { backgroundColor: info.color + '20' },
                  ]}
                  onPress={() => handleModeChange(mode)}
                >
                  <Text style={styles.modeOptionEmoji}>{info.emoji}</Text>
                  <View style={styles.modeOptionInfo}>
                    <Text style={styles.modeOptionName}>
                      {info.name}
                      {isActive && ' ✓'}
                    </Text>
                    <Text style={styles.modeOptionDescription}>
                      {info.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modeHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modeEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  modeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  modeDescription: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  modeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  modeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  starterQuestions: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  starterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  starterButton: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  starterButtonText: {
    fontSize: 14,
    color: '#333',
  },
  inputToolbar: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  clearButton: {
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  clearButtonText: {
    color: '#d32f2f',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  modeOption: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
    alignItems: 'center',
  },
  modeOptionEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  modeOptionInfo: {
    flex: 1,
  },
  modeOptionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  modeOptionDescription: {
    fontSize: 13,
    color: '#666',
  },
  modalCloseButton: {
    marginTop: 8,
    padding: 14,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
});
