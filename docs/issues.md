# 課題一覧

このプロジェクトの課題（バグ・改善案・検討事項）を記録するドキュメントです。
課題は GitHub Issues ではなく、このファイルで管理します。

## 書き方

- 新しい課題は「未対応」の末尾に `### <番号>. <タイトル>` で追加する。番号は既存の最大番号 + 1 を使う。
- 対応が済んだ課題は「対応済み」へ移し、対応した日付とコミット（または PR）を書き添える。
- `GitHub #n` は GitHub Issues から移行した課題の元の番号。

## 未対応

### 7. バンドルサイズが 500kB を超えている（Vuetify の全 import と未使用の Pinia）

GitHub #7 から移行（2026-10-28 起票）

#### 現象
`npm run build` で「Some chunks are larger than 500 kB after minification」という警告が出ます。

#### 原因
- `src/main.ts` で `vuetify/components` と `vuetify/directives` を丸ごと import しており、tree-shaking が効いていない。
- Pinia を登録しているが store が1つもなく、使われていない。

#### 修正案
- `vite-plugin-vuetify` を導入して autoImport に切り替え、使っているコンポーネントだけを取り込む。
  （コンポーネントテストも全コンポーネントを登録しているので、あわせて見直す）
- Pinia の依存と `main.ts` での登録を削除する（CLAUDE.md の記述も更新）。

### 8. 大きいグリッド（100×100）で描画が重い

GitHub #8 から移行（2026-10-28 起票）

#### 現状
- 1セルにつき1つの `div` と click ハンドラを生成しているため、100×100 では 1 万要素になる。
- 毎世代 `nextGeneration` で `dataMap` を丸ごと差し替えるので、全セルが再描画される。
- 更新間隔は最短 0.1 秒なので、端末によってはフレーム落ちしやすい。

#### 改善案（いずれか）
- 盤面を Canvas で描画し、クリック位置からセルを求める。
- `v-memo` で行単位に描画をキャッシュし、変化した行だけ再描画する。
- click ハンドラを親要素 `.map` に1つだけ置いて委譲する。

着手前に、100×100・0.1 秒間隔で実際にどれくらい重いかを計測するとよい。

### 9. グリッドのリサイズ時に Generation カウンタがリセットされない

GitHub #9 から移行（2026-10-28 起票）

#### 現状
Random / Clear では `generation` を 0 に戻しますが、Height / Width によるリサイズ（`changeDataMapSize`）では戻しません。

#### 検討事項
リサイズで盤面が変わる（セルが切り捨てられる）ので、カウンタも 0 に戻すほうが Random / Clear と挙動がそろいます。ただし「サイズを変えても世代を引き継ぐ」のが意図した仕様であれば、変更は不要です。仕様を決めたうえで対応する。

### 10. アクセシビリティ: セルをキーボードで操作できず、スライダーのラベルも関連付いていない

GitHub #10 から移行（2026-10-28 起票）

#### 現状
- セル（`.box`）がただの `div` で、`tabindex`・`role`・`aria-*` がない。キーボードやスクリーンリーダーでは盤面を編集できない。
- `<label for="interval-slider">` を付けているが、`id` は `v-slider` に渡しているだけで、実際の入力要素に関連付いていない可能性がある。

#### 修正案
- セルを `<button>` にし、`aria-pressed`（生死）と `aria-label`（例: 「3行目 5列目」）を付ける。100×100 ではフォーカスできる要素が 1 万個になるので、矢印キーで移動する roving tabindex の採用も検討する。
- スライダーには `v-slider` の `label` prop か `aria-label` を使う。

### 11. テストの不足（App のテストが import 確認のみ、E2E で未カバーの機能がある）

GitHub #11 から移行（2026-10-28 起票）

