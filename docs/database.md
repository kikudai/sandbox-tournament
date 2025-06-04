# データベース設計書

## 概要

トーナメント管理アプリケーションのデータベース設計です。
Prismaを使用し、SQLiteデータベースで実装しています。

## スキーマ定義

### Tournament（トーナメント）

```prisma
model Tournament {
  id          String       @id @default(cuid())
  name        String
  description String?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  participants Participant[]
  matches     Match[]
}
```

#### フィールド
- `id`: 一意のID（CUID）
- `name`: トーナメント名
- `description`: 説明（任意）
- `createdAt`: 作成日時
- `updatedAt`: 更新日時

#### リレーション
- `participants`: 参加者（1対多）
- `matches`: 対戦（1対多）

### Participant（参加者）

```prisma
model Participant {
  id            String   @id @default(cuid())
  name          String
  tournamentId  String
  tournament    Tournament @relation(fields: [tournamentId], references: [id])
  player1Matches Match[]  @relation("Player1")
  player2Matches Match[]  @relation("Player2")
  positions     Position[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

#### フィールド
- `id`: 一意のID（CUID）
- `name`: 参加者名
- `tournamentId`: 所属トーナメントのID
- `createdAt`: 作成日時
- `updatedAt`: 更新日時

#### リレーション
- `tournament`: 所属トーナメント（多対1）
- `player1Matches`: プレイヤー1としての対戦（1対多）
- `player2Matches`: プレイヤー2としての対戦（1対多）
- `positions`: 立ち位置（1対多）

### Match（対戦）

```prisma
model Match {
  id           String   @id @default(cuid())
  round        Int
  tournamentId String
  tournament   Tournament @relation(fields: [tournamentId], references: [id])
  player1Id    String
  player1      Participant @relation("Player1", fields: [player1Id], references: [id])
  player2Id    String
  player2      Participant @relation("Player2", fields: [player2Id], references: [id])
  winnerId     String?
  winner       Participant? @relation("Winner", fields: [winnerId], references: [id])
  positions    Position[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

#### フィールド
- `id`: 一意のID（CUID）
- `round`: ラウンド番号
- `tournamentId`: トーナメントID
- `player1Id`: プレイヤー1のID
- `player2Id`: プレイヤー2のID
- `winnerId`: 勝者のID（任意）
- `createdAt`: 作成日時
- `updatedAt`: 更新日時

#### リレーション
- `tournament`: 所属トーナメント（多対1）
- `player1`: プレイヤー1（多対1）
- `player2`: プレイヤー2（多対1）
- `winner`: 勝者（多対1）
- `positions`: 立ち位置（1対多）

### Position（立ち位置）

```prisma
model Position {
  id            String   @id @default(cuid())
  name          String   // 東、西、南、北など
  matchId       String
  match         Match    @relation(fields: [matchId], references: [id])
  participantId String
  participant   Participant @relation(fields: [participantId], references: [id])
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

#### フィールド
- `id`: 一意のID（CUID）
- `name`: 位置名（東、西、南、北など）
- `matchId`: 対戦ID
- `participantId`: 参加者ID
- `createdAt`: 作成日時
- `updatedAt`: 更新日時

#### リレーション
- `match`: 所属対戦（多対1）
- `participant`: 参加者（多対1）

## インデックス

```prisma
model Tournament {
  // ... 既存のフィールド

  @@index([createdAt])
}

model Participant {
  // ... 既存のフィールド

  @@index([tournamentId])
  @@index([createdAt])
}

model Match {
  // ... 既存のフィールド

  @@index([tournamentId])
  @@index([player1Id])
  @@index([player2Id])
  @@index([winnerId])
  @@index([createdAt])
}

model Position {
  // ... 既存のフィールド

  @@index([matchId])
  @@index([participantId])
  @@index([createdAt])
}
```

## データの整合性

### 制約
1. トーナメント
   - 名前は必須
   - 作成日時は自動設定

2. 参加者
   - 名前は必須
   - トーナメントへの所属は必須

3. 対戦
   - ラウンド番号は必須
   - プレイヤー1と2は必須
   - 同じトーナメント内で重複するラウンド番号は不可

4. 立ち位置
   - 位置名は必須
   - 対戦と参加者の紐付けは必須
   - 同じ対戦内で重複する位置名は不可

## マイグレーション

### 初期マイグレーション
```bash
npx prisma migrate dev --name init
```

### マイグレーション履歴
1. 初期スキーマ作成
2. インデックス追加
3. 制約追加

## バックアップ

### バックアップ方法
1. データベースファイルのコピー
2. Prismaスキーマのバージョン管理

### リストア方法
1. データベースファイルの復元
2. マイグレーションの実行 