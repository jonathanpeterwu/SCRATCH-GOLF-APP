import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/appStore';
import { saveToStorage } from '../services/storage';
import { useTheme, shadows, typography, spacing } from '../theme';

const CLUB_TYPES = {
  DRIVER: 'driver',
  WOOD: 'woods',
  HYBRID: 'hybrids',
  IRON: 'irons',
  WEDGE: 'wedges',
  PUTTER: 'putter',
};

const CLUB_TYPE_OPTIONS = [
  { key: CLUB_TYPES.DRIVER, label: 'Driver', icon: 'golf-tee', description: 'Your longest club off the tee', iconColor: '#E53935' },
  { key: CLUB_TYPES.WOOD, label: 'Fairway Wood', icon: 'pine-tree', description: '3-wood, 5-wood, etc.', iconColor: '#2D7738' },
  { key: CLUB_TYPES.HYBRID, label: 'Hybrid', icon: 'flash', description: 'Long iron replacement', iconColor: '#FF9800' },
  { key: CLUB_TYPES.IRON, label: 'Iron', icon: 'hammer', description: '3-9 irons', iconColor: '#5A6678' },
  { key: CLUB_TYPES.WEDGE, label: 'Wedge', icon: 'target', description: 'PW, GW, SW, LW', iconColor: '#2196F3' },
  { key: CLUB_TYPES.PUTTER, label: 'Putter', icon: 'golf', description: 'Your flat stick', iconColor: '#9C27B0' },
];