#### 現状
- `src/components/__tests__/App.test.ts` は `App` を import できるかを確かめているだけ。
- E2E テスト（`cypress/e2e/life-game.cy.ts`）で次の機能を確認していない:
  - Random ボタン
  - Clear ボタン（盤面が全部 `.death` になり、Generation が 0 に戻る）
  - 実行中に Generation 表示が増えること
  - 速度スライダー

#### 修正案
- `App.test.ts` を、マウントして `LifeGame` / `AboutGame` / `Note` が描画されることを確かめる内容にする。
- 上の機能について E2E のケースを追加する。

### 12. ドキュメントの古い記述（CLAUDE.md の Note.vue、README の IDE 推奨）

GitHub #12 から移行（2026-10-28 起票）

#### 古くなっている箇所
- **CLAUDE.md**: `src/components/Note.vue` を「static GitHub link card」と説明しているが、今はプライバシーポリシーのリンクも含んでいる。また `src/components/AboutGame.vue`（ゲームの説明カード）がファイル一覧にない。
- **README.md**: IDE の推奨が「Volar + TypeScript Vue Plugin (Volar)」のまま。これらの拡張機能は現在「Vue - Official」に統合されている。

#### 修正案
上記の記述を現状に合わせて更新する。

### 13. SEO: og:image がなく、sitemap の lastmod が手動更新

GitHub #13 から移行（2026-10-28 起票）

#### 現状
- `index.html` に `og:image` / `twitter:image` がないため、SNS でシェアしたときにプレビュー画像が出ない。`twitter:card` も `summary` のまま。
- `public/sitemap.xml` の `<lastmod>` を手で書いているため、デプロイ時に更新し忘れやすい。

#### 修正案
- 盤面のスクリーンショットなどの OGP 画像（1200×630 程度）を `public/` に置き、`og:image` / `twitter:image` を追加する。あわせて `twitter:card` を `summary_large_image` にする。
- `lastmod` はビルド時に生成するか、正確に保てないなら削除する（省略可能な項目のため）。

### 14. CI がなく、lint・型チェック・テストが自動で実行されない

GitHub #14 から移行（2026-10-28 起票）

#### 現状
GitHub Actions のワークフローがなく、`npm run lint`・`npm run type-check`・`npm run test:unit` は手元で実行するしかない（CLAUDE.md にもその旨の記載がある）。実行し忘れると、壊れたコードがそのまま push・デプロイされうる。

#### 修正案
`.github/workflows/ci.yml` を追加し、push と PR で次を実行する:
- `npm ci`（Cypress 本体のダウンロードが不要なら `CYPRESS_INSTALL_BINARY=0`）
- `npx eslint .`（CI では `--fix` を付けない）
- `npm run type-check`
- `npx vitest run --environment jsdom --root src/`
- `npm run build`

余裕があれば `cypress-io/github-action` で E2E テストも追加する。導入したら CLAUDE.md の「There is no CI」の記述を更新する。

### 15. 盤面の色が固定値でダークテーマに対応していない

2026-10-30 起票

#### 現状
`src/components/LifeGame.vue` の `.live` / `.death` / `.box` で `#1976d2`・`#fff`・`#ccc` を直に書いている。

#### 問題
Vuetify のテーマ（ダークテーマなど）を切り替えても盤面の色が変わらず、周囲の UI から浮く。

#### 修正案
Vuetify のテーマ変数を使う。例: `background: rgb(var(--v-theme-primary))`、`background: rgb(var(--v-theme-surface))`、枠線は `rgba(var(--v-border-color), var(--v-border-opacity))`。

### 16. 盤面が変化しなくなってもシミュレーションが止まらない

2026-10-30 起票

#### 現状
全滅したときや静止パターンだけになったときも、`update()` が呼ばれ続けて Generation だけが増える。

#### 修正案
- `src/utils/life.ts` に、2 つの盤面が同じかを判定する関数を追加し、単体テストを書く。
- `update()` で直前の世代と比べ、変化がなければ `stopStatus()` で停止する。
- 周期 2 以上の振動子（ブリンカーなど）は止まらないが、まずは「変化なし」だけを対象とする。周期パターンも止めるかは別途検討する。

