import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  clearBibleCache,
  fetchPassage,
  fetchPassageGroup,
  groupByChapter,
  isPassageCached,
  type PassageText,
} from '@/lib/bible';

const CACHE_KEY = 'ff-bible:genesis 1';

const samplePassage: PassageText = {
  reference: 'Genesis 1',
  verses: [{ book: 'Genesis', chapter: 1, verse: 1, text: 'In the beginning' }],
};

const mockFetch = jest.fn();

beforeEach(async () => {
  await AsyncStorage.clear();
  globalThis.fetch = mockFetch as typeof fetch;
});

describe('fetchPassage', () => {
  it('returns cached passage without calling fetch', async () => {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(samplePassage));
    const result = await fetchPassage('genesis 1');
    expect(result).toEqual(samplePassage);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('deletes corrupt cache and fetches from API', async () => {
    await AsyncStorage.setItem(CACHE_KEY, '{not valid json');
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        reference: 'Genesis 1',
        verses: [{ book_name: 'Genesis', chapter: 1, verse: 1, text: 'In the beginning' }],
      }),
    });

    const result = await fetchPassage('genesis 1');
    expect(result.reference).toBe('Genesis 1');
    expect(await AsyncStorage.getItem(CACHE_KEY)).not.toBe('{not valid json');
    expect(mockFetch).toHaveBeenCalled();
  });

  it('deletes cache with invalid shape and fetches from API', async () => {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ reference: 'Genesis 1' }));
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        reference: 'Genesis 1',
        verses: [{ book_name: 'Genesis', chapter: 1, verse: 1, text: 'Hello' }],
      }),
    });

    await fetchPassage('genesis 1');
    expect(mockFetch).toHaveBeenCalled();
  });

  it('throws on non-OK response', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });
    await expect(fetchPassage('genesis 1')).rejects.toThrow('500');
  });

  it('throws on invalid API response shape', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ reference: 'Genesis 1' }),
    });
    await expect(fetchPassage('genesis 1')).rejects.toThrow('unexpected response');
  });

  it('passes an AbortSignal to fetch for timeout support', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        reference: 'Genesis 1',
        verses: [{ book_name: 'Genesis', chapter: 1, verse: 1, text: 'Hello' }],
      }),
    });

    await fetchPassage('genesis 1');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('bible-api.com'),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it('caches successful API responses', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        reference: 'Genesis 1',
        verses: [{ book_name: 'Genesis', chapter: 1, verse: 1, text: '  In   the beginning  ' }],
      }),
    });

    const result = await fetchPassage('genesis 1');
    expect(result.verses[0].text).toBe('In the beginning');
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    expect(cached).toContain('Genesis 1');
  });
});

describe('isPassageCached', () => {
  it('is false when nothing cached', async () => {
    expect(await isPassageCached('genesis 1')).toBe(false);
  });

  it('is false when cache is corrupt', async () => {
    await AsyncStorage.setItem(CACHE_KEY, 'bad');
    expect(await isPassageCached('genesis 1')).toBe(false);
  });

  it('is true when valid cache exists', async () => {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(samplePassage));
    expect(await isPassageCached('genesis 1')).toBe(true);
  });
});

describe('fetchPassageGroup', () => {
  it('merges multiple chapter fetches', async () => {
    await AsyncStorage.setItem('ff-bible:genesis 1', JSON.stringify(samplePassage));
    await AsyncStorage.setItem(
      'ff-bible:genesis 2',
      JSON.stringify({
        reference: 'Genesis 2',
        verses: [{ book: 'Genesis', chapter: 2, verse: 1, text: 'Day two' }],
      })
    );

    const merged = await fetchPassageGroup('Genesis 1-2', ['genesis 1', 'genesis 2']);
    expect(merged.reference).toBe('Genesis 1-2');
    expect(merged.verses).toHaveLength(2);
  });
});

describe('groupByChapter', () => {
  it('groups verses by book and chapter', () => {
    const groups = groupByChapter({
      reference: 'Genesis 1-2',
      verses: [
        { book: 'Genesis', chapter: 1, verse: 1, text: 'a' },
        { book: 'Genesis', chapter: 1, verse: 2, text: 'b' },
        { book: 'Genesis', chapter: 2, verse: 1, text: 'c' },
      ],
    });
    expect(groups).toHaveLength(2);
    expect(groups[0].verses).toHaveLength(2);
    expect(groups[1].verses).toHaveLength(1);
  });
});

describe('clearBibleCache', () => {
  it('removes all bible cache keys', async () => {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(samplePassage));
    await AsyncStorage.setItem('ff-settings', 'keep');
    const removed = await clearBibleCache();
    expect(removed).toBe(1);
    expect(await AsyncStorage.getItem(CACHE_KEY)).toBeNull();
    expect(await AsyncStorage.getItem('ff-settings')).toBe('keep');
  });
});
