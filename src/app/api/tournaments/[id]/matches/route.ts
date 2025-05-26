import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 参加者をランダムにシャッフルする関数
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}))
    // 次ラウンド生成の場合
    if (body.winners && Array.isArray(body.winners) && body.round) {
      const winners = body.winners
      const round = body.round
      const shuffled = shuffleArray(winners)
      const matches = []

      // 準決勝の場合、3位決定戦も生成
      if (round === 2 && winners.length === 2) {
        const semifinalMatches = await prisma.match.findMany({
          where: {
            tournamentId: params.id,
            round: 1,
          },
          include: {
            player1: true,
            player2: true,
          },
        })

        const losers = semifinalMatches
          .map(match => match.winnerId === match.player1Id ? match.player2 : match.player1)

        // 3位決定戦を生成
        const thirdPlaceMatch = await prisma.match.create({
          data: {
            tournamentId: params.id,
            round: 2,
            matchType: 'third_place',
            player1Id: losers[0].id,
            player2Id: losers[1].id,
          },
          include: {
            player1: true,
            player2: true,
          },
        })
        matches.push(thirdPlaceMatch)
      }

      // 通常の対戦を生成
      for (let i = 0; i < shuffled.length; i += 2) {
        if (i + 1 < shuffled.length) {
          const match = await prisma.match.create({
            data: {
              tournamentId: params.id,
              round,
              matchType: 'normal',
              player1Id: shuffled[i].id,
              player2Id: shuffled[i + 1].id,
            },
            include: {
              player1: true,
              player2: true,
            },
          })
          matches.push(match)
        }
      }
      return NextResponse.json(matches)
    }

    // 1回戦生成（従来通り）
    // トーナメントと参加者の取得
    const tournament = await prisma.tournament.findUnique({
      where: { id: params.id },
      include: { participants: true },
    })

    if (!tournament) {
      return NextResponse.json(
        { error: 'トーナメントが見つかりません' },
        { status: 404 }
      )
    }

    if (tournament.participants.length < 2) {
      return NextResponse.json(
        { error: '対戦を生成するには2人以上の参加者が必要です' },
        { status: 400 }
      )
    }

    // 既存の対戦を削除
    await prisma.match.deleteMany({
      where: { tournamentId: params.id },
    })

    // 参加者をシャッフル
    const shuffledParticipants = shuffleArray(tournament.participants)

    // 対戦の生成
    const matches = []
    for (let i = 0; i < shuffledParticipants.length; i += 2) {
      if (i + 1 < shuffledParticipants.length) {
        const match = await prisma.match.create({
          data: {
            tournamentId: params.id,
            round: 1,
            player1Id: shuffledParticipants[i].id,
            player2Id: shuffledParticipants[i + 1].id,
          },
          include: {
            player1: true,
            player2: true,
          },
        })
        matches.push(match)
      }
    }

    return NextResponse.json(matches)
  } catch (error) {
    console.error('Error generating matches:', error)
    return NextResponse.json(
      { error: '対戦の生成に失敗しました' },
      { status: 500 }
    )
  }
} 