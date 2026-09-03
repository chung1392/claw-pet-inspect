# claw-pet

Claude のマスコット「Clawd」がデスクトップ右下に常駐し、ターミナルのコマンド結果に反応するペットです。

## 起動

```
cd C:\Users\a_shi\claw-pet
npm start
```

起動すると `http://127.0.0.1:4848` でイベント受付サーバーが立ち上がります。
ウィンドウは枠なし・透明・常に最前面で、ドラッグで移動できます。終了はタスクマネージャから `electron.exe` を終了してください。

## 動作

`clawd-final.png` のスプライトシートをそのまま使ってアニメーションします。
1 行 = 1 クリップで、状態ごとに再生するクリップを組み合わせています。

| 状態 | 動き |
| --- | --- |
| 待機 | まばたきしながら待機。ときどき手をふる／のびをする／歩く |
| 90 秒放置 | 目を閉じて寝る（イベントが来ると起きる） |
| 実行中 (`start`) | 片手を上げてから、ノート PC を高速タイピング |
| 成功 (`success`) | 両手を上げて 3 回バンザイ＋ジャンプ＋キラキラ、最後に手をふる |
| 失敗 (`fail`) | 赤くなってうなだれ、ぷるぷる震えてから、のびをして復帰 |

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
main.js                        Electron メインプロセス + HTTP サーバー
preload.js                     IPC ブリッジ
renderer/index.html            スプライト 1 枚だけの DOM
renderer/style.css             配置と、状態ごとの動き（バブ・ジャンプ・震え）
renderer/clawd.js              スプライトのフレーム再生と状態マシン
renderer/clawd-sheet.png       整列済みスプライトシート（92x76 x 8列 x 12行）
build-sheet.py                 clawd-final.png からシートを生成（Pillow + numpy）
clawd-final.png                元のスプライトシート（192x208 グリッド）
hooks/                         各シェル向けフックスクリプト
```

## スプライトシートの作り直し

`clawd-final.png` を差し替えたら、行ごとのフレーム数を `build-sheet.py` の
`ROW_FRAMES` に合わせたうえで再生成します。表示サイズは `SCALE`、背の高さは
`SQUASH_Y`（縦の圧縮率、1.0 で元の比率）で調整でき、変えたら `renderer/clawd.js` の `FRAME_H` と
`style.css` の `#clawd { height }` を新しいフレーム高さに合わせてください。

```
pip install pillow numpy
python build-sheet.py
```

行の並びは `renderer/clawd.js` の `CLIPS` と対応しています（0=待機, 1/2=歩く,
3=片手を上げる, 4=ジャンプ, 5=のび, 6=手をふる, 7=タイピング, 8=バンザイ,
9=うなだれ, 10=居眠り, 11=うなだれの赤色版・自動生成）。
