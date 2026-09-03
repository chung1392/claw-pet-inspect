# claw-pet を別のPCにセットアップする手順

USB などでコピーした `claw-pet` フォルダ（`node_modules` は含まれていません）を使って、別の Windows PC でセットアップする手順です。

## 1. Node.js をインストール

未インストールの場合、公式サイトから LTS 版を入れます。
https://nodejs.org/

## 2. フォルダを配置して依存パッケージをインストール

コピーしたフォルダを好きな場所に置きます（以下は `C:\Users\<ユーザー名>\claw-pet` を例にします）。

```
cd C:\Users\<ユーザー名>\claw-pet
npm install
npm start
```

画面右下にカニが表示されれば成功です。ウィンドウは枠なし・透明・常に最前面で、ドラッグで移動できます。

## 3. アニメーションの状態

| 状態 | トリガー | 見た目 |
| --- | --- | --- |
| 待機 | コマンド未実行 | 10秒に1回、両手を振る |
| 実行中 | コマンド実行開始（`start`） | ノートパソコンを両手でタイピング |
| 完了 | コマンド完了（`success`/`fail`） | 両手を振りながら5回ジャンプ（成功=明るい色／失敗=赤系） |

各シェルは「コマンド実行直前に `start`」「完了直後に `success`/`fail`」の2つのタイミングで `http://127.0.0.1:4848/event` に通知します。

## 4. シェル連携の設定

`hooks/` フォルダの中身を使って設定します。

### PowerShell

`hooks/powershell-profile.ps1` の中身を `$PROFILE` に追記します。PSReadLine の Enter キーハンドラを使って実行直前に `start` を送り、`prompt` 関数で完了後に `success`/`fail` を送ります。

- `$PROFILE` にまだ何もなければ、そのまま追記でOKです。
- すでに独自の `prompt` 関数がある場合は、上書きすると既存の機能が消えるので、その `prompt` 関数の中に `Send-ClawPetEvent` の呼び出しを1行差し込む形にしてください。

```powershell
# 例: 既存の prompt 関数内、コマンドの成否を判定した直後に追加
Send-ClawPetEvent -Status $(if ($ok) { 'success' } else { 'fail' })
```

### Git Bash

`~/.bashrc` に以下の1行を追記します。`DEBUG` トラップでコマンド実行直前に `start`、`PROMPT_COMMAND` で完了後に `success`/`fail` を送ります。

```bash
source "$HOME/claw-pet/hooks/bashrc-snippet.sh"
```

### Claude Code

`~/.claude/settings.json` に `hooks/claude-code-settings-snippet.json` の内容をマージします（`PreToolUse` で `start`、`PostToolUse` で `success`/`fail` を送信）。

**注意1**: スニペット内のパスが元のPCのユーザー名（`C:/Users/a_shi/claw-pet/...`）のままなので、**新しいPCのユーザー名・配置場所に書き換えてください**。

**注意2**: パスは必ず**スラッシュ区切り（`/`）**で書いてください。Claude Code はフックコマンドを POSIX シェル（Git Bash）経由で実行するため、`C:\Users\...` のようにバックスラッシュで書くとシェルがバックスラッシュをエスケープ文字として食べてしまい、`C:Usersa_shi...` に化けて `MODULE_NOT_FOUND` で失敗します。しかもこのエラーはどこにも表示されず、**カニが無反応になるだけ**なので原因が分かりません。

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node C:/Users/<ユーザー名>/claw-pet/hooks/claude-code-hook.js start"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node C:/Users/<ユーザー名>/claw-pet/hooks/claude-code-hook.js"
          }
        ]
      }
    ]
  }
}
```

`settings.json` のフック設定は保存した時点で反映されます（セッション再起動は不要）。反映されない場合のみ、Claude Code のセッションを再起動してください。

## 5. 動作確認

新しい PowerShell / Git Bash ウィンドウを開いてから、適当なコマンドを実行するとカニが反応します。手動でテストする場合は以下でも送信できます。

```
curl -X POST http://127.0.0.1:4848/event -H "Content-Type: application/json" -d "{\"status\":\"start\"}"
curl -X POST http://127.0.0.1:4848/event -H "Content-Type: application/json" -d "{\"status\":\"success\"}"
```

## トラブルシューティング

- カニが反応しない → `npm start` でアプリが起動しているか確認（ポート `4848` を使用）
- PowerShell で反応しない → 新しいウィンドウを開き直したか確認（プロファイルはウィンドウ起動時にのみ読み込まれる）
- Claude Code で反応しない → `~/.claude/settings.json` のフックのパスが **スラッシュ区切り**（`C:/Users/.../claude-code-hook.js`）かつユーザー名が一致しているか確認する。バックスラッシュ区切りだと無言で失敗する（上記「注意2」）
- フックが動いているか確かめたい → `hooks/claude-code-hook.js` の末尾に次の1行を足してツールを1回実行し、ログが書かれるか見る。確認できたら消す

  ```js
  try { require('fs').appendFileSync('C:/Users/<ユーザー名>/claw-pet/hook-debug.log', new Date().toISOString() + ' ' + JSON.stringify(process.argv.slice(2)) + '\n'); } catch {}
  ```
- タイピングのまま止まる → 短時間にコマンドを連続実行すると `start` が続けて送られ、ジャンプ演出が挟めないだけの場合がある。1つのコマンドが終わるまで待つと復帰する
