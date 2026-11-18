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

### 13. SEO: og:image がなく、sitemap の lastmod が手動更新

GitHub #13 から移行（2026-10-28 起票）

#### 現状
- `index.html` に `og:image` / `twitter:image` がないため、SNS でシェアしたときにプレビュー画像が出ない。`twitter:card` も `summary` のまま。
- `public/sitemap.xml` の `<lastmod>` を手で書いているため、デプロイ時に更新し忘れやすい。

#### 修正案
- 盤面のスクリーンショットなどの OGP 画像（1200×630 程度）を `public/` に置き、`og:image` / `twitter:image` を追加する。あわせて `twitter:card` を `summary_large_image` にする。
- `lastmod` はビルド時に生成するか、正確に保てないなら削除する（省略可能な項目のため）。

### 15. 盤面の色が固定値でダークテーマに対応していない

2026-10-30 起票

#### 現状
`src/components/LifeGame.vue` の `.live` / `.death` / `.box` で `#1976d2`・`#fff`・`#ccc` を直に書いている。

#### 問題
Vuetify のテーマ（ダークテーマなど）を切り替えても盤面の色が変わらず、周囲の UI から浮く。

#### 修正案
Vuetify のテーマ変数を使う。例: `background: rgb(var(--v-theme-primary))`、`background: rgb(var(--v-theme-surface))`、枠線は `rgba(var(--v-border-color), var(--v-border-opacity))`。

### 18. Start を押すとすぐに 1 世代進む

2026-10-30 起票

#### 現状
`changeStartStatus` が `update()` を直接呼ぶため、Start を押した瞬間に待ち時間なしで 1 世代進む。

#### 検討事項
押した直後に盤面が変わるので反応が良いとも言えるが、設定した間隔と最初の 1 歩だけ挙動が違う。意図した仕様ならこのままでよい。変えるなら最初の呼び出しを `setTimeout(update, interval.value)` にする（コンポーネントテストの期待値も変わる）。

### 20. 端をつなげる（トーラス）オプションや有名パターンのプリセットがない

2026-10-30 起票

#### 現状
- 盤面の外は常に死んだセル扱い（ラップしない）なので、グライダーは端に着くと壊れる。
- 初期パターンはグライダー固定で、ほかのパターンは手で描くか Random しかない。

#### 修正案
- `countNeighbors` / `nextGeneration` にラップするかどうかの引数を追加し、UI に切り替えスイッチを置く。単体テストも追加する。
- グライダー、パルサー、グライダー銃などのプリセットを選んで盤面に配置できるようにする（盤面より大きいパターンの扱いは要検討）。

### 現状
`.box` の枠線は常に 1px。100×100 ではセルの幅が 3.77px で（#21 の影響で盤面の幅が 376.5px のとき）、左右の枠線を除いた中身は約 1.8px しかない。#21 を直して盤面が 500px に広がっても、中身は約 3px。

#### 修正案
セルが小さいときは枠線を消す。例: `columns` と行数の大きいほうがしきい値を超えたら、`.map` にクラスを付けて `.box` の枠線をなくす。

### 現状
`.box` の `transition: background-color 0.2s ease` は 0.2 秒かかるが、更新間隔は最短 0.1 秒なので、次の世代までに色が変わりきらない（コードからの判断で、実際の見え方は未確認）。

#### 修正案
間隔が短いときは transition をなくす。または transition 自体を削除する。100×100 の描画負荷（#8）も軽くなる可能性がある。

### 27. ビルド時に Vite の設定で警告が出る

2026-10-30 起票

#### 現象
`vite build` や Vitest の実行時に、`vite.config.ts` が CommonJS として読み込まれているという警告（`configLoader: 'native'` が将来既定になるときに問題になる書き方）が出る。

#### 修正案
`package.json` に `"type": "module"` を追加する（解消するかは未確認）。他の設定ファイルへの影響も確認する。

### 28. 依存パッケージに脆弱性がある（minimatch・glob・picomatch）

2026-11-17 起票

