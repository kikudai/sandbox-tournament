import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    if (!body.name) {
      return NextResponse.json({ error: '名前は必須です' }, { status: 400 })
    }
    const updated = await prisma.participant.update({
      where: { id: params.id },
      data: { name: body.name },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating participant:', error)
    return NextResponse.json({ error: '参加者の更新に失敗しました' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.participant.delete({
      where: { id: params.id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting participant:', error)
    return NextResponse.json({ error: '参加者の削除に失敗しました' }, { status: 500 })
  }
} 