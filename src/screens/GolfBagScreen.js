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
import { useAppStore } from '../store/appStore';
import { saveToStorage } from '../services/storage';
import { useTheme } from '../theme';

const CLUB_TYPES = {
  DRIVER: 'driver',
  WOOD: 'woods',
  HYBRID: 'hybrids',
  IRON: 'irons',
  WEDGE: 'wedges',
  PUTTER: 'putter',
};

const CLUB_TYPE_OPTIONS = [
  { key: CLUB_TYPES.DRIVER, label: 'Driver', emoji: '🏌️', description: 'Your longest club off the tee' },
  { key: CLUB_TYPES.WOOD, label: 'Fairway Wood', emoji: '🌲', description: '3-wood, 5-wood, etc.' },
  { key: CLUB_TYPES.HYBRID, label: 'Hybrid', emoji: '⚡', description: 'Long iron replacement' },
  { key: CLUB_TYPES.IRON, label: 'Iron', emoji: '🔨', description: '3-9 irons' },
  { key: CLUB_TYPES.WEDGE, label: 'Wedge', emoji: '🎯', description: 'PW, GW, SW, LW' },
  { key: CLUB_TYPES.PUTTER, label: 'Putter', emoji: '⛳', description: 'Your flat stick' },
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
      <ScrollView style={styles.scrollView}>
        <View style={[styles.header, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
          <Text style={[styles.title, { color: t.primary }]}>My Golf Bag</Text>
          <Text style={[styles.subtitle, { color: t.textSecondary }]}>
            Add your clubs to get personalized coaching
          </Text>
        </View>

        <ClubSection title="Driver" clubs={golfBag.driver ? [golfBag.driver] : []}
          onRemove={() => handleRemoveClub(CLUB_TYPES.DRIVER, 0)}
          onAdd={() => openAddClub(CLUB_TYPES.DRIVER)}
          singleClub theme={t} />
        <ClubSection title="Fairway Woods" clubs={golfBag.woods || []}
          onRemove={(i) => handleRemoveClub(CLUB_TYPES.WOOD, i)}
          onAdd={() => openAddClub(CLUB_TYPES.WOOD)}
          theme={t} />
        <ClubSection title="Hybrids" clubs={golfBag.hybrids || []}
          onRemove={(i) => handleRemoveClub(CLUB_TYPES.HYBRID, i)}
          onAdd={() => openAddClub(CLUB_TYPES.HYBRID)}
          theme={t} />
        <ClubSection title="Irons" clubs={golfBag.irons || []}
          onRemove={(i) => handleRemoveClub(CLUB_TYPES.IRON, i)}
          onAdd={() => openAddClub(CLUB_TYPES.IRON)}
          theme={t} />
        <ClubSection title="Wedges" clubs={golfBag.wedges || []}
          onRemove={(i) => handleRemoveClub(CLUB_TYPES.WEDGE, i)}
          onAdd={() => openAddClub(CLUB_TYPES.WEDGE)}
          theme={t} />
        <ClubSection title="Putter" clubs={golfBag.putter ? [golfBag.putter] : []}
          onRemove={() => handleRemoveClub(CLUB_TYPES.PUTTER, 0)}
          onAdd={() => openAddClub(CLUB_TYPES.PUTTER)}
          singleClub theme={t} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: t.primary }]}
        onPress={() => openAddClub()}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Club Type Selection Modal */}
      <Modal visible={typeSelectVisible} animationType="slide" transparent
        onRequestClose={() => setTypeSelectVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: t.modalOverlay }]}>
          <View style={[styles.modalContent, { backgroundColor: t.modalBackground }]}>
            <Text style={[styles.modalTitle, { color: t.text }]}>Select Club Type</Text>
            <Text style={[styles.modalSubtitle, { color: t.textSecondary }]}>
              What type of club do you want to add?
            </Text>

            {CLUB_TYPE_OPTIONS.map(({ key, label, emoji, description }) => (
              <TouchableOpacity
                key={key}
                style={[styles.typeOption, { backgroundColor: t.surface, borderColor: t.border }]}
                onPress={() => selectClubType(key)}>
                <Text style={styles.typeEmoji}>{emoji}</Text>
                <View style={styles.typeInfo}>
                  <Text style={[styles.typeLabel, { color: t.text }]}>{label}</Text>
                  <Text style={[styles.typeDescription, { color: t.textSecondary }]}>{description}</Text>
                </View>
                <Text style={[styles.typeChevron, { color: t.textTertiary }]}>›</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.button, { backgroundColor: t.cancelButton, marginTop: 8 }]}
              onPress={() => setTypeSelectVisible(false)}>
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

function ClubSection({ title, clubs, onRemove, onAdd, singleClub, theme: t }) {
  return (
    <View style={[styles.section, { backgroundColor: t.surface }]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: t.text }]}>{title}</Text>
        {(!singleClub || clubs.length === 0) && (
          <TouchableOpacity onPress={onAdd} style={[styles.addIcon, { backgroundColor: t.primary }]}>
            <Text style={styles.addIconText}>+</Text>
          </TouchableOpacity>
        )}
      </View>
      {clubs.length === 0 ? (
        <Text style={[styles.emptyText, { color: t.textTertiary }]}>No clubs added</Text>
      ) : (
        clubs.map((club, index) => (
          <View key={index} style={[styles.clubItem, { borderBottomColor: t.borderLight }]}>
            <View style={styles.clubInfo}>
              <Text style={[styles.clubName, { color: t.text }]}>
                {club.number ? `${club.number} - ` : ''}{club.brand} {club.model}
              </Text>
              {club.loft && (
                <Text style={[styles.clubDetails, { color: t.textSecondary }]}>
                  {club.loft}° {club.type ? `(${club.type})` : ''}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={() => onRemove(index)}>
              <Text style={[styles.removeBtn, { color: t.dangerText }]}>✕</Text>
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
  header: { padding: 20, borderBottomWidth: 1 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 14 },
  section: { marginTop: 12, padding: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  addIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  addIconText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  emptyText: { fontStyle: 'italic' },
  clubItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  clubInfo: { flex: 1 },
  clubName: { fontSize: 16, fontWeight: '500', marginBottom: 4 },
  clubDetails: { fontSize: 14 },
  removeBtn: { fontSize: 24, padding: 8 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabIcon: { color: '#fff', fontSize: 32, fontWeight: '300' },
  modalOverlay: { flex: 1, justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 12, padding: 24, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  modalSubtitle: { fontSize: 14, marginBottom: 20 },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  typeEmoji: { fontSize: 32, marginRight: 12 },
  typeInfo: { flex: 1 },
  typeLabel: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  typeDescription: { fontSize: 13 },
  typeChevron: { fontSize: 28, marginLeft: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 12 },
  modalButtons: { flexDirection: 'row', marginTop: 12, gap: 12 },
  button: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: '600' },
});
