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
  const [isGenerating, setIsGenerating] = useState(false)
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

  useEffect(() => {
    fetchTournament()
  }, [params.id])

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

  const handleGenerateMatches = async () => {
    if (!tournament || tournament.participants.length < 2) {
      alert('対戦を生成するには2人以上の参加者が必要です')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch(`/api/tournaments/${params.id}/matches`, {
        method: 'POST',
      })

      if (!response.ok) throw new Error('対戦の生成に失敗しました')

      fetchTournament()
    } catch (error) {
      console.error('Error:', error)
      alert('対戦の生成に失敗しました')
    } finally {
      setIsGenerating(false)
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
      return
    }

    // 決勝戦の勝者・敗者をセット
    const finalMatch = currentRoundMatches.find((m: any) => m.matchType === 'normal')
    if (finalMatch && currentRoundMatches.length === 1) {
      const winner = finalMatch.player1.id === finalMatch.winnerId ? finalMatch.player1 : finalMatch.player2
      const loser = finalMatch.player1.id === finalMatch.winnerId ? finalMatch.player2 : finalMatch.player1
      setFinalWinner(winner)
      setSecondPlace(loser)
      return
    }

    const winners = currentRoundMatches
      .filter((m: any) => m.matchType === 'normal')
      .map((m: any) => m.player1.id === m.winnerId ? m.player1 : m.player2)

    if (winners.length === 1) {
      setFinalWinner(winners[0])
      return
    }

    await fetch(`/api/tournaments/${params.id}/matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winners, round: currentRound + 1 }),
    })
    await fetchTournament()
  }

  // 参加者リストから1回戦＋シード枠を自動生成する関数
  const prepareInitialAssignments = () => {
    if (!tournament) return
    const participants = [...tournament.participants]
    // 1. 2のべき乗を計算
    let n = 1
    while (n < participants.length) n *= 2
    const seedCount = n - participants.length

    // 2. シャッフル
    const shuffled = [...participants].sort(() => Math.random() - 0.5)

    // 3. シード枠を先に作る
    const matches = []
    for (let i = 0; i < seedCount; i++) {
      matches.push({ player1Id: shuffled[i].id, player2Id: null })
    }

    // 4. 残りで1回戦を作る
    for (let i = seedCount; i < shuffled.length; i += 2) {
      matches.push({
        player1Id: shuffled[i].id,
        player2Id: shuffled[i + 1] ? shuffled[i + 1].id : null,
      })
    }

    setRoundAssignments({ round: 1, matches })
    setShowAssignment(true)
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
                      <button onClick={() => setEditingParticipantId(null)} className="bg-gray-300 px-2 rounded">キャンセル</button>
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
                  onClick={prepareInitialAssignments}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400"
                >
                  対戦者・シード編集
                </button>
              </div>
            )}

            {showAssignment && (
              <div className="mb-8 p-4 bg-gray-100 rounded">
                <h3 className="text-lg font-bold mb-4">1回戦・シード枠 割り当て</h3>
                {roundAssignments.matches.map((match, idx) => (
                  <div key={idx} className="flex items-center gap-4 mb-2">
                    <select
                      value={match.player1Id || ''}
                      onChange={e => handleAssignmentChange(idx, 1, e.target.value || null)}
                      className="rounded border-gray-300 px-2 py-1"
                    >
                      <option value="">未選択</option>
                      {tournament.participants.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <span>vs</span>
                    {match.player2Id !== null ? (
                      <select
                        value={match.player2Id || ''}
                        onChange={e => handleAssignmentChange(idx, 2, e.target.value || null)}
                        className="rounded border-gray-300 px-2 py-1"
                      >
                        <option value="">未選択</option>
                        {tournament.participants.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-green-700 font-bold">シード</span>
                    )}
                  </div>
                ))}
                <button className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">この組み合わせで対戦開始</button>
              </div>
            )}

            {tournament.participants.length >= 2 && (
              <div className="mb-8">
                <button
                  onClick={handleGenerateMatches}
                  disabled={isGenerating}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {isGenerating ? '生成中...' : '対戦組み合わせを生成'}
                </button>
              </div>
            )}

            {tournament.matches && tournament.matches.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">対戦組み合わせ</h2>
                <div className="space-y-4">
                  {tournament.matches.map((match) => (
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
                          <select
                            value={selectedPositions[`${match.id}-${match.player1.id}`] || ''}
                            onChange={(e) => handlePositionChange(match.id, match.player1.id, e.target.value)}
                            className="ml-2 rounded-md border-gray-300 shadow-sm"
                          >
                            <option value="">立ち位置を選択</option>
                            {POSITIONS.map((pos) => (
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
                        </div>
                        <div className="mx-4 text-gray-500">vs</div>
                        <div className="flex-1 text-right">
                          <select
                            value={selectedPositions[`${match.id}-${match.player2.id}`] || ''}
                            onChange={(e) => handlePositionChange(match.id, match.player2.id, e.target.value)}
                            className="mr-2 rounded-md border-gray-300 shadow-sm"
                          >
                            <option value="">立ち位置を選択</option>
                            {POSITIONS.map((pos) => (
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
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 