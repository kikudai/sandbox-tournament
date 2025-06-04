# トーナメント図仕様書

## 概要

React Flowを使用したトーナメント図の実装仕様です。
トーナメントの構造を視覚的に表現し、対戦の流れを分かりやすく表示します。

## コンポーネント構成

### TournamentPreview

トーナメント図全体を管理するコンポーネント。

#### 機能
- トーナメント構造の表示
- ノードとエッジの管理
- ズーム・パン操作
- ミニマップ表示

#### プロパティ
```typescript
interface TournamentPreviewProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
}
```

### TournamentNode

トーナメントの各ノード（プレイヤー、マッチ）を表示するコンポーネント。

#### 機能
- カスタムノードデザイン
- 左右のハンドル（接点）制御
- ノードの状態表示

#### プロパティ
```typescript
interface TournamentNodeProps {
  data: {
    label: string;
    source?: boolean;
    target?: boolean;
    hideSource?: boolean;
    hideTarget?: boolean;
  };
}
```

## ノードタイプ

### プレイヤーノード
- 位置: 左端
- ハンドル: 右側のみ（source）
- 表示内容: プレイヤー名

### マッチノード
- 位置: 中央
- ハンドル: 左右両方（source, target）
- 表示内容: マッチ名

### ファイナルノード
- 位置: 右端
- ハンドル: 左側のみ（target）
- 表示内容: "Final"

## エッジ（接続線）

### 接続ルール
- プレイヤー → マッチ
- マッチ → マッチ
- マッチ → ファイナル

### スタイル
- 色: #555
- 太さ: 1px
- アニメーション: なし

## レイアウト

### ノード配置
- プレイヤー: 左端、縦方向に均等配置
- マッチ: 中央、縦方向に均等配置
- ファイナル: 右端、中央配置

### スペーシング
- 水平方向: 200px
- 垂直方向: 100px

## インタラクション

### ドラッグ&ドロップ
- ノードの移動可能
- グリッドにスナップ

### ズーム
- マウスホイール
- コントロールパネル

### パン
- ドラッグ
- コントロールパネル

## スタイリング

### ノード
```css
{
  padding: 16px;
  border: 1px solid #bbb;
  border-radius: 8px;
  background: #fff;
  min-width: 120px;
  text-align: center;
}
```

### ハンドル
```css
{
  background: #555;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
```

## 今後の拡張予定

1. 勝者表示機能
   - 勝者のハイライト
   - スコア表示

2. アニメーション
   - 接続線のアニメーション
   - 勝者決定時のアニメーション

3. カスタマイズ
   - ノードのデザインカスタマイズ
   - 色テーマの切り替え 