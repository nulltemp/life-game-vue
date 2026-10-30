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
