# 月極駐車場管理システム

月極駐車場の契約・支払い管理を行うWebアプリケーション

## 技術スタック

- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend / Hosting / DB: Supabase
- Payments: Stripe Checkout

## 開発環境のセットアップ

### 1. 依存関係のインストール
```bash
npm install
```

### 2. Supabaseプロジェクトの作成と設定

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

4. API設定の取得
   - 左メニューから「Project Settings」を選択
   - 「API」タブを開く
   - 以下の情報をメモ
     - Project URL（`VITE_SUPABASE_URL`に使用）
     - anon/public key（`VITE_SUPABASE_ANON_KEY`に使用）

5. RLSポリシーの設定（オプション）
   - 「Authentication」→「Policies」で各テーブルのアクセス権を設定
   - 開発時は一時的にすべての操作を許可することも可能

### 3. 環境変数の設定
```bash
cp .env.example .env
```

.envファイルを編集し、以下の値を設定：
```
# Supabaseの設定（必須）
VITE_SUPABASE_URL=あなたのプロジェクトURL
VITE_SUPABASE_ANON_KEY=あなたの匿名キー

# Stripeの設定（テスト用）
VITE_STRIPE_PUBLIC_KEY=Stripeのパブリックキー

# アプリケーション設定
VITE_MONTHLY_PRICE=3500
VITE_API_URL=http://localhost:3000/api
```

### 4. 開発サーバーの起動
```bash
npm run dev
```

### 5. 動作確認
1. ブラウザで http://localhost:5173 を開く
2. 以下のURLでそれぞれの機能を確認
   - オーナーダッシュボード: http://localhost:5173/owner
   - 契約者ページ: http://localhost:5173/contractor/山田太郎（サンプルデータの名前）

## データベース構造

### contractors（契約者）テーブル
| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | UUID | 主キー |
| name | text | 契約者名（ユニーク） |
| parking_number | text | 駐車スペース番号 |
| created_at | timestamp | 登録日 |

### payments（支払い履歴）テーブル
| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | UUID | 主キー |
| contractor_id | UUID | 外部キー |
| year | int | 支払年 |
| month | int | 支払月 |
| amount | int | 金額（円） |
| paid_at | timestamp | 支払日時 |
| stripe_payment_intent_id | text | Stripe支払ID |

## 機能一覧

### 契約者向け機能
- 名前による簡易アクセス（ログイン不要）
- 月額支払いの選択と決済
- 支払い履歴の確認
- 領収書のPDFダウンロード

### オーナー向け機能
- 契約者一覧の表示
- 契約者ごとの支払い状況確認
- 支払い履歴の確認

## ディレクトリ構造

```
src/
  ├── components/    # Atomic Designベースのコンポーネント
  │   ├── atoms/    # 基本的なUIパーツ
  │   ├── molecules/# 複合的なUIコンポーネント
  │   └── organisms/# 機能を持ったコンポーネント
  ├── pages/        # ページコンポーネント
  │   ├── owner/    # オーナー向けページ
  │   └── contractor/# 契約者向けページ
  ├── lib/         # ユーティリティ関数とAPI
  └── types/       # 型定義
```

## ルーティング

- `/owner` - オーナーダッシュボード
- `/owner/contractor/:id` - 契約者詳細
- `/contractor/:name` - 契約者ページ
