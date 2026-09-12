import AsyncStorage from '@react-native-async-storage/async-storage';

import { prefetchDays } from '@/lib/prefetch';

jest.mock('@/lib/bible', () => ({
  isPassageCached: jest.fn(),
  fetchPassage: jest.fn(),
}));

import { fetchPassage, isPassageCached } from '@/lib/bible';

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe('prefetchDays', () => {
  it('reports complete when all chapters succeed', async () => {
    (isPassageCached as jest.Mock).mockResolvedValue(true);

    const result = await prefetchDays(1, 1);
    expect(result.complete).toBe(true);
    expect(result.failed).toBe(0);
    expect(result.done).toBe(result.total);
  });

  it('reports partial failure when a chapter fetch fails', async () => {
    (isPassageCached as jest.Mock)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    (fetchPassage as jest.Mock).mockRejectedValueOnce(new Error('network'));

    const result = await prefetchDays(1, 1);
    expect(result.complete).toBe(false);
    expect(result.failed).toBeGreaterThan(0);
    expect(result.done).toBe(result.total);
  });
});
