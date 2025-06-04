# テスト仕様書

## 概要

トーナメント管理アプリケーションのテスト仕様です。
ユニットテスト、統合テスト、E2Eテストの各レベルでのテスト方針と実装方法を定義します。

## テスト環境

### 使用ツール
- **テストフレームワーク**: Jest
- **E2Eテスト**: Playwright
- **テストカバレッジ**: Jest Coverage
- **モック**: Jest Mock

### 環境変数
```env
# テスト用データベース
DATABASE_URL="file:./test.db"

# テスト用APIキー
TEST_API_KEY="test-api-key"
```

## テストレベル

### 1. ユニットテスト

#### コンポーネントテスト
```typescript
// TournamentNode.test.tsx
describe('TournamentNode', () => {
  it('プレイヤーノードを正しく表示する', () => {
    // テストコード
  });

  it('マッチノードを正しく表示する', () => {
    // テストコード
  });

  it('ファイナルノードを正しく表示する', () => {
    // テストコード
  });
});
```

#### ユーティリティ関数テスト
```typescript
// tournament.test.ts
describe('tournament utils', () => {
  it('トーナメントの組み合わせを正しく生成する', () => {
    // テストコード
  });

  it('勝者を正しく判定する', () => {
    // テストコード
  });
});
```

### 2. 統合テスト

#### APIテスト
```typescript
// tournaments.test.ts
describe('Tournament API', () => {
  it('トーナメントを作成できる', async () => {
    // テストコード
  });

  it('トーナメント一覧を取得できる', async () => {
    // テストコード
  });
});
```

#### データベーステスト
```typescript
// database.test.ts
describe('Database', () => {
  it('トランザクションが正しく動作する', async () => {
    // テストコード
  });

  it('外部キー制約が正しく機能する', async () => {
    // テストコード
  });
});
```

### 3. E2Eテスト

#### トーナメント作成フロー
```typescript
// tournament-creation.spec.ts
describe('トーナメント作成', () => {
  it('トーナメントを作成し、参加者を追加できる', async () => {
    // テストコード
  });

  it('対戦組み合わせを生成できる', async () => {
    // テストコード
  });
});
```

#### 対戦進行フロー
```typescript
// match-progression.spec.ts
describe('対戦進行', () => {
  it('勝者を登録できる', async () => {
    // テストコード
  });

  it('立ち位置を設定できる', async () => {
    // テストコード
  });
});
```

## テストカバレッジ目標

- ステートメント: 80%以上
- ブランチ: 70%以上
- 関数: 80%以上
- 行: 80%以上

## テストデータ

### フィクスチャ
```typescript
// fixtures/tournaments.ts
export const sampleTournament = {
  name: 'テストトーナメント',
  description: 'テスト用トーナメント',
  participants: [
    { name: 'プレイヤー1' },
    { name: 'プレイヤー2' },
    { name: 'プレイヤー3' },
    { name: 'プレイヤー4' },
  ],
};
```

### モック
```typescript
// mocks/api.ts
export const mockApi = {
  getTournaments: jest.fn(),
  createTournament: jest.fn(),
  // ...
};
```

## テスト実行

### 開発時
```bash
# ユニットテスト実行
npm test

# 特定のテストファイル実行
npm test TournamentNode

# カバレッジレポート生成
npm test -- --coverage
```

### CI/CD
```bash
# 全テスト実行
npm run test:ci

# E2Eテスト実行
npm run test:e2e
```

## テスト自動化

### GitHub Actions
```yaml
name: Test

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm test
      - run: npm run test:e2e
```

## テストメンテナンス

### 定期的な確認項目
1. テストカバレッジの確認
2. 失敗したテストの分析
3. テストデータの更新
4. モックの更新

### テスト改善計画
1. テスト実行時間の最適化
2. テストデータの整理
3. テストケースの追加
4. カバレッジの向上 