import { generateFirstRoundPatterns, Participant } from '../src/utils/generateFirstRoundPatterns'

describe('generateFirstRoundPatterns', () => {
  test('creates single pairing pattern when participants count is power of two', () => {
    const players: Participant[] = [
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
      { id: '3', name: 'C' },
      { id: '4', name: 'D' },
    ];
    const patterns = generateFirstRoundPatterns(players);
    expect(patterns).toHaveLength(1);
    expect(patterns[0].matches).toEqual([
      { player1: players[0], player2: players[1] },
      { player1: players[2], player2: players[3] },
    ]);
  });

  test('distributes BYE slots when participants count is not power of two', () => {
    const players: Participant[] = [
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
      { id: '3', name: 'C' },
      { id: '4', name: 'D' },
      { id: '5', name: 'E' },
      { id: '6', name: 'F' },
    ];
    const patterns = generateFirstRoundPatterns(players);
    expect(patterns.length).toBe(2);

    // verify BYE count across patterns
    const byeCounts = patterns.map(p =>
      p.matches.filter(m => m.player2 === null).length
    );
    // For 6 participants, we need 2 BYEs in total in each pattern
    expect(byeCounts.every(c => c === 2)).toBe(true);
  });
});
