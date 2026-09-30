/**
 * Audio session configuration so read-aloud (expo-speech) continues in background.
 */
import { setAudioModeAsync, type AudioMode } from 'expo-audio';

export type SpeechAudioModeOptions = Pick<
  AudioMode,
  | 'shouldPlayInBackground'
  | 'playsInSilentMode'
  | 'interruptionMode'
  | 'shouldRouteThroughEarpiece'
>;

/** Defaults used when configuring speech / narration audio. */
export function speechAudioModeOptions(): SpeechAudioModeOptions {
  return {
    shouldPlayInBackground: true,
    playsInSilentMode: true,
    interruptionMode: 'duckOthers',
    shouldRouteThroughEarpiece: false,
  };
}

/** Configure device audio session for background read-aloud. */
export async function configureSpeechAudioSession(): Promise<void> {
  await setAudioModeAsync(speechAudioModeOptions());
}
