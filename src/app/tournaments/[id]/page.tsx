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
    const winners = currentRoundMatches.map((m: any) => m.player1.id === m.winnerId ? m.player1 : m.player2)
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{tournament.name}</h1>
          {finalWinner && (
            <div className="mb-4 p-4 bg-yellow-100 rounded text-xl font-bold text-center text-yellow-800">
              優勝者: {finalWinner.name}
            </div>
          )}
          {tournament.description && (
            <p className="text-gray-600 mb-6">{tournament.description}</p>
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
                  <span className="text-gray-900">{participant.name}</span>
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