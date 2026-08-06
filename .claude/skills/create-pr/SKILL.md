---
name: create-pr
description: 変更差分からコミットメッセージと PR 本文を作成して Pull Request を出す。「PRを作って」「プルリク出して」「コミットして」と言われたときに使う。
---

# コミット + PR 作成

## 手順

### 1. 変更内容を把握する

```bash
git status
git diff
git diff --staged
git log --oneline -10
```

- 何が変更されたかを自分で読んで理解する（差分の要約を推測で書かない）
- 意図しないファイル（ビルド成果物、`.env`、スクラッチファイル）が含まれていないか確認する

### 2. 検証する

コミット前に以下を通す。失敗したらコミットせず報告する。

```bash
pnpm lint
pnpm typecheck
pnpm test
```

### 3. ブランチを確認する

`main` にいる場合は、コミット前に必ずブランチを切る。

命名規則（`docs/coding-standards.md`）:
`feature/*`（機能追加） / `fix/*`（バグ修正） / `add/*`（追加） / `refactor/*`（リファクタ）

### 4. コミットメッセージを作る

`<prefix>: <日本語の要約>` 形式。prefix は `feat:` `fix:` `add:` `docs:` `refactor:` `test:` `chore:`。

例: `feat: カテゴリマスタの一覧・編集機能を追加`

- 1行目は50文字程度まで。何をしたかを日本語で簡潔に
- 変更が複数の関心事にまたがる場合は、**コミットを分けることを提案**する

### 5. ユーザーの承認を得る（必須）

コミットメッセージ案と PR 本文案を提示し、**ユーザーの承認を得てから** `git commit` / `git push` を実行する。
承認なしにコミット・プッシュしない。

### 6. PR を作成する

```bash
git push -u origin <branch>
gh pr create --title "<タイトル>" --body "$(cat <<'EOF'
## 概要
（何を・なぜ）

## 変更内容
- （箇条書き）

## 関連ドキュメント
- 詳細設計書: docs/design/<機能名>.md
- 対象要件: 要件定義書「5-X. ○○機能」

## 確認手順
1. `pnpm dev` で起動
2. （確認する画面と操作）

## 検証結果
- [x] pnpm lint
- [x] pnpm typecheck
- [x] pnpm test

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

PR 本文は日本語で書く。

### 7. 完了報告

PR の URL をマークダウンリンクで報告する。

## 注意

- コミットメッセージ末尾には `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` を付ける
- `git push --force` は使わない
- 差分に含まれていない変更を PR 本文に書かない（実際の差分だけを記述する）
- `docs/tasks.md` があれば、該当タスクの状態を `完了` に更新することを提案する
