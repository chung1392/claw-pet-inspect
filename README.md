# claw-pet

Claude のマスコット「Clawd」がデスクトップ右下に常駐し、ターミナルのコマンド結果に反応するペットです。

## 起動

```
cd C:\Users\user\claw-pet-inspect
npm start
```

起動すると `http://127.0.0.1:4848` でイベント受付サーバーが立ち上がります。
ウィンドウは枠なし・透明・常に最前面で、ドラッグで移動できます。終了はタスクマネージャから `electron.exe` を終了してください。

## 動作

| 状態 | 見た目 |
| --- | --- |
| 待機 | ゆっくり上下に揺れる |
| 成功 (`success`) | 明るい色でジャンプ＋キラキラ |
| 失敗 (`fail`) | 赤くなって左右に震える |

## 手動でイベントを送る

```
curl -X POST http://127.0.0.1:4848/event -H "Content-Type: application/json" -d "{\"status\":\"success\"}"
```

## 設定済みのフック

| 環境 | 設定先 | 内容 |
| --- | --- | --- |
| PowerShell | `$PROFILE` | 既存の `prompt` 関数内から `Send-ClawPetEvent` を呼び出し |
| Git Bash | `~/.bashrc` | `hooks/bashrc-snippet.sh` を source（`PROMPT_COMMAND` 経由） |
| Claude Code | `~/.claude/settings.json` | `PostToolUse`(Bash) から `hooks/claude-code-hook.js` を実行 |

`$PROFILE` の変更前バックアップ: `Microsoft.PowerShell_profile.ps1.bak-clawpet`

## ファイル構成

```
main.js                              Electron メインプロセス + HTTP サーバー
preload.js                           IPC ブリッジ
renderer/index.html, style.css, crab.js  ドット絵カニの描画とアニメーション
hooks/                               各シェル向けフックスクリプト
```
