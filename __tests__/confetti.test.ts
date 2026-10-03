import {
  buildConfettiPieces,
  confettiAbsoluteYAt,
  type ConfettiPiece,
} from '@/components/Confetti';

const COLORS = ['#C9973B', '#A47A2A', '#5E87A8', '#6F9E78', '#FFFDF7', '#FBF5E9', '#F4ECDA'];

function uniqueCount(values: number[], decimals = 2): number {
  return new Set(values.map((value) => value.toFixed(decimals))).size;
}

function ySpan(pieces: ConfettiPiece[], timeMs: number): number {
  const ys = pieces.map((piece) => confettiAbsoluteYAt(piece, timeMs));
  return Math.max(...ys) - Math.min(...ys);
}

describe('buildConfettiPieces', () => {
  const small = buildConfettiPieces(3, 'small', 390, 844, COLORS);
  const big = buildConfettiPieces(3, 'big', 390, 844, COLORS);

  it('renders nothing for burst 0', () => {
    expect(buildConfettiPieces(0, 'small', 390, 844, COLORS)).toEqual([]);
  });

  it('keeps piece counts in the 40–70 range and bigger for milestones', () => {
    expect(small.length).toBeGreaterThanOrEqual(40);
    expect(small.length).toBeLessThanOrEqual(70);
    expect(big.length).toBeGreaterThan(small.length);
    expect(big.length).toBeLessThanOrEqual(70);
  });

  it('seeds the upper half instead of one thin top row', () => {
    expect(uniqueCount(small.map((piece) => piece.originX))).toBeGreaterThan(12);
    expect(uniqueCount(small.map((piece) => piece.originY))).toBeGreaterThan(12);

    const ys = small.map((piece) => piece.originY).sort((a, b) => a - b);
    // Upper-half fill: span must cover a large vertical cloud, not ~180px.
    expect(ys[ys.length - 1] - ys[0]).toBeGreaterThan(280);
    expect(ys[0]).toBeLessThan(844 * 0.08);
    expect(ys[ys.length - 1]).toBeGreaterThan(844 * 0.35);
    expect(small.every((piece) => piece.originY <= 844 * 0.52)).toBe(true);
  });

  it('gives pieces independent delay, duration, rotation, and size', () => {
    expect(
      uniqueCount(
        small.map((piece) => piece.delay),
        0
      )
    ).toBeGreaterThan(12);
    // Delays must span most of a second+ so pieces do not start together.
    const delays = small.map((piece) => piece.delay);
    expect(Math.max(...delays) - Math.min(...delays)).toBeGreaterThan(900);
    expect(
      uniqueCount(
        small.map((piece) => piece.duration),
        0
      )
    ).toBeGreaterThan(12);
    const durations = small.map((piece) => piece.duration);
    expect(Math.max(...durations) - Math.min(...durations)).toBeGreaterThan(800);
    expect(
      uniqueCount(
        small.map((piece) => piece.rotateTo),
        0
      )
    ).toBeGreaterThan(12);
    expect(uniqueCount(small.map((piece) => piece.width))).toBeGreaterThan(6);
    expect(uniqueCount(small.map((piece) => piece.height))).toBeGreaterThan(6);
  });

  it('keeps different Y positions at mid-burst frames (not a marching line)', () => {
    for (const timeMs of [0, 400, 900, 1400, 2000]) {
      const ys = small.map((piece) => confettiAbsoluteYAt(piece, timeMs));
      expect(uniqueCount(ys, 0)).toBeGreaterThan(18);
      expect(ySpan(small, timeMs)).toBeGreaterThan(250);

      const sorted = [...ys].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)]!;
      const inTightBand = ys.filter((y) => Math.abs(y - median) < 40).length;
      // A true row packs most pieces into one thin band; a burst must not.
      expect(inTightBand / ys.length).toBeLessThan(0.35);
    }
  });

  it('bursts with horizontal drift and some side spray', () => {
    const centerBand = small.filter(
      (piece) => piece.originX > 390 * 0.2 && piece.originX < 390 * 0.8
    );
    const sideBand = small.filter(
      (piece) => piece.originX <= 390 * 0.22 || piece.originX >= 390 * 0.78
    );
    expect(centerBand.length).toBeGreaterThan(sideBand.length);
    expect(sideBand.length).toBeGreaterThan(0);
    expect(small.some((piece) => Math.abs(piece.sprayX) > 80)).toBe(true);
    expect(uniqueCount(small.map((piece) => piece.sprayX))).toBeGreaterThan(12);
  });

  it('picks colors from the provided theme palette', () => {
    expect(small.every((piece) => COLORS.includes(piece.color))).toBe(true);
    expect(new Set(small.map((piece) => piece.color)).size).toBeGreaterThan(3);
  });

  it('is deterministic for the same burst', () => {
    expect(buildConfettiPieces(3, 'small', 390, 844, COLORS)).toEqual(small);
  });
});
