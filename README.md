# Hana 数学ステップクイズ

中学数学の問題を、最終回答ではなく「次に行うべき途中式・打ち手」を3択で選びながら解く静的Webアプリです。React、TypeScript、Vite、KaTeXで実装しています。

## 公開URL

GitHub Pages公開後のURL:

`https://potajiro-tenezut.github.io/hana-math-step-quiz/`

現在の環境では `gh auth status` のトークンが無効だったため、公開操作は認証復旧後に実行します。

## 主な機能

- 1セッション10問
- 1ステップ20秒のタイマー
- 正解時に式を次の状態へ更新
- 不正解時は理由を表示し、その選択肢だけ再選択不可
- 時間切れ時は正しい打ち手と理由を表示し、「正しい手順で進む」で続行
- 全範囲ランダム、単元別練習、復習モード
- localStorageによる学習履歴保存
- スマートフォン、タブレット、PC対応
- GitHub ActionsによるGitHub Pagesデプロイ

## 対応単元

- 単元9・10: 約数と倍数
- 単元11・12: 根号を含む式の計算
- 単元13: 式の値
- 単元14: 1次方程式・比例式
- 単元15: 連立方程式
- 単元16・17: 2次方程式

## 技術構成

- React
- TypeScript
- Vite
- KaTeX
- CSS
- Vitest
- React Testing Library
- Playwright
- ESLint
- Prettier
- GitHub Actions
- GitHub Pages

## ローカル起動

```bash
npm install
npm run dev
```

## テスト

```bash
npm run lint
npm run self-review
npm run test
npm run build
npm run test:e2e
```

修正後に一通り確認する場合は、次を実行します。

```bash
npm run verify
```

`verify` は `lint`、`self-review`、`test`、`build` を順番に実行します。E2Eまで含める場合は、続けて `npm run test:e2e` を実行します。

## 自己レビュー

`npm run self-review` は、学習者に見える問題データを自動点検する専用テストです。

- `mod`、`合同`、`GCD`、`LCM` など、中学数学学習者には抽象度が高い表記を画面文言へ出していないか
- `stateLatex` と文中の数式断片がKaTeXで描画できるか
- 「整理する」「計算する」「公式を使う」だけの曖昧な選択肢になっていないか
- 正解だけが極端に長く、文章量で答えが分かる選択肢になっていないか

GitHub Actionsでも `self-review` を必ず実行するため、問題文や途中式を修正したときは自動的にこの自己レビューを通します。

## ビルド

```bash
npm run build
```

本番ビルドではViteの `base` を `/hana-math-step-quiz/` にしています。ローカル開発時は `/` です。

## 問題データの構造

問題生成関数は `src/data/generators/index.ts` にあり、最終的に `QuestionFlow` を返します。

```ts
type StepChoice = {
  id: string;
  label: string;
  labelLatex?: string;
  isCorrect: boolean;
  incorrectReason?: string;
};

type SolutionStep = {
  id: string;
  stateLatex: string;
  choices: [StepChoice, StepChoice, StepChoice];
  correctChoiceId: string;
  afterLatex: string;
  correctExplanation: string;
  isFinalStep?: boolean;
};

type QuestionFlow = {
  id: string;
  fingerprint: string;
  unitId: string;
  unitName: string;
  unitGroup: UnitGroup;
  questionType: string;
  promptText: string;
  initialStateLatex: string;
  steps: SolutionStep[];
  finalAnswerLatex: string;
  parameters: Record<string, string | number | boolean>;
};
```

UIコンポーネントには問題文や途中式を直接書かず、`QuestionFlow` の `promptText`、`stateLatex`、`choices`、`afterLatex` だけを表示します。

## 新しい問題タイプの追加方法

1. `src/data/generators/index.ts` に生成関数を追加します。
2. `register(type, unitId, unitName, unitGroup, label, generator)` で `generators` 配列へ登録します。
3. 生成関数内で `makeQuestion` を使い、`QuestionFlow` を返します。
4. 各ステップは `step(...)` で作り、正解1つ、不正解2つを渡します。
5. `parameters` には生成に使った数値を入れます。
6. 同じseedで同じ問題になるよう、乱数は `SeededRandom` だけを使います。
7. `npm run self-review` で学習者向けの表記とKaTeX表示を確認します。
8. `npm run test` で生成テストを通します。

## 新しい途中ステップの追加方法

複数ステップにする場合は、前ステップの `afterLatex` と次ステップの `stateLatex` を完全一致させます。`validateQuestion` がこの連結を検査します。

```ts
const s1 = step(random, "s1", "3x-11=-2", correct, wrong1, wrong2, "3x=9", "定数項を右辺へ移します。");
const s2 = step(random, "s2", s1.afterLatex, correct2, wrong3, wrong4, "x=3", "両辺を3で割ります。", true);
```

打ち手の文は「整理する」「公式を使う」だけで終えず、どの項や数に何をするかを具体的に書きます。

## GitHub Pagesへのデプロイ

`.github/workflows/deploy-pages.yml` は、mainブランチへのpushで以下を実行します。

1. `npm ci`
2. `npm run lint`
3. `npm run self-review`
4. `npm run test`
5. `npm run build`
6. `actions/configure-pages`
7. `actions/upload-pages-artifact`
8. `actions/deploy-pages`

PagesのSourceはGitHub Actionsに設定してください。

## localStorageへ保存する内容

キー: `hanaMathStepQuizHistory`

- 総学習回数
- 問題タイプ別の出題数
- 問題タイプ別の初回正答数
- 問題タイプ別の不正解数
- 問題タイプ別の時間切れ数
- 平均回答時間
- 直近セッション結果
- 苦手問題タイプ
- 復習対象問題タイプ

設定画面から確認ダイアログ付きで削除できます。

## 既知の制約

- 一部の問題タイプは代表的な1ステップを重点的に練習する構成です。
- 複数解法がある問題でも、現在は代表的な教科書ルートを1つの正解として扱います。
- GitHub認証が無効な環境では、リポジトリ作成とPages公開は手動実行が必要です。
