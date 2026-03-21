import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { GiftedChat, Bubble, InputToolbar, Composer, Send } from 'react-native-gifted-chat';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/appStore';
import { saveToStorage } from '../services/storage';
import aiChat from '../services/aiChat';
import {
  COACHING_MODES,
  getModeInfo,
  getStarterQuestions,
} from '../services/prompts';
import { useTheme, shadows, typography, spacing } from '../theme';

export default function ChatScreen() {
  const { user, golfBag, ghinData, chatHistory, addMessage, clearChat } = useAppStore();
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentMode, setCurrentMode] = useState(COACHING_MODES.GENERAL);
  const t = useTheme();

  useEffect(() => {
    if (chatHistory && chatHistory.length > 0) {
      setMessages(chatHistory);
    } else {
      setMessages([{
        _id: 1,
        text: getWelcomeMessage(),
        createdAt: new Date(),
        user: { _id: 2, name: 'Golf Coach', avatar: '⛳' },
      }]);
    }
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
      user: { _id: 2, name: 'Golf Coach', avatar: '⛳' },
    };

    setMessages(prev => GiftedChat.append(prev, [message]));
    addMessage(message);
  };

  const onSend = useCallback(async (newMessages = []) => {
    const userMessage = newMessages[0];
    setMessages(prev => GiftedChat.append(prev, newMessages));
    addMessage(userMessage);
    setIsTyping(true);

    try {
      let responseText;
      try {
        responseText = await aiChat.generateResponse(userMessage.text);
      } catch (error) {
        console.warn('AI API failed, using mock response:', error.message);
        responseText = aiChat.getMockResponse(userMessage.text);
      }

      const assistantMessage = {
        _id: Math.random().toString(),
        text: responseText,
        createdAt: new Date(),
        user: { _id: 2, name: 'Golf Coach', avatar: '⛳' },
      };

      setMessages(prev => GiftedChat.append(prev, [assistantMessage]));
      addMessage(assistantMessage);
      await saveToStorage('CHAT_HISTORY', useAppStore.getState().chatHistory);
    } catch (error) {
      console.error('Error getting AI response:', error);
      Alert.alert('Error', 'Failed to get response. Please try again.');
    } finally {
      setIsTyping(false);
    }
  }, []);

  const handleStarterQuestion = (question) => {
    onSend([{
      _id: Math.random().toString(),
      text: question,
      createdAt: new Date(),
      user: { _id: 1, name: user?.fullName?.givenName || 'You' },
    }]);
  };

  const handleClearChat = () => {
    Alert.alert('Clear Chat', 'Are you sure you want to clear the chat history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive',
        onPress: async () => {
          clearChat();
          await saveToStorage('CHAT_HISTORY', []);
          setMessages([{
            _id: 1,
            text: getWelcomeMessage(),
            createdAt: new Date(),
            user: { _id: 2, name: 'Golf Coach', avatar: '⛳' },
          }]);
        },
      },
    ]);
  };

  const renderBubble = (props) => {
    const modeInfo = getModeInfo(currentMode);
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: { backgroundColor: modeInfo.color },
          left: { backgroundColor: t.bubbleLeft },
        }}
        textStyle={{
          right: { color: t.bubbleRightText },
          left: { color: t.bubbleLeftText },
        }}
      />
    );
  };

  const renderInputToolbar = (props) => (
    <InputToolbar
      {...props}
      containerStyle={[styles.inputToolbar, { borderTopColor: t.border, backgroundColor: t.surface }]}
      primaryStyle={{ alignItems: 'center' }}
    />
  );

  const renderComposer = (props) => (
    <Composer
      {...props}
      textInputStyle={{ color: t.text }}
      placeholderTextColor={t.placeholder}
    />
  );

  const renderSend = (props) => (
    <Send {...props} textStyle={{ color: t.primary }} />
  );

  const modeInfo = getModeInfo(currentMode);
  const starterQuestions = getStarterQuestions(currentMode);

  return (
    <View style={[styles.container, { backgroundColor: t.chatBackground }]}>
      {/* Mode Header */}
      <View style={[styles.modeHeader, { backgroundColor: modeInfo.color }]}>
        <View style={styles.modeInfo}>
          <Text style={styles.modeEmoji}>{modeInfo.emoji}</Text>
          <View>
            <Text style={styles.modeName}>{modeInfo.name}</Text>
            <Text style={styles.modeDescription}>{modeInfo.description}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.modeButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.modeButtonText}>Change Mode</Text>
        </TouchableOpacity>
      </View>

      {/* Starter Questions */}
      {messages.length <= 1 && (
        <View style={[styles.starterQuestions, { backgroundColor: t.surfaceAlt, borderBottomColor: t.border }]}>
          <Text style={[styles.starterTitle, { color: t.textSecondary }]}>Try asking:</Text>
          {starterQuestions.map((question, index) => (
            <TouchableOpacity key={index}
              style={[styles.starterButton, { backgroundColor: t.surface, borderColor: t.border }]}
              onPress={() => handleStarterQuestion(question)}>
              <Text style={[styles.starterButtonText, { color: t.text }]}>{question}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Chat */}
      <GiftedChat
        messages={messages}
        onSend={msgs => onSend(msgs)}
        user={{ _id: 1, name: user?.fullName?.givenName || 'You' }}
        renderBubble={renderBubble}
        renderInputToolbar={renderInputToolbar}
        renderComposer={renderComposer}
        renderSend={renderSend}
        isTyping={isTyping}
        placeholder="Ask your golf coach..."
        alwaysShowSend
        scrollToBottom
      />

      {/* Clear Chat */}
      {messages.length > 1 && (
        <TouchableOpacity style={[styles.clearButton, { borderTopColor: t.border, backgroundColor: t.surface }]}
          onPress={handleClearChat}>
          <Text style={[styles.clearButtonText, { color: t.dangerText }]}>Clear Chat</Text>
        </TouchableOpacity>
      )}

      {/* Mode Selection Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent
        onRequestClose={() => setModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: t.modalOverlay }]}>
          <View style={[styles.modalContent, { backgroundColor: t.modalBackground }, shadows.large]}>
            <Text style={[styles.modalTitle, { color: t.text }]}>Select Coaching Mode</Text>

            <ScrollView style={styles.modeOptionsScroll} showsVerticalScrollIndicator={false}>
              {Object.values(COACHING_MODES).map(mode => {
                const info = getModeInfo(mode);
                const isActive = mode === currentMode;
                return (
                  <TouchableOpacity key={mode}
                    style={[styles.modeOption, { borderColor: info.color },
                      isActive && { backgroundColor: info.color + '20' }]}
                    onPress={() => handleModeChange(mode)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modeOptionEmoji}>{info.emoji}</Text>
                    <View style={styles.modeOptionInfo}>
                      <Text style={[styles.modeOptionName, { color: t.text }]}>
                        {info.name}
                      </Text>
                      <Text style={[styles.modeOptionDesc, { color: t.textSecondary }]}>
                        {info.description}
                      </Text>
                    </View>
                    {isActive && <Ionicons name="checkmark-circle" size={24} color={info.color} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: t.cancelButton }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.modalCloseText, { color: t.cancelButtonText }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  modeHeader: {
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modeEmoji: { fontSize: 28, marginRight: spacing.sm },
  modeName: {
    ...typography.h5,
    color: '#fff',
    marginBottom: 2,
  },
  modeDescription: {
    ...typography.caption,
    color: '#fff',
    opacity: 0.95,
  },
  modeButton: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  modeButtonText: {
    color: '#fff',
    ...typography.bodySmall,
    fontWeight: '600',
  },
  starterQuestions: {
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  starterTitle: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  starterButton: {
    padding: spacing.md,
    borderRadius: 10,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  starterButtonText: {
    ...typography.bodySmall,
  },
  inputToolbar: {
    borderTopWidth: 1,
    paddingVertical: spacing.xs,
  },
  clearButton: {
    padding: spacing.md,
    alignItems: 'center',
    borderTopWidth: 1,
  },
  clearButtonText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    borderRadius: 16,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  modalTitle: {
    ...typography.h4,
    marginBottom: spacing.lg,
  },
  modeOptionsScroll: {
    maxHeight: 450,
  },
  modeOption: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  modeOptionEmoji: { fontSize: 32, marginRight: spacing.md },
  modeOptionInfo: { flex: 1 },
  modeOptionName: {
    ...typography.body,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modeOptionDesc: {
    ...typography.bodySmall,
  },
  modalCloseButton: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCloseText: {
    ...typography.button,
  },
});
