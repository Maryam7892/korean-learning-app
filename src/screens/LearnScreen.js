import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import alphabetData from '../../data/korean_alphabets.json';

const LearnScreen = () => {
  const [index, setIndex] = useState(0);
  const alphabet = alphabetData[index];

  const playSound = async () => {
    const { sound } = await Audio.Sound.createAsync(
      require(`../../assets/audio/${alphabet.audio}`)
    );
    await sound.playAsync();
  };

  const handleNext = () => {
    if (index < alphabetData.length - 1) {
      setIndex(index + 1);
    }
  };

  const handlePrevious = () => {
    if (index > 0) {
      setIndex(index - 1);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.english}>{alphabet.english.toUpperCase()}</Text>
      <Text style={styles.hangul}>{alphabet.hangul}</Text>
      <Text style={styles.type}>{alphabet.type}</Text>
      <TouchableOpacity style={styles.audioButton} onPress={playSound}>
        <Text style={styles.audioText}>🔊 Play Sound</Text>
      </TouchableOpacity>
      <View style={styles.navigation}>
        <Button title="Previous" onPress={handlePrevious} disabled={index === 0} />
        <Button title="Next" onPress={handleNext} disabled={index === alphabetData.length - 1} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  english: {
    fontSize: 48,
    color: '#555',
  },
  hangul: {
    fontSize: 72,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  type: {
    fontSize: 24,
    color: '#999',
    marginBottom: 20,
  },
  audioButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 10,
    marginVertical: 20,
  },
  audioText: {
    color: '#fff',
    fontSize: 18,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
  },
});

export default LearnScreen;