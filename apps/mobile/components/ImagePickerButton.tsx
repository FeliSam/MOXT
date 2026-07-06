import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

type Props = {
  onImageSelected: (uri: string) => void;
  label?: string;
  currentUri?: string | null;
};

export function ImagePickerButton({ onImageSelected, label = 'Ajouter une photo', currentUri }: Props) {
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', "L'accès à la galerie est nécessaire pour sélectionner une image.");
      return;
    }

    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Erreur', "Impossible de sélectionner l'image.");
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', "L'accès à la caméra est nécessaire pour prendre une photo.");
      return;
    }

    setLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de prendre la photo.');
    } finally {
      setLoading(false);
    }
  };

  const handlePress = () => {
    Alert.alert('Ajouter une image', 'Choisissez une source', [
      { text: 'Galerie', onPress: pickImage },
      { text: 'Caméra', onPress: takePhoto },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.wrapper}>
      {currentUri ? (
        <View style={styles.preview}>
          <Image source={{ uri: currentUri }} style={styles.previewImage} />
          <Pressable style={styles.changeBtn} onPress={handlePress}>
            <Text style={styles.changeBtnText}>Changer</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable style={styles.button} onPress={handlePress} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#1d4ed8" />
          ) : (
            <>
              <Text style={styles.icon}>📷</Text>
              <Text style={styles.label}>{label}</Text>
            </>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 8 },
  button: {
    borderWidth: 2,
    borderColor: '#bfdbfe',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    gap: 6,
  },
  icon: { fontSize: 28 },
  label: { fontSize: 14, fontWeight: '600', color: '#1d4ed8' },
  preview: { borderRadius: 14, overflow: 'hidden', position: 'relative' },
  previewImage: { width: '100%', height: 180, borderRadius: 14 },
  changeBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  changeBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
