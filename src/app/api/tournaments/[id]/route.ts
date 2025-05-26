import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: {
        id: params.id,
      },
      include: {
        participants: true,
        matches: {
          include: {
            player1: true,
            player2: true,
          },
          orderBy: {
            round: 'asc',
          },
        },
      },
    })

    if (!tournament) {
      return NextResponse.json(
        { error: 'トーナメントが見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json(tournament)
  } catch (error) {
    console.error('Error fetching tournament:', error)
    return NextResponse.json(
      { error: 'トーナメントの取得に失敗しました' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.positions !== undefined && Array.isArray(body.positions)) updateData.positions = body.positions
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: '更新内容がありません' }, { status: 400 })
    }
    const updated = await prisma.tournament.update({
      where: { id: params.id },
      data: updateData,
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating tournament:', error)
    return NextResponse.json({ error: 'トーナメントの更新に失敗しました' }, { status: 500 })
  }
} 