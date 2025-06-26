import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, TextInput, Image, Button, Alert, StyleSheet, Text } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

type Photo = {
  id: string;
  uri: string;
  createdAt: string;
  caption: string;
  favorite?: boolean;
};

export default function PhotoDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [caption, setCaption] = useState('');
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('photos');
      const photos: Photo[] = stored ? JSON.parse(stored) : [];
      const found = photos.find(p => p.id === id);
      if (found) {
        setPhoto(found);
        setCaption(found.caption);
      }
    })();
  }, [id]);

  const saveCaption = async () => {
    if (!photo) return;
    try {
      const stored = await AsyncStorage.getItem('photos');
      const photos: Photo[] = stored ? JSON.parse(stored) : [];

      const updatedPhotos = photos.map(p =>
        p.id === photo.id ? { ...p, caption } : p
      );

      await AsyncStorage.setItem('photos', JSON.stringify(updatedPhotos));
      Alert.alert('Saved', 'Caption updated.', [
  {
    text: 'OK',
    onPress: () => router.push('/gallery'), // redirect after OK
  },
]);
    } catch (err) {
      console.error('Failed to save caption:', err);
    }
  };

  const toggleFavorite = async () => {
    if (!photo) return;
    try {
      const stored = await AsyncStorage.getItem('photos');
      const photos: Photo[] = stored ? JSON.parse(stored) : [];

      const updatedPhotos = photos.map(p =>
        p.id === photo.id ? { ...p, favorite: !p.favorite } : p
      );

      await AsyncStorage.setItem('photos', JSON.stringify(updatedPhotos));
      setPhoto({ ...photo, favorite: !photo.favorite });
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const deletePhoto = async () => {
    if (!photo) return;
    try {
      await FileSystem.deleteAsync(photo.uri, { idempotent: true });

      const stored = await AsyncStorage.getItem('photos');
      const photos: Photo[] = stored ? JSON.parse(stored) : [];
      const updatedPhotos = photos.filter(p => p.id !== photo.id);

      await AsyncStorage.setItem('photos', JSON.stringify(updatedPhotos));
      Alert.alert('Deleted', 'Photo removed.');
      router.back();
    } catch (err) {
      console.error('Failed to delete photo:', err);
    }
  };

  if (!photo) {
    return (
      <View style={styles.center}>
        <Text>Loading photo...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: photo.uri }}
        style={[styles.image, { transform: [{ rotate: `${rotation}deg` }] }]}
        resizeMode="contain"
      />
      <TextInput
        placeholder="Add a caption..."
        value={caption}
        onChangeText={setCaption}
        style={styles.input}
      />
      <View style={styles.buttons}>
        <View style={styles.buttonWrapper}>
          <Button title="Save Caption" onPress={saveCaption} />
        </View>
        <View style={styles.buttonWrapper}>
          <Button title="Rotate" onPress={() => setRotation(r => r + 90)} />
        </View>
        <View style={styles.buttonWrapper}>
          <Button
            title={photo.favorite ? 'Unfavorite ❤️' : 'Add to Favorites 🤍'}
            onPress={toggleFavorite}
          />
        </View>
        <View style={styles.buttonWrapper}>
          <Button title="Delete Photo" color="red" onPress={deletePhoto} />
        </View>
        <View style={styles.buttonWrapper}>
          <Button title="← Back to Gallery" onPress={() => router.back()} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  image: { width: '100%', height: 300, borderRadius: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginVertical: 12,
  },
  buttons: {
    // No gap here because React Native doesn't support gap
  },
  buttonWrapper: {
    marginBottom: 10,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
