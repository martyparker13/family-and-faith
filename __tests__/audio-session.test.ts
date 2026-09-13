import { speechAudioModeOptions } from '@/lib/audio-session';

jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
  },
  InterruptionModeIOS: { DuckOthers: 1 },
  InterruptionModeAndroid: { DuckOthers: 2 },
}));

describe('speechAudioModeOptions', () => {
  it('enables background playback', () => {
    const opts = speechAudioModeOptions();
    expect(opts.staysActiveInBackground).toBe(true);
    expect(opts.playsInSilentModeIOS).toBe(true);
  });
});
