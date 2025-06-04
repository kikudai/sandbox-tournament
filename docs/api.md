# API仕様書

## 概要

トーナメント管理アプリケーションのAPI仕様です。
Next.jsのAPI Routesを使用して実装されています。

## エンドポイント一覧

### トーナメント

#### トーナメント一覧取得
```http
GET /api/tournaments
```

##### レスポンス
```json
{
  "tournaments": [
    {
      "id": "string",
      "name": "string",
      "description": "string | null",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ]
}
```

#### トーナメント作成
```http
POST /api/tournaments
```

##### リクエスト
```json
{
  "name": "string",
  "description": "string | null"
}
```

##### レスポンス
```json
{
  "id": "string",
  "name": "string",
  "description": "string | null",
  "createdAt": "string",
  "updatedAt": "string"
}
```

#### トーナメント詳細取得
```http
GET /api/tournaments/:id
```

##### レスポンス
```json
{
  "id": "string",
  "name": "string",
  "description": "string | null",
  "participants": [
    {
      "id": "string",
      "name": "string"
    }
  ],
  "matches": [
    {
      "id": "string",
      "round": "number",
      "player1": {
        "id": "string",
        "name": "string"
      },
      "player2": {
        "id": "string",
        "name": "string"
      },
      "winner": {
        "id": "string",
        "name": "string"
      } | null
    }
  ],
  "createdAt": "string",
  "updatedAt": "string"
}
```

### 参加者

#### 参加者一覧取得
```http
GET /api/tournaments/:tournamentId/participants
```

##### レスポンス
```json
{
  "participants": [
    {
      "id": "string",
      "name": "string",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ]
}
```

#### 参加者追加
```http
POST /api/tournaments/:tournamentId/participants
```

##### リクエスト
```json
{
  "name": "string"
}
```

##### レスポンス
```json
{
  "id": "string",
  "name": "string",
  "createdAt": "string",
  "updatedAt": "string"
}
```

### 対戦

#### 対戦一覧取得
```http
GET /api/tournaments/:tournamentId/matches
```

##### レスポンス
```json
{
  "matches": [
    {
      "id": "string",
      "round": "number",
      "player1": {
        "id": "string",
        "name": "string"
      },
      "player2": {
        "id": "string",
        "name": "string"
      },
      "winner": {
        "id": "string",
        "name": "string"
      } | null,
      "positions": [
        {
          "id": "string",
          "name": "string",
          "participant": {
            "id": "string",
            "name": "string"
          }
        }
      ]
    }
  ]
}
```

#### 対戦作成
```http
POST /api/tournaments/:tournamentId/matches
```

##### リクエスト
```json
{
  "round": "number",
  "player1Id": "string",
  "player2Id": "string"
}
```

##### レスポンス
```json
{
  "id": "string",
  "round": "number",
  "player1": {
    "id": "string",
    "name": "string"
  },
  "player2": {
    "id": "string",
    "name": "string"
  },
  "winner": null,
  "createdAt": "string",
  "updatedAt": "string"
}
```

#### 勝者登録
```http
PATCH /api/tournaments/:tournamentId/matches/:matchId/winner
```

##### リクエスト
```json
{
  "winnerId": "string"
}
```

##### レスポンス
```json
{
  "id": "string",
  "round": "number",
  "player1": {
    "id": "string",
    "name": "string"
  },
  "player2": {
    "id": "string",
    "name": "string"
  },
  "winner": {
    "id": "string",
    "name": "string"
  },
  "updatedAt": "string"
}
```

### 立ち位置

#### 立ち位置一覧取得
```http
GET /api/tournaments/:tournamentId/matches/:matchId/positions
```

##### レスポンス
```json
{
  "positions": [
    {
      "id": "string",
      "name": "string",
      "participant": {
        "id": "string",
        "name": "string"
      }
    }
  ]
}
```

#### 立ち位置登録
```http
POST /api/tournaments/:tournamentId/matches/:matchId/positions
```

##### リクエスト
```json
{
  "name": "string",
  "participantId": "string"
}
```

##### レスポンス
```json
{
  "id": "string",
  "name": "string",
  "participant": {
    "id": "string",
    "name": "string"
  },
  "createdAt": "string",
  "updatedAt": "string"
}
```

## エラーレスポンス

### 400 Bad Request
```json
{
  "error": "string",
  "message": "string"
}
```

### 404 Not Found
```json
{
  "error": "string",
  "message": "string"
}
```

### 500 Internal Server Error
```json
{
  "error": "string",
  "message": "string"
}
```

## 認証・認可

現在は認証・認可機能は実装されていません。
将来的な実装予定：

1. JWT認証
2. ロールベースのアクセス制御
3. APIキー認証

## レート制限

現在はレート制限は実装されていません。
将来的な実装予定：

1. IPアドレスベースの制限
2. ユーザーごとの制限
3. エンドポイントごとの制限 