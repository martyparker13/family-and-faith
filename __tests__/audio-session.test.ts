import { speechAudioModeOptions } from '@/lib/audio-session';

jest.mock('expo-audio', () => ({
  setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
}));

describe('speechAudioModeOptions', () => {
  it('enables background playback', () => {
    const opts = speechAudioModeOptions();
    expect(opts.shouldPlayInBackground).toBe(true);
    expect(opts.playsInSilentMode).toBe(true);
    expect(opts.interruptionMode).toBe('duckOthers');
  });
});
