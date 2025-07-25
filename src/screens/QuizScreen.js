import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Button, StyleSheet, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import alphabetData from '../../data/korean_alphabets.json';
import { Audio } from 'expo-av';

const getRandomOptions = (correctItem, allItems) => {
  const options = [correctItem];
  while (options.length < 4) {
    const randomItem = allItems[Math.floor(Math.random() * allItems.length)];
    if (!options.some(opt => opt.english === randomItem.english)) {
      options.push(randomItem);
    }
  }
  return options.sort(() => Math.random() - 0.5);
};

const motivationalQuotes = [
  "Mistakes are proof you are trying!",
  "Practice makes progress.",
  "You're one step closer to fluency!",
  "Learning is winning!"
];

const QuizScreen = () => {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [retryMode, setRetryMode] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedbackColor, setFeedbackColor] = useState({});
  const [quote, setQuote] = useState("");
  const [sound, setSound] = useState();

  useEffect(() => {
    const shuffled = [...alphabetData].sort(() => Math.random() - 0.5).slice(0, 10);
    setQuestions(shuffled);
    setOptions(getRandomOptions(shuffled[0], alphabetData));
  }, []);

  useEffect(() => {
    if (questions.length > 0) {
      playAudio(questions[current].audio);
    }
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [current, questions]);

  const playAudio = async (audioFile) => {
    try {
      const { sound: playbackObj } = await Audio.Sound.createAsync(
        require(`../../assets/audio/${audioFile}`)
      );
      setSound(playbackObj);
      await playbackObj.playAsync();
    } catch (e) {
      console.warn("Audio playback error or missing file:", audioFile);
    }
  };

  const handleAnswer = async (selected) => {
    if (selectedAnswer) return; // prevent double click

    setSelectedAnswer(selected);
    const correct = questions[current].english;
    const isCorrect = selected === correct;
    const newColor = {};
    options.forEach(opt => {
      newColor[opt.english] = opt.english === correct ? '#4CAF50' : (opt.english === selected ? '#F44336' : '#eee');
    });
    setFeedbackColor(newColor);

    if (isCorrect) {
      setScore(prev => prev + 10);
      await updateProfileScore(10);
    } else {
      setScore(prev => prev - 10);
      setMistakes(prev => [...prev, questions[current]]);
      await updateProfileScore(-10);
    }

    setTimeout(() => {
      setSelectedAnswer(null);
      setFeedbackColor({});
      if (current < questions.length - 1) {
        const next = current + 1;
        setCurrent(next);
        setOptions(getRandomOptions(questions[next], alphabetData));
      } else {
        saveQuizHistory();
        setQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
        setShowResults(true);
      }
    }, 1000);
  };

  const updateProfileScore = async (points) => {
    try {
      const stored = await AsyncStorage.getItem('userScore');
      const currentScore = stored ? parseInt(stored, 10) : 0;
      await AsyncStorage.setItem('userScore', (currentScore + points).toString());
    } catch (e) {
      console.error('Failed to update profile score:', e);
    }
  };

  const saveQuizHistory = async () => {
    try {
      const historyEntry = {
        timestamp: new Date().toISOString(),
        score,
        correct: (questions.length - mistakes.length),
        incorrect: mistakes.length
      };
      const historyData = await AsyncStorage.getItem('quizHistory');
      const history = historyData ? JSON.parse(historyData) : [];
      history.unshift(historyEntry);
      await AsyncStorage.setItem('quizHistory', JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save quiz history:', e);
    }
  };

  const handleRetryMistakes = () => {
    setQuestions(mistakes);
    setCurrent(0);
    setScore(0);
    setMistakes([]);
    setShowResults(false);
    setRetryMode(true);
    setOptions(getRandomOptions(mistakes[0], alphabetData));
  };

  if (!questions.length) return <Text>Loading...</Text>;

  if (showResults) {
    return (
      <View style={styles.container}>
        <Text style={styles.resultTitle}>Quiz Complete!</Text>
        <Text style={styles.resultScore}>Score: {score}</Text>
        <Text style={styles.quote}>“{quote}”</Text>
        {mistakes.length > 0 && (
          <Button title="Retry Mistakes" onPress={handleRetryMistakes} />
        )}
      </View>
    );
  }

  const progressPercent = ((current + 1) / questions.length) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
      </View>
      <Text style={styles.question}>{questions[current].hangul}</Text>
      {options.map((opt, idx) => (
        <TouchableOpacity
          key={idx}
          style={[styles.option, { backgroundColor: feedbackColor[opt.english] || '#eee' }]}
          onPress={() => handleAnswer(opt.english)}
          disabled={!!selectedAnswer}
        >
          <Text style={styles.optionText}>{opt.english}</Text>
        </TouchableOpacity>
      ))}
      <Text style={styles.score}>Current Score: {score}</Text>
      <Text style={styles.progress}>Question {current + 1} / {questions.length}</Text>
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
  question: {
    fontSize: 64,
    marginVertical: 20,
  },
  option: {
    backgroundColor: '#eee',
    padding: 15,
    borderRadius: 8,
    marginVertical: 8,
    width: '80%',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 20,
  },
  score: {
    fontSize: 18,
    marginTop: 20,
    color: '#444',
  },
  progress: {
    fontSize: 16,
    color: '#888',
    marginTop: 5,
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultScore: {
    fontSize: 24,
    marginBottom: 10,
  },
  quote: {
    fontSize: 18,
    fontStyle: 'italic',
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
  },
  progressBarContainer: {
    height: 8,
    width: '100%',
    backgroundColor: '#ddd',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#4CAF50',
  },
});

export default QuizScreen;