#### 現状
2026-11-18 時点で、`npm audit` の報告は 21 件（high 16 件、moderate 5 件）。元になっているのは次の 3 つで、残りはこれらに依存するパッケージ。いずれも開発用の依存で、公開サイトには影響しない。
- `picomatch` 4.0.7（GHSA-fc5q-39xc-vjpf、high）: `vite`・`vitest`・`vue-tsc`（`@vue/language-core`）・`typescript-eslint`（`tinyglobby`・`fast-glob` など）経由。影響範囲は 4.0.7 以下で、4.0.7 が最新版のため修正版がまだない。
- `glob` 13.0.7（GHSA-3g3m-2fjr-6pw4、moderate）: `@vue/test-utils` → `js-beautify` 2.0.3 経由。`js-beautify`（最新版）が `glob ^13.0.6` を指定しているため、修正済みの 14 系に上げられない。
- `minimatch` 10.2.6（GHSA-g3hv-75wg-m249、moderate）: 上の `glob` と、`js-beautify` → `editorconfig` 3.0.2 経由。`editorconfig` が `~10.2.4` に固定している。

#### 経過
- 2026-11-17 のパッケージ更新（コミット 0ec1965）で、`@typescript-eslint/*`・`typescript-eslint` 経由の `minimatch` は解消した（最上位の `minimatch` が 11.0.9 になった）。
- `picomatch` の脆弱性は起票後に新しく報告されたもの。

#### 修正案
- `npm audit` が示す修正（`vite` 6.2.7・`vitest` 3.1.4・`vue-tsc` 3.0.1 など）はメジャーバージョンを下げるものなので、`npm audit fix --force` は実行しない。
- `picomatch`: 修正版が出たら `npm update` で取り込む。
- `glob` / `minimatch`: `js-beautify`（または `@vue/test-utils`）の更新を待つ。すぐに消したい場合は `package.json` の `overrides` で `glob` を 14.0.2 以上、`minimatch` を 11.0.1 以上に強制する方法もあるが、依存元が対応していない版で動かすことになる。
- 対応後に lint・型チェック・単体テスト・ビルドが通ることを確認する。

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

### 21. PC 幅で画面が左半分に寄る

2026-10-30 起票

#### 現象
幅 1024px 以上の画面で、アプリが左半分にしか表示されない。幅 1024px のとき、`.v-application` の幅は 472.5px だった（手元でビルドした master をブラウザで確認。本番サイトは未確認）。

#### 原因
`src/assets/main.css` に Vue のテンプレート由来の指定が残っている。`@media (min-width: 1024px)` の `#app { display: grid; grid-template-columns: 1fr 1fr; }` で 2 カラムになり、中身が 1 列目だけに入る。リンクが緑色なのも同じファイルの指定による。

#### 修正案
`src/main.ts` の `./assets/main.css` の読み込みをやめ、`main.css` と `base.css` を削除する。`base.css` の `*` への指定（`margin: 0` など）もなくなるので、見た目が変わらないか確認する。

#### 対応
2026-10-30 対応（コミット b83c685）。`main.css` と `base.css` を削除し、`src/main.ts` での読み込みをやめた。

### 22. Height / Width を空にすると盤面が消える

2026-10-30 起票

#### 現象
Width を空にして欄から離れると、10×10 の盤面が 10×1 になり、グライダーも消える。切り捨てられたセルは元に戻せない（ブラウザで確認）。

#### 原因
`changeDataMapSize` の `Number(width.value)` で空文字が 0 になり、`clampSize` で最小値の 1 に丸められる。

#### 修正案
空欄や数値でない値のときは、直前の値（`dataMap` の実際のサイズ）に戻す。コンポーネントテストと E2E テストも追加する。

#### 対応
2026-10-30 対応（コミット b83c685）。`clampSize` で空欄や数値でない値のときは今のサイズを保つようにし、コンポーネントテストと E2E テストを追加した。

### 26. 依存パッケージに脆弱性が 1 件ある（systeminformation）

