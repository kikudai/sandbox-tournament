import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
  request: Request,
  { params }: { params: { id: string; matchId: string } }
) {
  try {
    const { winnerId } = await request.json()
    if (!winnerId) {
      return NextResponse.json(
        { error: '勝者IDは必須です' },
        { status: 400 }
      )
    }
    // 勝者を記録
    const match = await prisma.match.update({
      where: { id: params.matchId },
      data: { winnerId },
    })
    return NextResponse.json(match)
  } catch (error) {
    console.error('Error setting winner:', error)
    return NextResponse.json(
      { error: '勝者の記録に失敗しました' },
      { status: 500 }
    )
  }
} 