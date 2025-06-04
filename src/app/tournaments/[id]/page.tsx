'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

type Tournament = {
  id: string
  name: string
  description: string | null
  participants: Participant[]
  matches: Match[]
}

type Participant = {
  id: string
  name: string
}

type Match = {
  id: string
  round: number
  matchType: string
  player1: Participant
  player2: Participant
  winnerId: string | null
}

type Position = {
  id: string
  name: string
  participantId: string
}

const POSITIONS = ['東', '西', '南', '北']

export default function TournamentDetail() {
  const params = useParams()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [newParticipantName, setNewParticipantName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedPositions, setSelectedPositions] = useState<Record<string, string>>({})
  const [isSettingWinner, setIsSettingWinner] = useState<string | null>(null)
  const [finalWinner, setFinalWinner] = useState<Participant | null>(null)
  const [secondPlace, setSecondPlace] = useState<Participant | null>(null)
  const [thirdPlace, setThirdPlace] = useState<Participant | null>(null)
  const [roundAssignments, setRoundAssignments] = useState<{ round: number, matches: { player1Id: string | null, player2Id: string | null }[] }>({ round: 1, matches: [] })
  const [showAssignment, setShowAssignment] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState(tournament?.name || "")
  const [isEditingDesc, setIsEditingDesc] = useState(false)
  const [editDesc, setEditDesc] = useState(tournament?.description || "")
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null)
  const [editParticipantName, setEditParticipantName] = useState("")
  const [isEditingPositions, setIsEditingPositions] = useState(false)
  const [editPositions, setEditPositions] = useState<string[]>(Array.isArray((tournament as any)?.positions) ? (tournament as any).positions : ["東","西"])
  const [patternCandidates, setPatternCandidates] = useState<{ name: string; matches: { player1: Participant | null; player2: Participant | null }[] }[]>([])
  const [selectedPatternIdx, setSelectedPatternIdx] = useState<number | null>(null)

  useEffect(() => {
    fetchTournament()
  }, [params.id])

  useEffect(() => {
    if (tournament && Array.isArray((tournament as any).positions)) {
      setEditPositions((tournament as any).positions)
    }
  }, [tournament])

  useEffect(() => {
    if (!tournament || !tournament.matches) return
    const posList = Array.isArray((tournament as any).positions) ? (tournament as any).positions : POSITIONS
    const newSelected: Record<string, string> = { ...selectedPositions }
    tournament.matches.forEach((match: any) => {
      if (match.player1 && !newSelected[`${match.id}-${match.player1.id}`]) {
        newSelected[`${match.id}-${match.player1.id}`] = posList[0] || '東'
      }
      if (match.player2 && !newSelected[`${match.id}-${match.player2.id}`]) {
        newSelected[`${match.id}-${match.player2.id}`] = posList[1] || '西'
      }
    })
    setSelectedPositions(newSelected)
    // eslint-disable-next-line
  }, [tournament])

  const fetchTournament = async () => {
    try {
      const response = await fetch(`/api/tournaments/${params.id}`)
      if (!response.ok) throw new Error('トーナメントの取得に失敗しました')
      const data = await response.json()
      setTournament(data)

      const positions: Record<string, string> = {}
      data.matches.forEach((match: any) => {
        match.positions?.forEach((position: any) => {
          positions[`${match.id}-${position.participantId}`] = position.name
        })
      })
      setSelectedPositions(positions)
    } catch (error) {
      console.error('Error:', error)
      alert('トーナメントの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newParticipantName.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/tournaments/${params.id}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newParticipantName }),
      })

      if (!response.ok) throw new Error('参加者の追加に失敗しました')

      setNewParticipantName('')
      fetchTournament()
    } catch (error) {
      console.error('Error:', error)
      alert('参加者の追加に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePositionChange = async (matchId: string, participantId: string, position: string) => {
    try {
      const response = await fetch(`/api/tournaments/${params.id}/matches/${matchId}/positions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, position }),
      })
      if (!response.ok) throw new Error('立ち位置の更新に失敗しました')
      setSelectedPositions((prev) => ({
        ...prev,
        [`${matchId}-${participantId}`]: position,
      }))
    } catch (error) {
      alert('立ち位置の更新に失敗しました')
    }
  }

  const handleSetWinner = async (matchId: string, winnerId: string) => {
    setIsSettingWinner(matchId)
    try {
      const response = await fetch(`/api/tournaments/${params.id}/matches/${matchId}/winner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerId }),
      })
      if (!response.ok) throw new Error('勝者の記録に失敗しました')
      await fetchTournament()
      setTimeout(() => {
        checkAndGenerateNextRound()
      }, 300)
    } catch (error) {
      alert('勝者の記録に失敗しました')
    } finally {
      setIsSettingWinner(null)
    }
  }

  const checkAndGenerateNextRound = async () => {
    if (!tournament) return
    const response = await fetch(`/api/tournaments/${params.id}`)
    const data = await response.json()
    const currentRound = Math.max(...data.matches.map((m: any) => m.round))
    const currentRoundMatches = data.matches.filter((m: any) => m.round === currentRound)
    if (currentRoundMatches.some((m: any) => !m.winnerId)) return

    // 3位決定戦の結果を確認
    const thirdPlaceMatch = currentRoundMatches.find((m: any) => m.matchType === 'third_place')
    if (thirdPlaceMatch) {
      const thirdPlaceWinner = thirdPlaceMatch.player1.id === thirdPlaceMatch.winnerId ? thirdPlaceMatch.player1 : thirdPlaceMatch.player2
      setThirdPlace(thirdPlaceWinner)
      // 決勝戦の勝者・敗者もセット
      const finalMatch = currentRoundMatches.find((m: any) => m.matchType === 'normal')
      if (finalMatch && currentRoundMatches.length >= 2) {
        const winner = finalMatch.player1.id === finalMatch.winnerId ? finalMatch.player1 : finalMatch.player2
        const loser = finalMatch.player1.id === finalMatch.winnerId ? finalMatch.player2 : finalMatch.player1
        setFinalWinner(winner)
        setSecondPlace(loser)
      }
      return
    }

    await fetch(`/api/tournaments/${params.id}/matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winners: currentRoundMatches.map((m: any) => m.winnerId), round: currentRound + 1 }),
    })
    await fetchTournament()
  }

  // 参加人数と参加者リストから複数の1回戦パターンを生成する関数
  function generateFirstRoundPatterns(participants: Participant[]) {
    const n = participants.length;
    let m = 1;
    while (m < n) m *= 2;
    const seedCount = m - n;
    const patterns: { name: string; matches: { player1: Participant | null; player2: Participant | null }[] }[] = [];

    // 2^k人の場合は1パターンのみ
    if (seedCount === 0) {
      const stdOrder = [...participants];
      const stdMatches = [];
      let idx = 0;
      for (let i = 0; i < n / 2; i++) {
        const p1 = stdOrder[idx++];
        const p2 = stdOrder[idx++];
        stdMatches.push({ player1: p1, player2: p2 });
      }
      patterns.push({ name: '基本（シードなし）', matches: stdMatches });
      return patterns;
    }

    // --- パターン①: BYE分散（バランス良く） ---
    const distOrder = [...participants];
    const distMatches = [];
    let idx = 0;
    // BYEをできるだけ均等に配置
    const byeIndexes: number[] = [];
    for (let i = 0; i < seedCount; i++) {
      byeIndexes.push(Math.round(i * (m / 2) / seedCount));
    }
    // 重複を除去し、枠数を超えないように
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

    // --- パターン②: BYE片側集中 ---
    const revOrder = [...participants];
    const revMatches = [];
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

  const handleAssignmentChange = (matchIdx: number, playerNum: 1 | 2, participantId: string | null) => {
    setRoundAssignments((prev) => {
      const newMatches = prev.matches.map((m, idx) => {
        if (idx !== matchIdx) return m
        return playerNum === 1 ? { ...m, player1Id: participantId } : { ...m, player2Id: participantId }
      })
      return { ...prev, matches: newMatches }
    })
  }

  const handleSaveName = async () => {
    await fetch(`/api/tournaments/${tournament.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName }),
    })
    setIsEditingName(false)
    fetchTournament()
  }

  const handleSaveDesc = async () => {
    await fetch(`/api/tournaments/${tournament.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: editDesc }),
    })
    setIsEditingDesc(false)
    fetchTournament()
  }

  const handleEditParticipant = (id: string, name: string) => {
    setEditingParticipantId(id)
    setEditParticipantName(name)
  }

  const handleSaveParticipant = async (id: string) => {
    await fetch(`/api/participants/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editParticipantName }),
    })
    setEditingParticipantId(null)
    fetchTournament()
  }

  const handleDeleteParticipant = async (id: string) => {
    if (!window.confirm('本当に削除しますか？')) return;
    await fetch(`/api/participants/${id}`, {
      method: 'DELETE',
    });
    setEditingParticipantId(null);
    fetchTournament();
  }

  const handleStartMatches = async () => {
    if (!tournament) return
    // バリデーション: すべての枠が未選択でないこと
    for (const match of roundAssignments.matches) {
      if (!match.player1Id || (match.player2Id === undefined)) {
        alert('すべての枠に参加者を割り当ててください')
        return
      }
    }
    const response = await fetch(`/api/tournaments/${tournament.id}/matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matches: roundAssignments.matches, round: roundAssignments.round }),
    })
    if (!response.ok) {
      alert('対戦の生成に失敗しました')
      return
    }
    setShowAssignment(false)
    fetchTournament()
  }

  const handleSavePositions = async () => {
    await fetch(`/api/tournaments/${tournament.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ positions: editPositions }),
    })
    setIsEditingPositions(false)
    fetchTournament()
  }

  // 1回戦パターン選択UIを表示
  const handleShowPatternCandidates = () => {
    if (!tournament) return
    const patterns = generateFirstRoundPatterns(tournament.participants)
    setPatternCandidates(patterns)
    setSelectedPatternIdx(null)
    setShowAssignment(false)
  }

  // パターン決定→1回戦割り当て
  const handleSelectPatternAndStart = () => {
    if (selectedPatternIdx === null || !patternCandidates[selectedPatternIdx]) return
    const pattern = patternCandidates[selectedPatternIdx]
    // matches: {player1, player2} から {player1Id, player2Id} へ変換
    const matches = pattern.matches.map(m => ({
      player1Id: m.player1 ? m.player1.id : null,
      player2Id: m.player2 ? m.player2.id : null,
    }))
    setRoundAssignments({ round: 1, matches })
    setShowAssignment(true)
    setPatternCandidates([])
    setSelectedPatternIdx(null)
  }

  // 指定パターンの全ラウンド組み合わせを計算して返す（簡易ビュー用）
  function getTournamentRounds(matches: { player1: Participant | null; player2: Participant | null }[]) {
    // 各ラウンドの各試合に「どのカードの勝者か」を記録
    type MatchInfo = { player1: string; player2: string; label: string };
    const rounds: { matches: MatchInfo[] }[] = [];
    let currentMatches: MatchInfo[] = matches.map((m, i) => ({
      player1: m.player1 ? m.player1.name : 'BYE',
      player2: m.player2 ? m.player2.name : 'BYE',
      label: `${m.player1 ? m.player1.name : 'BYE'} vs ${m.player2 ? m.player2.name : 'BYE'}`
    }));
    // 1回戦の勝者ラベル
    let winnerLabels = currentMatches.map((m, i) => `勝者1回戦${i + 1}（${m.label}）`);
    rounds.push({ matches: currentMatches });
    let roundNum = 2;
    while (currentMatches.length > 1) {
      const nextMatches: MatchInfo[] = [];
      const nextWinnerLabels: string[] = [];
      for (let i = 0; i < currentMatches.length; i += 2) {
        const p1 = winnerLabels[i] || '';
        const p2 = winnerLabels[i + 1] || '';
        const label = `${p1} vs ${p2}`;
        if (p2) {
          nextMatches.push({ player1: p1, player2: p2, label });
          nextWinnerLabels.push(`勝者${roundNum}回戦${nextMatches.length}（${label}）`);
        }
      }
      if (nextMatches.length > 0) {
        rounds.push({ matches: nextMatches });
      }
      currentMatches = nextMatches;
      winnerLabels = nextWinnerLabels;
      roundNum++;
    }
    return rounds;
  }

  if (isLoading) {
    return <div className="p-8">読み込み中...</div>
  }

  if (!tournament) {
    return <div className="p-8">トーナメントが見つかりません</div>
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {/* トーナメント名編集 */}
          {isEditingName ? (
            <div className="flex gap-2 mb-2">
              <input value={editName} onChange={e => setEditName(e.target.value)} className="border rounded px-2 py-1 flex-1" />
              <button onClick={handleSaveName} className="bg-green-500 text-white px-2 rounded">保存</button>
              <button onClick={() => setIsEditingName(false)} className="bg-gray-300 px-2 rounded">キャンセル</button>
            </div>
          ) : (
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              {tournament.name}
              <button onClick={() => { setIsEditingName(true); setEditName(tournament.name) }} className="text-sm text-blue-500 underline">編集</button>
            </h1>
          )}
          {/* 説明編集 */}
          {isEditingDesc ? (
            <div className="flex gap-2 mb-4">
              <input value={editDesc} onChange={e => setEditDesc(e.target.value)} className="border rounded px-2 py-1 flex-1" />
              <button onClick={handleSaveDesc} className="bg-green-500 text-white px-2 rounded">保存</button>
              <button onClick={() => setIsEditingDesc(false)} className="bg-gray-300 px-2 rounded">キャンセル</button>
            </div>
          ) : (
            tournament.description && (
              <p className="text-gray-600 mb-6 flex items-center gap-2">
                {tournament.description}
                <button onClick={() => { setIsEditingDesc(true); setEditDesc(tournament.description || "") }} className="text-sm text-blue-500 underline">編集</button>
              </p>
            )
          )}
          {/* 立ち位置編集UI */}
          <div className="mb-4">
            <span className="font-semibold">立ち位置呼称：</span>
            {isEditingPositions ? (
              <span className="flex gap-2 items-center">
                {editPositions.map((pos, idx) => (
                  <input
                    key={idx}
                    value={pos}
                    onChange={e => {
                      const newPos = [...editPositions]
                      newPos[idx] = e.target.value
                      setEditPositions(newPos)
                    }}
                    className="border rounded px-2 py-1 w-20"
                  />
                ))}
                <button onClick={() => setEditPositions([...editPositions, ""])} className="bg-blue-200 px-2 rounded">＋</button>
                <button onClick={handleSavePositions} className="bg-green-500 text-white px-2 rounded">保存</button>
                <button onClick={() => { setIsEditingPositions(false); setEditPositions(Array.isArray((tournament as any).positions) ? (tournament as any).positions : ["東","西"]); }} className="bg-gray-300 px-2 rounded">キャンセル</button>
              </span>
            ) : (
              <span className="ml-2">
                {Array.isArray((tournament as any).positions) ? (tournament as any).positions.join('・') : '東・西'}
                <button onClick={() => setIsEditingPositions(true)} className="ml-2 text-sm text-blue-500 underline">編集</button>
              </span>
            )}
          </div>
          {finalWinner && (
            <div className="mb-2 p-4 bg-yellow-100 rounded text-xl font-bold text-center text-yellow-800">
              1位（優勝）: {finalWinner.name}
            </div>
          )}
          {secondPlace && (
            <div className="mb-2 p-4 bg-gray-200 rounded text-xl font-bold text-center text-gray-800">
              2位（準優勝）: {secondPlace.name}
            </div>
          )}
          {thirdPlace && (
            <div className="mb-4 p-4 bg-gray-100 rounded text-xl font-bold text-center text-gray-800">
              3位: {thirdPlace.name}
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">参加者一覧</h2>
            <form onSubmit={handleAddParticipant} className="mb-6">
              <div className="flex gap-4">
                <input
                  type="text"
                  value={newParticipantName}
                  onChange={(e) => setNewParticipantName(e.target.value)}
                  placeholder="参加者名を入力"
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isSubmitting ? '追加中...' : '参加者を追加'}
                </button>
              </div>
            </form>

            <div className="space-y-2 mb-8">
              {tournament.participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  {editingParticipantId === participant.id ? (
                    <>
                      <input value={editParticipantName} onChange={e => setEditParticipantName(e.target.value)} className="border rounded px-2 py-1 mr-2" />
                      <button onClick={() => handleSaveParticipant(participant.id)} className="bg-green-500 text-white px-2 rounded mr-1">保存</button>
                      <button onClick={() => setEditingParticipantId(null)} className="bg-gray-300 px-2 rounded mr-1">キャンセル</button>
                      <button onClick={() => handleDeleteParticipant(participant.id)} className="bg-red-500 text-white px-2 rounded">削除</button>
                    </>
                  ) : (
                    <>
                      <span className="text-gray-900">{participant.name}</span>
                      <button onClick={() => handleEditParticipant(participant.id, participant.name)} className="ml-2 text-sm text-blue-500 underline">編集</button>
                    </>
                  )}
                </div>
              ))}
              {tournament.participants.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  参加者がまだいません
                </p>
              )}
            </div>

            {tournament.participants.length >= 2 && (
              <div className="mb-8">
                <button
                  onClick={handleShowPatternCandidates}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400"
                >
                  対戦者・シード編集
                </button>
              </div>
            )}

            {/* 1回戦パターン候補のプレビュー＆選択UI */}
            {patternCandidates.length > 0 && (
              <div className="mb-8 p-4 bg-gray-100 rounded">
                <h3 className="text-lg font-bold mb-4">1回戦パターン候補を選択</h3>
                <div className="space-y-4">
                  {patternCandidates.map((pattern, idx) => (
                    <div key={idx} className={`p-3 rounded border ${selectedPatternIdx === idx ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}`}
                      onClick={() => setSelectedPatternIdx(idx)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="font-semibold mb-2">{pattern.name}</div>
                      <ul>
                        {pattern.matches.map((m, i) => (
                          <li key={i} className="flex gap-2 items-center mb-1">
                            <span>{m.player1 ? m.player1.name : <span className="text-gray-400">シード</span>}</span>
                            <span>vs</span>
                            <span>{m.player2 ? m.player2.name : <span className="text-gray-400">シード</span>}</span>
                          </li>
                        ))}
                      </ul>
                      {/* トーナメントプレビュー */}
                      {selectedPatternIdx === idx && (
                        <div className="mt-4 p-2 bg-white rounded border border-dashed border-gray-300">
                          <div className="font-bold mb-2 text-sm text-gray-700">トーナメントプレビュー</div>
                          {getTournamentRounds(pattern.matches).map((round, rIdx, arr) => (
                            <div key={rIdx} className="mb-2">
                              <div className="text-xs font-semibold text-gray-600 mb-1">{rIdx === 0 ? '1回戦' : rIdx + 1 === arr.length ? '決勝' : `${rIdx + 1}回戦`}</div>
                              <ul className="ml-2">
                                {round.matches.map((m, mi) => (
                                  <li key={mi} className="text-xs text-gray-800 mb-0.5">{m.player1} vs {m.player2}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                  disabled={selectedPatternIdx === null}
                  onClick={handleSelectPatternAndStart}
                >
                  このパターンで対戦開始
                </button>
              </div>
            )}
            {/* 1回戦割り当て編集画面 */}
            {showAssignment && (
              <div className="mb-8 p-4 bg-blue-50 rounded">
                <h3 className="text-lg font-bold mb-4">1回戦 割り当て編集</h3>
                <div className="space-y-2 mb-4">
                  {roundAssignments.matches.map((match, idx) => (
                    <div key={idx} className="flex gap-4 items-center">
                      <select
                        value={match.player1Id || ''}
                        onChange={e => handleAssignmentChange(idx, 1, e.target.value || null)}
                        className="border rounded px-2 py-1"
                      >
                        <option value="">未選択</option>
                        {tournament.participants.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <span>vs</span>
                      <select
                        value={match.player2Id || ''}
                        onChange={e => handleAssignmentChange(idx, 2, e.target.value === 'BYE' ? null : e.target.value || null)}
                        className="border rounded px-2 py-1"
                      >
                        <option value="">未選択</option>
                        {tournament.participants.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                        <option value="BYE">シード</option>
                      </select>
                    </div>
                  ))}
                </div>
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  onClick={handleStartMatches}
                >
                  この割り当てで開始
                </button>
                <button
                  className="ml-4 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                  onClick={() => setShowAssignment(false)}
                >
                  キャンセル
                </button>
              </div>
            )}
          </div>
          {/* 対戦表（マッチリスト）表示 */}
          {tournament.matches && tournament.matches.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">対戦組み合わせ</h2>
              <div className="space-y-4">
                {tournament.matches.map((match) => {
                  const isBye = match.matchType === 'bye' || match.player1.id === match.player2.id
                  return (
                    <div
                      key={match.id}
                      className="p-4 bg-gray-50 rounded-md border border-gray-200"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          {match.matchType === 'third_place' && (
                            <span className="text-sm text-gray-500 mr-2">3位決定戦</span>
                          )}
                          <span className="font-medium">{match.player1.name}</span>
                          {isBye && (
                            <span className="ml-2 px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs">シード</span>
                          )}
                          {!isBye && (
                            <>
                              <select
                                value={selectedPositions[`${match.id}-${match.player1.id}`] || ''}
                                onChange={(e) => handlePositionChange(match.id, match.player1.id, e.target.value)}
                                className="ml-2 rounded-md border-gray-300 shadow-sm"
                              >
                                <option value="">立ち位置を選択</option>
                                {(Array.isArray((tournament as any).positions) ? (tournament as any).positions : POSITIONS).map((pos: string) => (
                                  <option key={pos} value={pos}>{pos}</option>
                                ))}
                              </select>
                              <button
                                className={`ml-2 px-2 py-1 rounded ${match.winnerId === match.player1.id ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'} ${isSettingWinner === match.id ? 'opacity-50' : ''}`}
                                disabled={!!match.winnerId || isSettingWinner === match.id}
                                onClick={() => handleSetWinner(match.id, match.player1.id)}
                              >
                                勝者
                              </button>
                            </>
                          )}
                        </div>
                        <div className="mx-4 text-gray-500">vs</div>
                        <div className="flex-1 text-right">
                          {isBye ? (
                            <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs">シード（不戦勝）</span>
                          ) : (
                            <>
                              <select
                                value={selectedPositions[`${match.id}-${match.player2.id}`] || ''}
                                onChange={(e) => handlePositionChange(match.id, match.player2.id, e.target.value)}
                                className="mr-2 rounded-md border-gray-300 shadow-sm"
                              >
                                <option value="">立ち位置を選択</option>
                                {(Array.isArray((tournament as any).positions) ? (tournament as any).positions : POSITIONS).map((pos: string) => (
                                  <option key={pos} value={pos}>{pos}</option>
                                ))}
                              </select>
                              <span className="font-medium">{match.player2.name}</span>
                              <button
                                className={`ml-2 px-2 py-1 rounded ${match.winnerId === match.player2.id ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'} ${isSettingWinner === match.id ? 'opacity-50' : ''}`}
                                disabled={!!match.winnerId || isSettingWinner === match.id}
                                onClick={() => handleSetWinner(match.id, match.player2.id)}
                              >
                                勝者
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 