2026-10-30 起票

#### 現状
`npm audit` で `systeminformation` の深刻度 high の脆弱性（GHSA-3f7j-7jwc-fxfj）が 1 件報告される。Cypress 経由で入っている開発用の依存で、公開サイトには影響しない。

#### 修正案
`npm audit fix` を実行する。

#### 対応
2026-11-15 対応（コミット 1a4d05f のパッケージ更新）。2026-11-17 に `npm audit` で、この脆弱性が報告されなくなったことを確認した。代わりに報告されている深刻度 moderate の脆弱性は #28 に記録した。

### 17. `npm run test:unit` がウォッチモードで起動する

2026-10-30 起票

#### 現状
`package.json` の `test:unit` は `vitest --environment jsdom --root src/` で、`run` が付いていない。そのため対話的でない環境でもウォッチモードになり、終了しない。

#### 影響
#14 で CI を導入するとき、このスクリプトをそのまま呼ぶとジョブが終わらない。

#### 修正案
`test:unit` を `vitest run ...` にし、ウォッチ用に `test:unit:watch` を別に用意する。または CI では `npx vitest run ...` を直接呼ぶ。変更したら CLAUDE.md の Commands も更新する。

#### 対応
2026-11-17 対応（ブランチ `ccr-6eb7be8e-8j3i2w`）。`test:unit` を `vitest run ...` にし、ウォッチ用に `test:unit:watch` を追加した。CLAUDE.md と README も更新した。

### 25. Windows で lint エラーが 372 件出る

2026-10-30 起票

#### 現象
`npx eslint .` で 372 件のエラーが出る。全件が `prettier/prettier` の改行コード（CRLF）の指摘で、対象は `src/components/LifeGame.vue` と `src/components/__tests__/LifeGame.test.ts` の 2 ファイル。

#### 原因
`core.autocrlf=true` の環境では、チェックアウトしたファイルが CRLF になることがある。一方、Prettier の `endOfLine` は既定の `lf` のままで、`.gitattributes` もない。

#### 修正案
`.gitattributes` に `* text=auto eol=lf` を追加して、作業ツリーの改行コードを LF にそろえる。

#### 対応
2026-11-17 対応（ブランチ `ccr-6eb7be8e-8j3i2w`）。`.gitattributes` に `* text=auto eol=lf` を追加した（`*.ico` は `binary`）。`core.autocrlf=true` でチェックアウトしても LF になることを確認した。
すでに CRLF になっている作業ツリーは自動では直らないので、未コミットの変更がない状態で `git rm --cached -r . && git reset --hard` を実行して、チェックアウトし直す。

### 14. CI がなく、lint・型チェック・テストが自動で実行されない

GitHub #14 から移行（2026-10-28 起票）

#### 現状
GitHub Actions のワークフローがなく、`npm run lint`・`npm run type-check`・`npm run test:unit` は手元で実行するしかない（CLAUDE.md にもその旨の記載がある）。実行し忘れると、壊れたコードがそのまま push・デプロイされうる。

#### 修正案
`.github/workflows/ci.yml` を追加し、push と PR で次を実行する:
- `npm ci`（Cypress 本体のダウンロードが不要なら `CYPRESS_INSTALL_BINARY=0`）
- `npx eslint .`（CI では `--fix` を付けない）
- `npm run type-check`
- `npm run test:unit`（#17 で `vitest run` になり、終了するようになった）
- `npm run build`

余裕があれば `cypress-io/github-action` で E2E テストも追加する。導入したら CLAUDE.md の「There is no CI」の記述を更新する。

#### 対応
2026-11-17 対応（ブランチ `ccr-6eb7be8e-8j3i2w`）。`.github/workflows/ci.yml` を追加した。`master` への push と PR で、Node 22 を使って上の 5 つを実行する（ビルドは型チェックと重ならないよう `npm run build-only`）。E2E テストは CI に入れていない。CLAUDE.md の記述も更新した。

### 12. ドキュメントの古い記述（CLAUDE.md の Note.vue、README の IDE 推奨）

