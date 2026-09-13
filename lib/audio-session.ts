/**
 * Audio session configuration so read-aloud (expo-speech) continues in background.
 */
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

export interface SpeechAudioModeOptions {
  staysActiveInBackground: boolean;
  playsInSilentModeIOS: boolean;
  shouldDuckAndroid: boolean;
  playThroughEarpieceAndroid: boolean;
  interruptionModeIOS: InterruptionModeIOS;
  interruptionModeAndroid: InterruptionModeAndroid;
}

/** Defaults used when configuring speech / narration audio. */
export function speechAudioModeOptions(): SpeechAudioModeOptions {
  return {
    staysActiveInBackground: true,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
    interruptionModeIOS: InterruptionModeIOS.DuckOthers,
    interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
  };
}

/** Configure device audio session for background read-aloud. */
export async function configureSpeechAudioSession(): Promise<void> {
  await Audio.setAudioModeAsync(speechAudioModeOptions());
}
