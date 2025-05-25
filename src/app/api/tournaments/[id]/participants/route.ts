import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { name } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: '参加者名は必須です' },
        { status: 400 }
      )
    }

    // トーナメントの存在確認
    const tournament = await prisma.tournament.findUnique({
      where: { id: params.id },
    })

    if (!tournament) {
      return NextResponse.json(
        { error: 'トーナメントが見つかりません' },
        { status: 404 }
      )
    }

    // 参加者の追加
    const participant = await prisma.participant.create({
      data: {
        name,
        tournamentId: params.id,
      },
    })

    return NextResponse.json(participant)
  } catch (error) {
    console.error('Error adding participant:', error)
    return NextResponse.json(
      { error: '参加者の追加に失敗しました' },
      { status: 500 }
    )
  }
} 