GitHub #12 から移行（2026-10-28 起票）

#### 古くなっている箇所
- **CLAUDE.md**: `src/components/Note.vue` を「static GitHub link card」と説明しているが、今はプライバシーポリシーのリンクも含んでいる。また `src/components/AboutGame.vue`（ゲームの説明カード）がファイル一覧にない。
- **README.md**: IDE の推奨が「Volar + TypeScript Vue Plugin (Volar)」のまま。これらの拡張機能は現在「Vue - Official」に統合されている。

#### 修正案
上記の記述を現状に合わせて更新する。

#### 対応
2026-11-18 対応（ブランチ `ccr-b473c45a-y0q6e0`）。CLAUDE.md の `Note.vue` の説明を直し、`AboutGame.vue` の説明を追加した。README の IDE 推奨を「Vue - Official」にし、廃止された Take Over Mode の説明を削除した。`.vscode/extensions.json` の推奨からも、廃止された `Vue.vscode-typescript-vue-plugin` を外した。

### 16. 盤面が変化しなくなってもシミュレーションが止まらない

2026-10-30 起票

#### 現状
全滅したときや静止パターンだけになったときも、`update()` が呼ばれ続けて Generation だけが増える。

#### 修正案
- `src/utils/life.ts` に、2 つの盤面が同じかを判定する関数を追加し、単体テストを書く。
- `update()` で直前の世代と比べ、変化がなければ `stopStatus()` で停止する。
- 周期 2 以上の振動子（ブリンカーなど）は止まらないが、まずは「変化なし」だけを対象とする。周期パターンも止めるかは別途検討する。

#### 対応
2026-11-18 対応（ブランチ `ccr-b473c45a-y0q6e0`）。`src/utils/life.ts` に `isSameGrid` を追加して単体テストを書いた。`update()` で次の世代が今の盤面と同じなら、Generation を増やさずに `stopStatus()` で止めるようにした。空の盤面で Start を押したときもすぐに止まる。周期 2 以上の振動子は今までどおり止まらない。コンポーネントテストに、空の盤面では動かないことと、初期のグライダーが右下の角でブロックになって 27 世代目で止まることを追加した。

### 19. 1 世代ずつ進める「Step」ボタンがない

2026-10-30 起票

#### 現状
世代を進めるには Start / Stop しかなく、グライダーなどの動きを 1 歩ずつ観察できない。

#### 修正案
「Step」ボタンを追加し、停止中に `nextGeneration` を 1 回適用して Generation を 1 増やす。実行中に押したときは停止してから 1 歩進める（またはボタンを無効にする）。

#### 対応
2026-11-18 対応（ブランチ `ccr-b473c45a-y0q6e0`）。Random・Clear の横に「Step」ボタンを追加した。押すと 1 世代だけ進め、実行中に押したときは停止してから 1 歩進める。盤面が変化しないとき（#16 と同じ判定）は Generation を増やさない。世代を進める処理を `step()` にまとめ、シミュレーションのループ（`update()`）と共用している。遊び方の説明（`AboutGame.vue`・README）とコンポーネントテストも追加した。

### 23. 大きい盤面でセルがほとんど枠線になる

2026-10-30 起票

#

#### 対応
2026-11-18 対応（ブランチ `ccr-b473c45a-y0q6e0`）。縦か横のどちらかが 40 セル（`DENSE_SIZE`）を超えたら、`.map` に `no-border` クラスを付けて `.box` の枠線を消すようにした。幅 1024px の画面で、40×40 はセルの幅 12.5px（枠線あり）、41×41 は 12.2px（枠線なし）、100×100 は 5px（枠線なし、中身も 5px）になることをブラウザで確認した。コンポーネントテストも追加した。

### 24. 短い間隔だとセルの色が変わりきらない

2026-10-30 起票

#

#### 対応
2026-11-18 対応（ブランチ `ccr-b473c45a-y0q6e0`）。`.box` の `transition` を削除した。