export default function GolfBagScreen() {
  const { golfBag, addClub, removeClub } = useAppStore();
  const [typeSelectVisible, setTypeSelectVisible] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [clubForm, setClubForm] = useState({
    type: CLUB_TYPES.DRIVER, brand: '', model: '', number: '', loft: '',
  });
  const t = useTheme();

  const openAddClub = (type = null) => {
    if (type) {
      setClubForm({ type, brand: '', model: '', number: '', loft: '' });
      setFormVisible(true);
    } else {
      setTypeSelectVisible(true);
    }
  };

  const selectClubType = (type) => {
    setClubForm({ type, brand: '', model: '', number: '', loft: '' });
    setTypeSelectVisible(false);
    setFormVisible(true);
  };

  const handleAddClub = async () => {
    if (!clubForm.brand || !clubForm.model) {
      Alert.alert('Required Fields', 'Please enter brand and model');
      return;
    }

    addClub(clubForm.type, {
      brand: clubForm.brand, model: clubForm.model,
      number: clubForm.number, loft: clubForm.loft,
      type: clubForm.type === CLUB_TYPES.WEDGE ? getWedgeType(clubForm.loft) : undefined,
    });

    const updatedBag = useAppStore.getState().golfBag;
    await saveToStorage('GOLF_BAG', updatedBag);
    setClubForm({ type: CLUB_TYPES.DRIVER, brand: '', model: '', number: '', loft: '' });
    setFormVisible(false);
  };

  const handleRemoveClub = async (type, index) => {
    Alert.alert('Remove Club', 'Are you sure you want to remove this club?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          removeClub(type, index);
          const updatedBag = useAppStore.getState().golfBag;
          await saveToStorage('GOLF_BAG', updatedBag);
        },
      },
    ]);
  };

  const getWedgeType = (loft) => {
    const loftNum = parseInt(loft);
    if (loftNum >= 46 && loftNum <= 50) return 'PW';
    if (loftNum >= 50 && loftNum <= 54) return 'GW';
    if (loftNum >= 54 && loftNum <= 58) return 'SW';
    if (loftNum >= 58 && loftNum <= 64) return 'LW';
    return 'Wedge';
  };

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <Text style={[styles.subtitle, { color: t.textSecondary }]}>
            Add your clubs to get personalized coaching
          </Text>
        </View>

        <View style={styles.sectionsContainer}>
          <ClubSection
            title="Driver"
            icon="golf-tee"
            iconColor="#E53935"
            clubs={golfBag.driver ? [golfBag.driver] : []}
            onRemove={() => handleRemoveClub(CLUB_TYPES.DRIVER, 0)}
            onAdd={() => openAddClub(CLUB_TYPES.DRIVER)}
            singleClub
            theme={t}
          />
          <ClubSection
            title="Fairway Woods"
            icon="pine-tree"
            iconColor="#2D7738"
            clubs={golfBag.woods || []}
            onRemove={(i) => handleRemoveClub(CLUB_TYPES.WOOD, i)}
            onAdd={() => openAddClub(CLUB_TYPES.WOOD)}
            theme={t}
          />
          <ClubSection
            title="Hybrids"
            icon="flash"
            iconColor="#FF9800"
            clubs={golfBag.hybrids || []}
            onRemove={(i) => handleRemoveClub(CLUB_TYPES.HYBRID, i)}
            onAdd={() => openAddClub(CLUB_TYPES.HYBRID)}
            theme={t}
          />
          <ClubSection
            title="Irons"
            icon="hammer"
            iconColor="#5A6678"
            clubs={golfBag.irons || []}
            onRemove={(i) => handleRemoveClub(CLUB_TYPES.IRON, i)}
            onAdd={() => openAddClub(CLUB_TYPES.IRON)}
            theme={t}
          />
          <ClubSection
            title="Wedges"
            icon="target"
            iconColor="#2196F3"
            clubs={golfBag.wedges || []}
            onRemove={(i) => handleRemoveClub(CLUB_TYPES.WEDGE, i)}
            onAdd={() => openAddClub(CLUB_TYPES.WEDGE)}
            theme={t}
          />
          <ClubSection
            title="Putter"
            icon="golf"
            iconColor="#9C27B0"
            clubs={golfBag.putter ? [golfBag.putter] : []}
            onRemove={() => handleRemoveClub(CLUB_TYPES.PUTTER, 0)}
            onAdd={() => openAddClub(CLUB_TYPES.PUTTER)}
            singleClub
            theme={t}
          />
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: t.primary }, shadows.large]}
        onPress={() => openAddClub()}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Club Type Selection Modal */}
      <Modal visible={typeSelectVisible} animationType="slide" transparent
        onRequestClose={() => setTypeSelectVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: t.modalOverlay }]}>
          <View style={[styles.modalContent, { backgroundColor: t.modalBackground }, shadows.large]}>
            <Text style={[styles.modalTitle, { color: t.text }]}>Select Club Type</Text>
            <Text style={[styles.modalSubtitle, { color: t.textSecondary }]}>
              What type of club do you want to add?
            </Text>

            <ScrollView style={styles.typeOptionsScroll} showsVerticalScrollIndicator={false}>
              {CLUB_TYPE_OPTIONS.map(({ key, label, icon, description, iconColor }) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.typeOption, { backgroundColor: t.card, borderColor: t.cardBorder }, shadows.small]}
                  onPress={() => selectClubType(key)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.typeIconCircle, { backgroundColor: iconColor + '20' }]}>
                    <MaterialCommunityIcons name={icon} size={28} color={iconColor} />
                  </View>
                  <View style={styles.typeInfo}>
                    <Text style={[styles.typeLabel, { color: t.text }]}>{label}</Text>
                    <Text style={[styles.typeDescription, { color: t.textSecondary }]}>{description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={t.textTertiary} />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: t.cancelButton, marginTop: spacing.md }]}
              onPress={() => setTypeSelectVisible(false)}
            >
              <Text style={[styles.buttonText, { color: t.cancelButtonText }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Club Details Form Modal */}
      <Modal visible={formVisible} animationType="slide" transparent
        onRequestClose={() => setFormVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: t.modalOverlay }]}>
          <View style={[styles.modalContent, { backgroundColor: t.modalBackground }]}>
            <Text style={[styles.modalTitle, { color: t.text }]}>
              Add {clubForm.type === CLUB_TYPES.IRON ? 'Iron' :
                   clubForm.type === CLUB_TYPES.WEDGE ? 'Wedge' :
                   clubForm.type === CLUB_TYPES.WOOD ? 'Fairway Wood' :
                   clubForm.type === CLUB_TYPES.HYBRID ? 'Hybrid' :
                   clubForm.type.charAt(0).toUpperCase() + clubForm.type.slice(1)}
            </Text>

            <TextInput style={[styles.input, { borderColor: t.inputBorder, backgroundColor: t.inputBackground, color: t.inputText }]}
              placeholder="Brand (e.g., Titleist, Callaway)" placeholderTextColor={t.placeholder}
              value={clubForm.brand} onChangeText={(v) => setClubForm({ ...clubForm, brand: v })} />
            <TextInput style={[styles.input, { borderColor: t.inputBorder, backgroundColor: t.inputBackground, color: t.inputText }]}
              placeholder="Model (e.g., TSR3, Rogue ST)" placeholderTextColor={t.placeholder}
              value={clubForm.model} onChangeText={(v) => setClubForm({ ...clubForm, model: v })} />

            {(clubForm.type === CLUB_TYPES.WOOD || clubForm.type === CLUB_TYPES.HYBRID || clubForm.type === CLUB_TYPES.IRON) && (
              <TextInput style={[styles.input, { borderColor: t.inputBorder, backgroundColor: t.inputBackground, color: t.inputText }]}
                placeholder={`Number (e.g., ${clubForm.type === CLUB_TYPES.WOOD ? '3, 5' : clubForm.type === CLUB_TYPES.HYBRID ? '3, 4' : '4, 5, 6, 7'})`}
                placeholderTextColor={t.placeholder}
                value={clubForm.number} onChangeText={(v) => setClubForm({ ...clubForm, number: v })}
                keyboardType="numeric" />
            )}

            <TextInput style={[styles.input, { borderColor: t.inputBorder, backgroundColor: t.inputBackground, color: t.inputText }]}
              placeholder="Loft (e.g., 10.5, 21)" placeholderTextColor={t.placeholder}
              value={clubForm.loft} onChangeText={(v) => setClubForm({ ...clubForm, loft: v })}
              keyboardType="decimal-pad" />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.button, { backgroundColor: t.cancelButton }]}
                onPress={() => setFormVisible(false)}>
                <Text style={[styles.buttonText, { color: t.cancelButtonText }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, { backgroundColor: t.primary }]}
                onPress={handleAddClub}>
                <Text style={[styles.buttonText, { color: '#fff' }]}>Add Club</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ClubSection({ title, icon, iconColor, clubs, onRemove, onAdd, singleClub, theme: t }) {
  return (
    <View style={[styles.section, { backgroundColor: t.card, borderColor: t.cardBorder }, shadows.small]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <View style={[styles.sectionIconCircle, { backgroundColor: iconColor + '20' }]}>
            <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
          </View>
          <Text style={[styles.sectionTitle, { color: t.text }]}>{title}</Text>
        </View>
        {(!singleClub || clubs.length === 0) && (
          <TouchableOpacity
            onPress={onAdd}
            style={[styles.addButton, { backgroundColor: t.primaryLight }]}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={20} color={t.primary} />
          </TouchableOpacity>
        )}
      </View>
      {clubs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: t.textTertiary }]}>No clubs added</Text>
        </View>
      ) : (
        clubs.map((club, index) => (
          <View
            key={index}
            style={[
              styles.clubItem,
              { borderTopColor: t.borderLight },
              index === 0 && { borderTopWidth: 1 }
            ]}
          >
            <View style={styles.clubInfo}>
              <Text style={[styles.clubName, { color: t.text }]}>
                {club.number ? `${club.number} - ` : ''}{club.brand} {club.model}
              </Text>
              {club.loft && (
                <Text style={[styles.clubDetails, { color: t.textSecondary }]}>
                  {club.loft}° {club.type ? `• ${club.type}` : ''}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => onRemove(index)}
              style={styles.removeButton}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={24} color={t.dangerText} />
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  headerContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodySmall,
  },
  sectionsContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  section: {
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    ...typography.h5,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.bodySmall,
    fontStyle: 'italic',
  },
  clubItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  clubInfo: { flex: 1 },
  clubName: {
    ...typography.body,
    fontWeight: '500',
    marginBottom: 4,
  },
  clubDetails: {
    ...typography.bodySmall,
  },
  removeButton: {
    padding: spacing.xs,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    ...typography.bodySmall,
    marginBottom: spacing.lg,
  },
  typeOptionsScroll: {
    maxHeight: 400,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  typeIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  typeInfo: { flex: 1 },
  typeLabel: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  typeDescription: {
    ...typography.bodySmall,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: spacing.md,
    ...typography.body,
    marginBottom: spacing.md,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    ...typography.button,
  },
});
