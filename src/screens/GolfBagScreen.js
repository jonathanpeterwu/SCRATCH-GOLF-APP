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

const CLUB_TYPES = {
  DRIVER: 'driver',
  WOOD: 'woods',
  HYBRID: 'hybrids',
  IRON: 'irons',
  WEDGE: 'wedges',
  PUTTER: 'putter',
};

export default function GolfBagScreen() {
  const { golfBag, addClub, removeClub, setGolfBag } = useAppStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [clubForm, setClubForm] = useState({
    type: CLUB_TYPES.DRIVER,
    brand: '',
    model: '',
    number: '',
    loft: '',
  });

  const handleAddClub = async () => {
    if (!clubForm.brand || !clubForm.model) {
      Alert.alert('Required Fields', 'Please enter brand and model');
      return;
    }

    addClub(clubForm.type, {
      brand: clubForm.brand,
      model: clubForm.model,
      number: clubForm.number,
      loft: clubForm.loft,
      type: clubForm.type === CLUB_TYPES.WEDGE ? getWedgeType(clubForm.loft) : undefined,
    });

    // Save to storage
    const updatedBag = useAppStore.getState().golfBag;
    await saveToStorage('GOLF_BAG', updatedBag);

    // Reset form and close modal
    setClubForm({
      type: CLUB_TYPES.DRIVER,
      brand: '',
      model: '',
      number: '',
      loft: '',
    });
    setModalVisible(false);
  };

  const handleRemoveClub = async (type, index) => {
    Alert.alert(
      'Remove Club',
      'Are you sure you want to remove this club?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            removeClub(type, index);
            const updatedBag = useAppStore.getState().golfBag;
            await saveToStorage('GOLF_BAG', updatedBag);
          },
        },
      ]
    );
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
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Golf Bag</Text>
          <Text style={styles.subtitle}>
            Add your clubs to get personalized coaching
          </Text>
        </View>

        {/* Driver */}
        <ClubSection
          title="Driver"
          clubs={golfBag.driver ? [golfBag.driver] : []}
          onRemove={() => handleRemoveClub(CLUB_TYPES.DRIVER, 0)}
          onAdd={() => {
            setClubForm({ ...clubForm, type: CLUB_TYPES.DRIVER });
            setModalVisible(true);
          }}
          singleClub
        />

        {/* Woods */}
        <ClubSection
          title="Fairway Woods"
          clubs={golfBag.woods || []}
          onRemove={(index) => handleRemoveClub(CLUB_TYPES.WOOD, index)}
          onAdd={() => {
            setClubForm({ ...clubForm, type: CLUB_TYPES.WOOD });
            setModalVisible(true);
          }}
        />

        {/* Hybrids */}
        <ClubSection
          title="Hybrids"
          clubs={golfBag.hybrids || []}
          onRemove={(index) => handleRemoveClub(CLUB_TYPES.HYBRID, index)}
          onAdd={() => {
            setClubForm({ ...clubForm, type: CLUB_TYPES.HYBRID });
            setModalVisible(true);
          }}
        />

        {/* Irons */}
        <ClubSection
          title="Irons"
          clubs={golfBag.irons || []}
          onRemove={(index) => handleRemoveClub(CLUB_TYPES.IRON, index)}
          onAdd={() => {
            setClubForm({ ...clubForm, type: CLUB_TYPES.IRON });
            setModalVisible(true);
          }}
        />

        {/* Wedges */}
        <ClubSection
          title="Wedges"
          clubs={golfBag.wedges || []}
          onRemove={(index) => handleRemoveClub(CLUB_TYPES.WEDGE, index)}
          onAdd={() => {
            setClubForm({ ...clubForm, type: CLUB_TYPES.WEDGE });
            setModalVisible(true);
          }}
        />

        {/* Putter */}
        <ClubSection
          title="Putter"
          clubs={golfBag.putter ? [golfBag.putter] : []}
          onRemove={() => handleRemoveClub(CLUB_TYPES.PUTTER, 0)}
          onAdd={() => {
            setClubForm({ ...clubForm, type: CLUB_TYPES.PUTTER });
            setModalVisible(true);
          }}
          singleClub
        />
      </ScrollView>

      {/* Add Club Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Add {clubForm.type === CLUB_TYPES.IRON ? 'Iron' :
                   clubForm.type === CLUB_TYPES.WEDGE ? 'Wedge' :
                   clubForm.type === CLUB_TYPES.WOOD ? 'Fairway Wood' :
                   clubForm.type === CLUB_TYPES.HYBRID ? 'Hybrid' :
                   clubForm.type.charAt(0).toUpperCase() + clubForm.type.slice(1)}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Brand (e.g., Titleist, Callaway)"
              value={clubForm.brand}
              onChangeText={(text) => setClubForm({ ...clubForm, brand: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Model (e.g., TSR3, Rogue ST)"
              value={clubForm.model}
              onChangeText={(text) => setClubForm({ ...clubForm, model: text })}
            />

            {(clubForm.type === CLUB_TYPES.WOOD ||
              clubForm.type === CLUB_TYPES.HYBRID ||
              clubForm.type === CLUB_TYPES.IRON) && (
              <TextInput
                style={styles.input}
                placeholder={`Number (e.g., ${clubForm.type === CLUB_TYPES.WOOD ? '3, 5' : clubForm.type === CLUB_TYPES.HYBRID ? '3, 4' : '4, 5, 6, 7'})`}
                value={clubForm.number}
                onChangeText={(text) => setClubForm({ ...clubForm, number: text })}
                keyboardType="numeric"
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="Loft (e.g., 10.5, 21)"
              value={clubForm.loft}
              onChangeText={(text) => setClubForm({ ...clubForm, loft: text })}
              keyboardType="decimal-pad"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.addButton]}
                onPress={handleAddClub}
              >
                <Text style={styles.addButtonText}>Add Club</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ClubSection({ title, clubs, onRemove, onAdd, singleClub }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {(!singleClub || clubs.length === 0) && (
          <TouchableOpacity onPress={onAdd} style={styles.addIcon}>
            <Text style={styles.addIconText}>+</Text>
          </TouchableOpacity>
        )}
      </View>

      {clubs.length === 0 ? (
        <Text style={styles.emptyText}>No clubs added</Text>
      ) : (
        clubs.map((club, index) => (
          <View key={index} style={styles.clubItem}>
            <View style={styles.clubInfo}>
              <Text style={styles.clubName}>
                {club.number ? `${club.number} - ` : ''}{club.brand} {club.model}
              </Text>
              {club.loft && (
                <Text style={styles.clubDetails}>
                  {club.loft}° {club.type ? `(${club.type})` : ''}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={() => onRemove(index)}>
              <Text style={styles.removeButton}>✕</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  addIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2e7d32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIconText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
  },
  clubItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  clubInfo: {
    flex: 1,
  },
  clubName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  clubDetails: {
    fontSize: 14,
    color: '#666',
  },
  removeButton: {
    fontSize: 24,
    color: '#d32f2f',
    padding: 8,
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#2e7d32',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
