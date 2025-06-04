export type Participant = {
  id: string;
  name: string;
};

export type FirstRoundPattern = {
  name: string;
  matches: { player1: Participant | null; player2: Participant | null }[];
};

export function generateFirstRoundPatterns(participants: Participant[]): FirstRoundPattern[] {
  const n = participants.length;
  let m = 1;
  while (m < n) m *= 2;
  const seedCount = m - n;
  const patterns: FirstRoundPattern[] = [];

  if (seedCount === 0) {
    const stdOrder = [...participants];
    const stdMatches = [] as { player1: Participant | null; player2: Participant | null }[];
    let idx = 0;
    for (let i = 0; i < n / 2; i++) {
      const p1 = stdOrder[idx++];
      const p2 = stdOrder[idx++];
      stdMatches.push({ player1: p1, player2: p2 });
    }
    patterns.push({ name: '基本（シードなし）', matches: stdMatches });
    return patterns;
  }

  // BYE分散（バランス良く）
  const distOrder = [...participants];
  const distMatches = [] as { player1: Participant | null; player2: Participant | null }[];
  let idx = 0;
  const byeIndexes: number[] = [];
  for (let i = 0; i < seedCount; i++) {
    byeIndexes.push(Math.round((i * (m / 2)) / seedCount));
  }
  const uniqueByeIndexes = Array.from(new Set(byeIndexes)).filter(i => i < m / 2);
  for (let i = 0; i < m / 2; i++) {
    let p1: Participant | null = null;
    let p2: Participant | null = null;
    if (uniqueByeIndexes.includes(i)) {
      p1 = distOrder[idx++];
      p2 = null;
    } else {
      p1 = distOrder[idx++];
      p2 = distOrder[idx++];
    }
    distMatches.push({ player1: p1, player2: p2 });
  }
  patterns.push({ name: 'BYE分散（バランス良く）', matches: distMatches });

  // BYE片側集中
  const revOrder = [...participants];
  const revMatches = [] as { player1: Participant | null; player2: Participant | null }[];
  idx = 0;
  for (let i = 0; i < m / 2; i++) {
    let p1: Participant | null = null;
    let p2: Participant | null = null;
    if (i >= m / 2 - seedCount) {
      p1 = revOrder[idx++];
      p2 = null;
    } else {
      p1 = revOrder[idx++];
      p2 = revOrder[idx++];
    }
    revMatches.push({ player1: p1, player2: p2 });
  }
  patterns.push({ name: 'BYE片側集中', matches: revMatches });

  return patterns;
}
