import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
  request: Request,
  { params }: { params: { id: string; matchId: string } }
) {
  try {
    const { participantId, position } = await request.json()

    if (!participantId || !position) {
      return NextResponse.json(
        { error: '参加者IDと立ち位置は必須です' },
        { status: 400 }
      )
    }

    // 既存の立ち位置を削除
    await prisma.position.deleteMany({
      where: {
        matchId: params.matchId,
        participantId,
      },
    })

    // 新しい立ち位置を作成
    const newPosition = await prisma.position.create({
      data: {
        name: position,
        matchId: params.matchId,
        participantId,
      },
    })

    return NextResponse.json(newPosition)
  } catch (error) {
    console.error('Error updating position:', error)
    return NextResponse.json(
      { error: '立ち位置の更新に失敗しました' },
      { status: 500 }
    )
  }
} 