### 17. `npm run test:unit` がウォッチモードで起動する

2026-10-30 起票

#### 現状
`package.json` の `test:unit` は `vitest --environment jsdom --root src/` で、`run` が付いていない。そのため対話的でない環境でもウォッチモードになり、終了しない。

#### 影響
#14 で CI を導入するとき、このスクリプトをそのまま呼ぶとジョブが終わらない。

#### 修正案
`test:unit` を `vitest run ...` にし、ウォッチ用に `test:unit:watch` を別に用意する。または CI では `npx vitest run ...` を直接呼ぶ。変更したら CLAUDE.md の Commands も更新する。

### 18. Start を押すとすぐに 1 世代進む

2026-10-30 起票

#### 現状
`changeStartStatus` が `update()` を直接呼ぶため、Start を押した瞬間に待ち時間なしで 1 世代進む。

#### 検討事項
押した直後に盤面が変わるので反応が良いとも言えるが、設定した間隔と最初の 1 歩だけ挙動が違う。意図した仕様ならこのままでよい。変えるなら最初の呼び出しを `setTimeout(update, interval.value)` にする（コンポーネントテストの期待値も変わる）。

### 19. 1 世代ずつ進める「Step」ボタンがない

2026-10-30 起票

#### 現状
世代を進めるには Start / Stop しかなく、グライダーなどの動きを 1 歩ずつ観察できない。

#### 修正案
「Step」ボタンを追加し、停止中に `nextGeneration` を 1 回適用して Generation を 1 増やす。実行中に押したときは停止してから 1 歩進める（またはボタンを無効にする）。

### 20. 端をつなげる（トーラス）オプションや有名パターンのプリセットがない

2026-10-30 起票

#### 現状
- 盤面の外は常に死んだセル扱い（ラップしない）なので、グライダーは端に着くと壊れる。
- 初期パターンはグライダー固定で、ほかのパターンは手で描くか Random しかない。

#### 修正案
- `countNeighbors` / `nextGeneration` にラップするかどうかの引数を追加し、UI に切り替えスイッチを置く。単体テストも追加する。
- グライダー、パルサー、グライダー銃などのプリセットを選んで盤面に配置できるようにする（盤面より大きいパターンの扱いは要検討）。

## 対応済み

### 5. LifeGame.vue のアンマウント時にシミュレーションのタイマーが解除されない

GitHub #5 から移行（2026-10-28 起票）

#### 現象
`src/components/LifeGame.vue` のシミュレーションは `update()` 内で `setTimeout` を自己再スケジュールしていますが、`onUnmounted` で `clearTimeout(timerId)` していません。

#### 影響
現状はルートで1回しかマウントされないため実害はありませんが、コンポーネントの再利用時やテストでアンマウントした後もタイマーが走り続けます。

#### 修正案
```ts
onUnmounted(() => stopStatus())
```
アンマウント後にタイマーが進まないことを確認するテストもあわせて追加する。

#### 対応
2026-10-30 対応（コミット 83fa670、ブランチ `claude/elegant-allen-yc1s9d`）

### 6. startButtonMessage を isStarted から求める computed にする

GitHub #6 から移行（2026-10-28 起票）

#### 現状
`src/components/LifeGame.vue` では、ボタンの文言 `startButtonMessage` を `isStarted` とは別の `ref` で持ち、`changeStartStatus` / `stopStatus` の中で両方を手で更新しています。

#### 問題
同じ状態を二重に管理しているため、今後状態を変える箇所が増えたときに更新漏れで表示がずれるおそれがあります。

#### 修正案
```ts
const startButtonMessage = computed(() => (isStarted.value ? 'stop' : 'start'))
```
として、手での代入を削除する。

#### 対応
2026-10-30 対応（コミット 83fa670、ブランチ `claude/elegant-allen-yc1s9d`）
