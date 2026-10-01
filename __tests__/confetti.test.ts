import { buildConfettiPieces } from '@/components/Confetti';

const COLORS = ['#C9973B', '#A47A2A', '#5E87A8', '#6F9E78', '#FFFDF7', '#FBF5E9', '#F4ECDA'];

function uniqueCount(values: number[], decimals = 2): number {
  return new Set(values.map((value) => value.toFixed(decimals))).size;
}

describe('buildConfettiPieces', () => {
  const small = buildConfettiPieces(3, 'small', 390, 844, COLORS);
  const big = buildConfettiPieces(3, 'big', 390, 844, COLORS);

  it('renders nothing for burst 0', () => {
    expect(buildConfettiPieces(0, 'small', 390, 844, COLORS)).toEqual([]);
  });

  it('keeps piece counts in the 40–80 range and bigger for milestones', () => {
    expect(small.length).toBeGreaterThanOrEqual(40);
    expect(small.length).toBeLessThanOrEqual(80);
    expect(big.length).toBeGreaterThan(small.length);
    expect(big.length).toBeLessThanOrEqual(80);
  });

  it('scatters origins instead of lining up in one row', () => {
    expect(uniqueCount(small.map((piece) => piece.originX))).toBeGreaterThan(12);
    expect(uniqueCount(small.map((piece) => piece.originY))).toBeGreaterThan(12);

    const ys = small.map((piece) => piece.originY).sort((a, b) => a - b);
    expect(ys[ys.length - 1] - ys[0]).toBeGreaterThan(80);
  });

  it('gives pieces independent delay, duration, rotation, and size', () => {
    expect(
      uniqueCount(
        small.map((piece) => piece.delay),
        0
      )
    ).toBeGreaterThan(12);
    expect(
      uniqueCount(
        small.map((piece) => piece.duration),
        0
      )
    ).toBeGreaterThan(12);
    expect(
      uniqueCount(
        small.map((piece) => piece.rotateTo),
        0
      )
    ).toBeGreaterThan(12);
    expect(uniqueCount(small.map((piece) => piece.width))).toBeGreaterThan(6);
    expect(uniqueCount(small.map((piece) => piece.height))).toBeGreaterThan(6);
  });

  it('bursts from the top/center with some side spray', () => {
    const centerBand = small.filter(
      (piece) => piece.originX > 390 * 0.25 && piece.originX < 390 * 0.75
    );
    const sideBand = small.filter(
      (piece) => piece.originX <= 390 * 0.22 || piece.originX >= 390 * 0.78
    );
    expect(centerBand.length).toBeGreaterThan(sideBand.length);
    expect(sideBand.length).toBeGreaterThan(0);
    expect(small.every((piece) => piece.originY < 844 * 0.3)).toBe(true);
    expect(small.some((piece) => Math.abs(piece.sprayX) > 80)).toBe(true);
  });

  it('picks colors from the provided theme palette', () => {
    expect(small.every((piece) => COLORS.includes(piece.color))).toBe(true);
    expect(new Set(small.map((piece) => piece.color)).size).toBeGreaterThan(3);
  });

  it('is deterministic for the same burst', () => {
    expect(buildConfettiPieces(3, 'small', 390, 844, COLORS)).toEqual(small);
  });
});
