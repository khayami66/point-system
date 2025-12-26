# 開発進捗ログ：ごほうびポイント管理システム

このドキュメントでは、開発の進捗を時系列で記録します。

---

## 目次

1. [Phase 0: LINE Bot開発（v1）](#phase-0-line-bot開発v1)
2. [Webアプリ開発 壁打ち](#webアプリ開発-壁打ち)
3. [Phase 0: Webアプリ基盤構築](#phase-0-webアプリ基盤構築)
4. [Phase 1: MVP（設定画面）](#phase-1-mvp設定画面)

---

## Phase 0: LINE Bot開発（v1）

### 2025-12-03 - プロジェクト開始

**作業内容:**
- ChatGPT との壁打ち結果をもとに要件定義の確認を実施
- 技術構成、データ構造、機能仕様を確定

**決定事項:**
- フレームワーク: Flask
- データ永続化: Google Sheets API
- 認証: サービスアカウント方式（環境変数にJSON格納）
- ホスティング: Render

---

### 2025-12-03 - アプリケーション実装完了

**作業内容:**
- Flask アプリケーション基盤の実装
- Google Sheets API 連携モジュールの実装
- LINE Messaging API 連携の実装
- メッセージ処理ロジックの実装

**作成ファイル:**
- `requirements.txt` - Python依存パッケージ
- `config.py` - アプリケーション設定
- `sheets_service.py` - Google Sheets操作
- `message_handler.py` - メッセージ処理ロジック
- `app.py` - Flaskメインアプリケーション
- `Procfile` - Render起動設定
- `render.yaml` - Render Blueprint設定

**実装した機能:**
1. 行動記録機能（宿題、スタスタ、早寝、お手伝い）
2. 今日のポイント確認機能
3. ごほうび状況確認機能
4. ごほうび達成時の自動通知
5. 未対応キーワードへの応答

---

### 2025-12-03 - 本番デプロイ完了

**作業内容:**
- GitHub リポジトリ作成（khayami66/point-system）
- Render で Web Service を作成・デプロイ
- LINE Webhook URL 設定

**本番環境:**
- URL: https://point-system-eg8k.onrender.com
- ステータス: Live（稼働中）

---

## Webアプリ開発 壁打ち

### 2025-12-26 - Webアプリ化の検討

**目的:**
LINE Botと連携し、各家庭でカスタマイズ可能なWebアプリを開発する

**壁打ちで決定した事項:**

| 項目 | 決定内容 |
|------|----------|
| 対象ユーザー | 年長〜小学校低学年の子を持つ保護者 |
| LINE Bot | 継続利用（日常の行動記録用） |
| Webアプリ | 新規作成（設定・閲覧用） |
| 認証 | 保護者: LINE/Google、子ども: URL共有（ログイン不要） |
| URL形式 | ランダム文字列（推測困難） |
| UI方針 | モバイルファースト |
| DB | Supabase (PostgreSQL) |
| フロントエンド | Next.js (React) |
| ホスティング | Vercel |

**MVP（最小機能）:**
- 設定画面（行動・ポイントのカスタマイズ）

**将来の拡張:**
1. 成果確認画面（グラフ・カレンダー）
2. バッジ・称号
3. レベルアップシステム
4. アバター・キャラクター育成（進化式）

**設計書作成:**
- `docs/WEB_APP_DESIGN.md` - 詳細設計書
- `docs/ROADMAP.md` - 開発ロードマップ

---

## Phase 0: Webアプリ基盤構築

### 2025-12-26 - Supabaseプロジェクト作成

**作業内容:**
- Supabaseアカウント作成
- プロジェクト初期化（Region: Northeast Asia Tokyo）

**設定:**
- Project URL: https://vvgafozdvejejwnsasvo.supabase.co
- 環境変数を `.env` に追加

---

### 2025-12-26 - データベース設計・構築

**作業内容:**
- Supabase SQL EditorでDDLを実行
- 6テーブルを作成

**作成テーブル:**

| テーブル | 説明 |
|----------|------|
| families | 家庭情報、共有コード |
| children | 子どもの名前、ポイント |
| actions | 行動マスタ（行動名、ポイント数） |
| records | 行動記録 |
| goals | 目標（ごほうび内容） |
| user_families | ユーザーと家庭の紐付け |

**設定:**
- Row Level Security (RLS) 有効化
- 各テーブルにアクセスポリシー設定
- updated_at 自動更新トリガー作成

---

### 2025-12-26 - Next.jsプロジェクト作成

**作業内容:**
- `web/` ディレクトリにNext.jsプロジェクト作成
- Supabaseクライアントライブラリインストール

**コマンド:**
```bash
npx create-next-app@latest web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
npm install @supabase/supabase-js @supabase/ssr
```

**作成ファイル:**
- `web/src/lib/supabase.ts` - ブラウザ用クライアント
- `web/src/lib/supabase-server.ts` - サーバー用クライアント
- `web/src/types/database.ts` - 型定義
- `web/src/middleware.ts` - 認証ミドルウェア

---

### 2025-12-26 - 認証設定

**作業内容:**
- Google OAuth設定（Google Cloud Console）
- Supabase Authentication設定

**設定内容:**
- Google Cloud ConsoleでOAuthクライアントID作成
- Supabase ProvidersでGoogle認証を有効化
- リダイレクトURI設定

**作成ファイル:**
- `web/src/app/login/page.tsx` - ログインページ
- `web/src/app/auth/callback/route.ts` - 認証コールバック
- `web/src/app/auth/signout/route.ts` - ログアウト

---

### 2025-12-26 - Vercelデプロイ

**作業内容:**
- GitHubにコードプッシュ
- Vercelプロジェクト作成
- 環境変数設定
- 初回デプロイ

**設定:**
- Root Directory: `web`
- Framework: Next.js
- 環境変数: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

**本番URL:**
- https://point-system-web.vercel.app

**動作確認:**
- Googleログイン: 成功

---

## Phase 1: MVP（設定画面）

### 2025-12-26 - 家庭の初期設定・ユーザー連携

**作業内容:**
- 初回ログイン時に家庭（family）を自動作成
- ユーザーと家庭の紐付け
- ランダムな共有コード生成

**作成ファイル:**
- `web/src/lib/family.ts` - 家庭管理ユーティリティ

**更新ファイル:**
- `web/src/app/dashboard/page.tsx` - ダッシュボード改良

---

### 2025-12-26 - 子ども登録画面

**作業内容:**
- 子どもの追加・編集・削除機能
- 名前・ニックネームの入力

**作成ファイル:**
- `web/src/app/settings/children/page.tsx`

**機能:**
- 子どもリスト表示
- 追加フォーム
- 編集機能
- 削除機能（確認ダイアログ付き）

---

### 2025-12-26 - 行動マスタ設定画面

**作業内容:**
- 行動の追加・編集・削除機能
- ポイント数の設定
- 有効/無効の切り替え

**作成ファイル:**
- `web/src/app/settings/actions/page.tsx`

**機能:**
- 行動リスト表示
- 行動名・ポイント数入力
- 有効/無効トグル（チェックボックス）
- 編集・削除機能

---

### 2025-12-26 - 目標設定画面

**作業内容:**
- 目標（ごほうび）の追加・編集・削除機能
- 必要ポイント数の設定（任意）
- 達成済みチェック

**作成ファイル:**
- `web/src/app/settings/goals/page.tsx`

**機能:**
- 目標リスト表示
- 目標タイトル・詳細・必要ポイント入力
- 達成済みトグル
- 編集・削除機能

---

### 2025-12-26 - 共有URL発行

**作業内容:**
- 子ども用閲覧URLの表示
- URLコピー機能

**作成ファイル:**
- `web/src/app/settings/share/page.tsx`

**機能:**
- 共有URL表示
- クリップボードへコピー
- 注意事項表示

---

### 2025-12-26 - Phase 1 デプロイ完了

**作業内容:**
- GitHubにプッシュ
- Vercel自動デプロイ

**コミット:**
```
Add Phase 1 MVP settings pages

- Add family auto-creation on first login
- Add children settings page (CRUD)
- Add actions/points settings page (CRUD)
- Add goals settings page (CRUD)
- Add share URL page for child viewing
- Update dashboard with status indicators
```

**動作確認:**
- ダッシュボード表示: 成功
- 子ども登録: 成功
- 行動・ポイント設定: 成功
- 目標設定: 成功
- 共有URL確認: 成功
- コンソールエラー: なし

---

## Phase 2: LINE Bot連携（Supabase接続）

### 2025-12-26 - Supabaseサービス実装

**作業内容:**
- LINE Bot用Supabaseサービスクラス作成
- LINEユーザーと家庭の紐付けテーブル作成

**作成ファイル:**
- `supabase_service.py` - Supabase操作クラス

**作成テーブル:**

| テーブル | 説明 |
|----------|------|
| line_user_families | LINEユーザーIDと家庭の紐付け |

**実装メソッド:**
- `get_family_by_line_user()` - LINEユーザーから家庭取得
- `link_line_user_to_family()` - 共有コードで紐付け
- `get_actions()` - 家庭の行動マスタ取得
- `get_children()` - 家庭の子どもリスト取得
- `add_record()` - 行動記録追加
- `update_child_points()` - ポイント更新
- `get_today_summary()` - 今日のサマリー取得
- `get_goals()` - 目標リスト取得

---

### 2025-12-26 - メッセージハンドラーv2実装

**作業内容:**
- Supabase対応のメッセージ処理クラス作成
- 家庭紐付けコマンド対応

**作成ファイル:**
- `message_handler_v2.py` - Supabase版メッセージ処理

**新機能:**
- 「登録 {共有コード}」コマンドで家庭紐付け
- Supabaseから行動マスタを動的に取得
- 子ども名の表示対応
- 目標表示機能

---

### 2025-12-26 - データソース切り替え対応

**作業内容:**
- app.pyをSupabase/Sheets両対応に更新
- config.pyにSupabase設定追加
- requirements.txtにsupabaseライブラリ追加

**更新ファイル:**
- `app.py` - データソース切り替えロジック
- `config.py` - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATA_SOURCE追加
- `requirements.txt` - supabase==2.10.0追加

**環境変数:**

| 変数名 | 説明 |
|--------|------|
| SUPABASE_URL | SupabaseプロジェクトURL |
| SUPABASE_SERVICE_ROLE_KEY | サービスロールキー |
| DATA_SOURCE | 'supabase' or 'sheets' |

---

### 2025-12-26 - Phase 2 デプロイ

**作業内容:**
- GitHubにプッシュ
- Render環境変数設定（待ち）

**コミット:**
```
Add Supabase integration for LINE Bot (Phase 2)

- Add supabase_service.py for database operations
- Add message_handler_v2.py for Supabase-based message handling
- Update app.py to support both Supabase and Google Sheets data sources
- Update config.py with Supabase configuration
- Add supabase library to requirements.txt
- Support LINE user to family linking via share code
```

**Renderに設定する環境変数:**
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- DATA_SOURCE=supabase

---

## 現在のステータス

### LINE Bot (v2)
- **ステータス**: デプロイ待ち
- **URL**: https://point-system-eg8k.onrender.com
- **データ**: Supabase（環境変数設定後）

### Webアプリ (Phase 1完了)
- **ステータス**: 稼働中
- **URL**: https://point-system-web.vercel.app
- **データ**: Supabase

### 次のステップ
- **Phase 2完了後**: LINE Bot動作テスト
- **Phase 3**: 子ども用閲覧ページ（/view/[shareCode]）

---

## 技術スタック

| レイヤー | 技術 | ホスティング |
|----------|------|--------------|
| LINE Bot | Python + Flask | Render |
| Webアプリ | Next.js (React) + TypeScript | Vercel |
| データベース | Supabase (PostgreSQL) | Supabase Cloud |
| 認証 | Supabase Auth (Google OAuth) | - |
| スタイリング | Tailwind CSS | - |

---

## リポジトリ

- GitHub: https://github.com/khayami66/point-system
