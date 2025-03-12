import React, { useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  Appearance,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import { Audio } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';

export default function App() {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [noiseLevel, setNoiseLevel] = useState<string>('Baixo');
  const [dbLevel, setDbLevel] = useState<number>(0);
  const { width, height } = useWindowDimensions();
  const theme = Appearance.getColorScheme();

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      recording.setOnRecordingStatusUpdate(onRecordingStatusUpdate);
    } catch (error) {
      console.error('Erro ao iniciar a gravação:', error);
    }
  };

  const onRecordingStatusUpdate = (status: Audio.RecordingStatus) => {
    if (status.isRecording) {
      calculateNoiseLevel(status);
    }
  };

  const calculateNoiseLevel = async (status: Audio.RecordingStatus) => {
    const averageAmplitude = status.metering;
    if (averageAmplitude !== undefined) {
      if (averageAmplitude < -40) {
        setNoiseLevel('Baixo');
        setDbLevel(30);
      } else if (averageAmplitude >= -40 && averageAmplitude < -20) {
        setNoiseLevel('Médio');
        setDbLevel(60);
        Vibration.vibrate(200);
      } else if (averageAmplitude >= -20) {
        setNoiseLevel('Alto');
        setDbLevel(90);
        Vibration.vibrate(400);
      }
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      await recording?.stopAndUnloadAsync();
    } catch (error) {
      console.error('Erro ao parar a gravação:', error);
    }
  };

  const getNoiseMessage = () => {
    if (noiseLevel === 'Médio' || noiseLevel === 'Alto') {
      return '🔊 Recomendado uso de abafadores para diminuir os estímulos sonoros';
    }
    return '✅ Ambiente seguro';
  };

  return (
    <SafeAreaView
      style={[styles.container, theme === 'dark' ? styles.darkTheme : styles.lightTheme]}
    >
      <Text style={styles.title}>NoiseWatcher</Text>

      <View style={styles.infoBox}>
        <Text style={styles.noiseLevel}>Nível de Ruído: {noiseLevel}</Text>
        <Text style={styles.dbLevel}>dB: {dbLevel} dB</Text>
        <Text style={styles.message}>{getNoiseMessage()}</Text>
      </View>

      <View style={styles.thermometerContainer}>
        <View style={styles.thermometer}>
          <View style={[styles.thermometerFill, { height: `${dbLevel}%` }]} />
        </View>
        <Text style={styles.thermometerText}></Text>
      </View>

      <TouchableOpacity
        style={[styles.micButton, { bottom: height * 0.1 }]}
        onPress={isRecording ? stopRecording : startRecording}
      >
        <MaterialIcons name="mic" size={width * 0.15} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  lightTheme: {
    backgroundColor: '#E3F2FD',
  },
  darkTheme: {
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#0D47A1',
    marginTop: 20,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#ffffff',
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
    width: '85%',
  },
  noiseLevel: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0D47A1',
  },
  dbLevel: {
    fontSize: 20,
    color: '#444',
    marginVertical: 5,
  },
  message: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF7043',
    textAlign: 'center',
    marginTop: 10,
  },
  thermometerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    justifyContent: 'space-evenly',
    width: '100%',
  },
  thermometer: {
    width: 40,
    height: 120,
    backgroundColor: '#ddd',
    borderRadius: 10,
    overflow: 'hidden',
  },
  thermometerFill: {
    width: '100%',
    backgroundColor: '#4CAF50',
  },
  thermometerText: {
    fontSize: 14,
    marginLeft: 10,
    color: '#444',
  },
  micButton: {
    width: 100,
    height: 100,
    backgroundColor: '#FF7043',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
    position: 'absolute',
    right: 30,
  },
});
