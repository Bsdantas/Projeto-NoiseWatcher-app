import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Button } from 'react-native';
import { Audio } from 'expo-av';

export default function App() {
  const [sound, setSound] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [noiseLevel, setNoiseLevel] = useState<string>('Baixo');
  const [dbLevel, setDbLevel] = useState<number>(0);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);

  // Função para iniciar a gravação
  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync(); // Pede permissão para usar o microfone
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      console.log('Iniciando gravação...');
      recording.setOnRecordingStatusUpdate(onRecordingStatusUpdate);
    } catch (error) {
      console.error('Erro ao iniciar a gravação:', error);
    }
  };

  // Função de callback para atualizar status durante a gravação
  const onRecordingStatusUpdate = (status: Audio.RecordingStatus) => {
    if (status.isRecording) {
      // Atualiza a duração da gravação
      setRecordingDuration(status.durationMillis! / 1000);
      calculateNoiseLevel(status); // Chama a função para calcular o nível de ruído
    }
  };

  // Função para calcular o nível de ruído baseado na amplitude do áudio
  const calculateNoiseLevel = async (status: Audio.RecordingStatus) => {
    // A intensidade do som pode ser medida pela amplitude (não é um cálculo exato de decibéis)
    const averageAmplitude = status.metering;

    // Define o nível de ruído e o nível dB aproximado com base na amplitude
    if (averageAmplitude !== undefined) {
      if (averageAmplitude < -40) {
        setNoiseLevel('Baixo');
        setDbLevel(30); // Exemplo: baixo nível de som
      } else if (averageAmplitude >= -40 && averageAmplitude < -20) {
        setNoiseLevel('Médio');
        setDbLevel(60); // Exemplo: nível moderado de som
      } else if (averageAmplitude >= -20) {
        setNoiseLevel('Alto');
        setDbLevel(90); // Exemplo: nível alto de som
      }
    }
  };

  // Função para parar a gravação
  const stopRecording = async () => {
    try {
      setIsRecording(false);
      await recording?.stopAndUnloadAsync();
      const uri = recording?.getURI();
      console.log('Gravação salva em:', uri);
      if (uri) {
        setSound(uri);
      }
    } catch (error) {
      console.error('Erro ao parar a gravação:', error);
    }
  };

  // Função para obter a mensagem com base no nível de ruído
  const getNoiseMessage = () => {
    if (noiseLevel === 'Médio') {
      return 'Recomendado usar abafadores ou fones antiruído';
    } else if (noiseLevel === 'Alto') {
      return 'Volume muito alto, use abafadores ou fones antiruído';
    } else if (noiseLevel === 'Muito alto') {
      return 'Volume muito alto com risco de sobrecarga sensorial, procure um local mais calmo';
    }
    return '';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>NoiseWatcher</Text>
      <Text style={styles.info}>
        {isRecording ? `Gravando... Duração: ${Math.floor(recordingDuration)}s` : 'Pressione o botão para começar a gravar.'}
      </Text>
      <Button
        title={isRecording ? 'Parar Gravação' : 'Iniciar Gravação'}
        onPress={isRecording ? stopRecording : startRecording}
      />
      {sound && <Text style={styles.uri}>Gravação salva em: {sound}</Text>}
      <Text style={styles.noiseLevel}>Nível de Ruído: {noiseLevel}</Text>
      <Text style={styles.dbLevel}>dB: {dbLevel} dB</Text>
      <View style={[styles.thermometer, { height: `${dbLevel / 100 * 100}%` }]}></View>
      <Text style={styles.message}>{getNoiseMessage()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  info: {
    marginVertical: 10,
    fontSize: 16,
  },
  uri: {
    marginTop: 10,
    fontSize: 12,
    color: 'gray',
  },
  noiseLevel: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: 'bold',
  },
  dbLevel: {
    marginTop: 10,
    fontSize: 18,
  },
  thermometer: {
    width: 20,
    backgroundColor: 'green',
    borderRadius: 10,
    marginVertical: 20,
    transition: 'height 0.3s ease',  // animação suave para o medidor
  },
  message: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
