# 月極駐車場管理システム

月極駐車場の契約・支払い管理を行う Web アプリケーション

## 技術スタック

- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend / Hosting / DB: Supabase
- Payments: Stripe Checkout

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Supabase プロジェクトの作成と設定

1. [Supabase](https://supabase.com/)にアクセスし、アカウントを作成
2. 新しいプロジェクトを作成

   - Organization: 新規作成または既存のものを選択
   - プロジェクト名: 任意（例: parking-management）
   - データベースパスワード: 安全なパスワードを設定
   - リージョン: 東京（または最寄りのリージョン）

3. データベーステーブルの作成

   - プロジェクトのダッシュボードを開く
   - 左メニューから「SQL Editor」を選択
   - 新規クエリを作成
   - `setup/init.sql`の内容をコピー＆ペースト
   - 「Run」ボタンをクリックしてテーブルを作成
   - テーブルが作成されたことを「Table Editor」で確認

4. API 設定の取得
   - 左メニューから「Project Settings」を選択
   - 「API」タブを開く
   - 以下の情報をメモ
     - Project URL（`VITE_SUPABASE_URL`に使用）
     - anon/public key（`VITE_SUPABASE_ANON_KEY`に使用）

### 3. 環境変数の設定

```bash
cp .env.example .env
```

.env ファイルを編集し、以下の値を設定：

```
# Supabaseの設定（必須）
VITE_SUPABASE_URL=あなたのプロジェクトURL
VITE_SUPABASE_ANON_KEY=あなたの匿名キー

# アプリケーション設定
VITE_MONTHLY_PRICE=3500

# Stripe設定（必須）
VITE_STRIPE_PUBLISHABLE_KEY=あなたのStripe公開キー
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

## データベース構造

### contractors（契約者）テーブル

| カラム名       | 型        | 説明                 |
| -------------- | --------- | -------------------- |
| id             | UUID      | 主キー               |
| name           | text      | 契約者名（ユニーク） |
| parking_number | text      | 駐車スペース番号     |
| created_at     | timestamp | 登録日               |

### payments（支払い履歴）テーブル

| カラム名                 | 型        | 説明                                     |
| ------------------------ | --------- | ---------------------------------------- |
| id                       | UUID      | 主キー                                   |
| contractor_id            | UUID      | 外部キー                                 |
| year                     | int       | 支払年                                   |
| month                    | int       | 支払月                                   |
| amount                   | int       | 金額（円）                               |
| paid_at                  | timestamp | 支払日時                                 |
| stripe_payment_intent_id | text      | Stripe 支払 ID                           |
| stripe_session_id        | text      | Stripe セッション ID                     |
| status                   | text      | 支払い状態（completed, pending, failed） |

※ contractor_id, year, month の組み合わせに UNIQUE 制約あり

## 機能一覧

### 契約者向け機能

- 名前による簡易アクセス（ログイン不要）
- 未払い月の確認（最大 12 か月前まで）
- 支払い月数の選択（複数月の一括支払い可能）
- 支払い履歴の確認
- 領収書の PDF ダウンロード

### オーナー向け機能

- 契約者一覧の表示
- 契約者ごとの支払い状況確認
- 支払い履歴の確認
- 領収書の発行

## アプリケーション構造

### コンポーネント設計（Atomic Design）

```
src/
  ├── components/
  │   ├── atoms/      # 基本的なUIパーツ
  │   │   ├── ArrowIcon.tsx
  │   │   └── PaymentButton.tsx
  │   ├── molecules/  # 複合的なUIコンポーネント
  │   │   ├── Header.tsx
  │   │   └── ErrorDisplay.tsx
  │   └── organisms/ # 機能を持ったコンポーネント
  ├── pages/         # ページコンポーネント
  │   ├── owner/     # オーナー向けページ
  │   └── contractor/# 契約者向けページ
  ├── lib/          # ユーティリティ関数とAPI
  └── types/        # 型定義
```

### API クライアント設計

```
src/lib/
  ├── api.ts           # APIクライアント（支払い処理）
  ├── supabase.ts      # Supabaseクライアント
  ├── stripe.ts        # Stripe統合
  └── generateReceipt.ts # PDF生成
```

## アクセス方法

1. オーナーダッシュボード

   ```
   http://localhost:5173/owner
   ```

2. 契約者ページ（例）
   ```
   http://localhost:5173/contractor/山田太郎
   http://localhost:5173/contractor/佐藤花子
   ```

## 開発環境

- Node.js 18 以上
- npm 9 以上
- Git
