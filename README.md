# コンパス（仮称）— 仕事の解像度を上げる

就活生が「企業の中で人が実際に何をしているか」を**根拠つきで**知り、目的のはっきりしたOB/OG訪問につなげるためのWebアプリのプロトタイプです。OB/OG訪問サービスへの新規プロダクト提案用のデモとして作っています。

- 仕事に関する記述は、定義した情報ソース（OB/OG訪問記録・社員プロフィール・公式コンテンツ）だけを根拠にします
- どの回答にも、ソースの種類・企業・職種・入社年次・日付を引用として表示します
- 根拠がない質問には「情報がありません」と返し、聞けそうなOB/OGを提案します
- 企業・学生・ソースはすべて架空のモックデータです（実在の社名は使っていません）

---

## 起動方法

必要なもの：Node.js 20 以上（動作確認は v26.13.1）

```bash
cd compass
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開きます（PC向けの画面です）。

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー |
| `npm run build` / `npm start` | 本番ビルドと起動 |
| `npm run lint` | ESLint |
| `node scripts/generate-students.mjs` | モック学生20人のログを作り直す（決定的な乱数を使うので毎回同じ結果） |

---

## デモの手順（約5分）

PC向けの画面です（横幅1024px以上を想定）。左のメニューで「学生 / 企業人事」を切り替えます。学生側の操作は「あなた」の記録としてブラウザ（localStorage）に保存され、人事側の集計にもその場で反映されます。

### 学生側：チャットで相談する（トップ画面 `/`）

1. **エージェントからの逆質問**
   チャットを開くと、エージェントのほうから質問してきます。
   - 「気になっている業界や職種は？」→「コンサル」
   - 「今の就活の状況は？」→「OB/OG訪問をしてみたい」
   - 「特に知りたいことは？」→「1年目の仕事」
   
   選択肢を押すだけで進みます。自由に入力することもできます。「まだ決まっていない」を選ぶと、「大事にしたいこと（若いうちから任されたい など）」から合う会社を絞り込みます。
2. **根拠つきの回答**
   3社分の1年目の仕事を、引用 [1][2][3] 付きで答えます。引用番号やソースカードをクリックすると、原文・書いた人・入社年次・日付・公開同意が確認できます。
3. **回答のあとの逆質問**
   「いちばん気になったのは？」と聞かれるので、「アークライト戦略研究所／戦略コンサルタント」を選び、続けて「働き方・雰囲気」を選びます。
4. **根拠がない質問**
   入力欄に「アークライトの年収はどれくらい？」と入れます。**⚠ 根拠なし**として「情報がありません」と返し、OB/OG訪問で聞くよう促します。
5. **右パネル「あなたへのOB/OG提案」**
   相談が進むたびに更新されます。
   - **この人をおすすめする理由**：「さっきの回答で引用した記録を書いた本人」「あなたが知りたい『1年目』について話している」「答えられなかった『年収』を直接聞ける会社の人」など
   - **この人に聞くとよい質問**：3つ。その人の入社年次に合わせて出し分けます
   - 「訪問を依頼する」ボタン（モック）
6. **企業・職種を見る**（左メニュー）
   職種ページで、1日の流れ・年次ごとの仕事・スキルを根拠つきで一覧できます。「この仕事について相談する」を押すと、その職種に絞った相談が始まります。カタリスト・ロジのカスタマーサクセスは5年目の情報がないため、空欄で「OB/OG訪問で聞いてみよう」と表示されます。

### 企業人事側

7. 左メニューで「企業人事」に切り替え、「アークライト戦略研究所」を選びます。
   - **学生インサイト**：仕事ページの閲覧数、チャットでよく聞かれる質問、**答えられなかった質問**（＝発信すべきコンテンツの候補と、おすすめの発信形式）
   - **訪問意欲の高い学生**：匿名の一覧と意欲スコアの内訳。デモで操作した「あなた（デモ操作中）」も並びます。

伝えたいストーリー：学生は**エージェントとの対話で関心を言葉にし**、**根拠つきで仕事を知り**、**聞くべきことと聞くべき人がはっきりした状態でOB/OG訪問に進む**。企業側は**学生が答えを得られなかった質問**から、発信すべき内容が分かる。結果として訪問の数と質が上がり、採用企業に提供できる価値も上がる。

---

## 構成

```
src/
├─ data/                 モックデータ（JSON）
│  ├─ companies.json     架空の企業8社
│  ├─ sources.json       ソース41件（40件が公開同意あり、1件は同意なしで検索から外れる確認用）
│  ├─ jobs.json          職種10個（記述はすべてパッセージIDを根拠に持つ）
│  ├─ alumni.json        OB/OG 20人
│  └─ students.json      学生20人と行動ログ（scripts/generate-students.mjs で生成）
├─ lib/
│  ├─ types.ts           ドメインモデル（Source / Passage / Claim / Job ...）
│  ├─ data.ts            データの読み込みと整合性チェック（根拠のない記述があれば起動時にエラー）
│  ├─ agent/
│  │  ├─ types.ts        ★チャットエージェント（逆質問）のインターフェース InterviewAgent
│  │  └─ scriptedAgent.ts  モック：シナリオとルールで逆質問する
│  ├─ qa/
│  │  ├─ types.ts        ★回答生成・OB/OG提案のインターフェース（Retriever / AnswerGenerator / AlumniRecommender / VisitQuestionSuggester）
│  │  ├─ index.ts        ★実装の組み立て（差し替えるのはここ）＋引用IDの検証
│  │  ├─ keywordRetriever.ts     モック検索（キーワード辞書）
│  │  ├─ extractiveGenerator.ts  モック生成（パッセージをそのまま引用）
│  │  ├─ ruleBasedRecommender.ts OB/OGの推薦（理由・質問つき、ルールベース）
│  │  ├─ ruleBasedSuggester.ts   OB/OG訪問で聞くことの提案（ルールベース）
│  │  └─ dictionary.ts           トピック辞書・質問カテゴリ
│  ├─ analytics.ts       人事インサイトの集計
│  └─ store.ts           「あなた」の行動ログ（localStorage）
├─ app/
│  ├─ page.tsx, ChatClient.tsx  チャット（トップ画面）
│  ├─ companies/, companies/[id]/  企業一覧・企業詳細
│  ├─ jobs/[id]/               仕事詳細
│  ├─ visit/[jobId]/           OB/OG訪問の準備
│  ├─ hr/, hr/students/        企業人事向け画面
│  └─ api/ask, api/recommend-alumni, api/visit-questions   サーバー側のAPI
└─ components/           共通UI（サイドバー、OB/OG提案パネル、根拠バッジなど）
```

### ソースのスキーマ（要点）

```ts
interface Source {
  id: string;
  type: "visit_record" | "employee_profile" | "official_content";
  companyId: string;
  jobId: string | null;          // null なら企業全体の情報
  jobTitle: string;
  author: { alumniId: string | null; displayName: string; joinYear: number | null };
  date: string;                  // YYYY-MM-DD
  title: string;
  passages: { id: string; text: string; topics: Topic[] }[];  // 引用はパッセージ単位
  consent: { publicConsent: boolean; consentedAt: string | null };
}
interface Claim { text: string; evidence: string[] }  // evidence = Passage.id（1件以上必須）
```

- `publicConsent: false` のソースは `lib/data.ts` の時点で除外されるので、アプリのどこからも参照できません。
- 画面に出す記述（`Claim`）は、存在するパッセージを1件以上指していなければ起動時にエラーになります。

---

## 本物のLLMとソースに差し替える手順

画面とAPIは `lib/qa/types.ts` のインターフェースにだけ依存しています。差し替えるのは実装クラスだけで、画面側のコードは変えずに済みます。

### 1. ソースをDB / CMSに移す

1. `Source` / `Passage` と同じ形のテーブル（またはCMSのコンテンツ型）を用意します。OB/OG訪問記録は、本人の公開同意（`consent`）を必須項目にします。
2. `lib/data.ts` の各関数（`getPassage`、`sourcesOfJob` など）の中身を、DBから取得する処理に置き換えます。関数のシグネチャは変えません。件数が増えたら非同期化し、呼び出し側（Server Component）で `await` します。
3. 職種ページの `Claim` は、ソースから人手で作るか、LLMで下書きして人がレビューする運用にします。どちらの場合も `evidence` は必須です。

### 2. 検索をベクトル検索に替える（Retriever）

```ts
// lib/qa/vectorRetriever.ts（例）
export class VectorRetriever implements Retriever {
  async search(q: RetrievalQuery): Promise<RetrievalResult> {
    // 1) q.text を埋め込みベクトルに変換
    // 2) 公開同意ありのパッセージだけを対象に近傍検索（companyId / jobId があればフィルタ）
    // 3) 類似度がしきい値未満なら hits を空にする → 「情報がありません」になる
    return { hits, detected: { companyIds, jobIds, topics } };
  }
}
```

### 3. 回答生成をClaude APIに替える（AnswerGenerator）

`npm install @anthropic-ai/sdk zod` をしてから、APIキーを環境変数 `ANTHROPIC_API_KEY` に設定します。生成はサーバー側（`/api/ask`）で動くので、キーがブラウザに出ることはありません。

```ts
// lib/qa/claudeGenerator.ts（例）
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

const AnswerSchema = z.object({
  status: z.enum(["answered", "no_evidence"]),
  segments: z.array(z.object({ text: z.string(), passageIds: z.array(z.string()) })),
});

const SYSTEM = `あなたは就活生に仕事の中身を説明するアシスタントです。
- 回答の根拠にしてよいのは <passages> にある文章だけです。あなた自身の知識や推測は使いません。
- 事実を述べる文には、根拠にしたパッセージのIDを passageIds に必ず入れます。
- <passages> の中に答えがなければ status を "no_evidence" にし、segments は空にします。`;

export class ClaudeGenerator implements AnswerGenerator {
  private client = new Anthropic();

  async generate({ question, retrieval }: { question: string; retrieval: RetrievalResult }) {
    if (retrieval.hits.length === 0) return noEvidenceAnswer(retrieval); // 検索で0件なら呼ばない

    const passages = retrieval.hits
      .map((h) => `<passage id="${h.passage.id}">${h.passage.text}</passage>`)
      .join("\n");

    const res = await this.client.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      system: SYSTEM,
      messages: [{ role: "user", content: `<passages>\n${passages}\n</passages>\n\n質問：${question}` }],
      output_config: { format: zodOutputFormat(AnswerSchema) },
    });
    if (res.stop_reason === "refusal" || !res.parsed_output) return noEvidenceAnswer(retrieval);

    // passageIds を Citation に変換する（検索結果にないIDが含まれていたら捨てる）
    return toGeneratedAnswer(res.parsed_output, retrieval.hits);
  }
}
```

そのうえで `lib/qa/index.ts` の2行を差し替えます。

```ts
const retriever: Retriever = new VectorRetriever();
const generator: AnswerGenerator = new ClaudeGenerator();
```

**捏造対策**：`lib/qa/index.ts` の `ask()` は、回答が引用したパッセージIDが検索結果に実際に含まれているかを毎回検証しています。含まれていなければエラーになります。LLMに替えてもこの検証は残してください。

**本番運用で追加を検討すること**
- モデルは `claude-opus-5-5`。費用を下げたい場合は、評価セットで品質を確かめてから `claude-sonnet-5-5` などを検討します。
- 拒否（`stop_reason: "refusal"`）に備えて、サーバー側フォールバック（`server-side-fallback` ベータ）を使います。
- システムプロンプトにプロンプトキャッシュを使います。
- 回答の品質を測る評価セットを作ります（「根拠外の内容を言っていないか」「答えられる質問に no_evidence を返していないか」）。

### 4. チャットエージェント（逆質問）を LLM に替える

`lib/agent/types.ts` の `InterviewAgent` を実装します。LLM に渡すのは「学生のプロフィール（興味・状況・見たトピック）」と「直前の回答の状態（answered / no_evidence、引用した職種）」です。返してもらうのは「次の逆質問の文」と「選択肢」です。

- **仕事の中身についての回答は、必ず `/api/ask`（根拠つき）を通します。** エージェントの役割は「何をどう聞くか」を決めることだけです。仕事内容を自分の言葉で語らせてはいけません。
- LLM 版はAPIキーを使うので、サーバー側（例：`/api/agent`）に置き、`ChatClient.tsx` からはそのAPIを呼ぶ形にします。

### 5. OB/OGの推薦（AlumniRecommender）と質問提案（VisitQuestionSuggester）

`RuleBasedRecommender` と `RuleBasedSuggester` を、LLM や推薦モデルを使う実装に替えられます。ただし、推薦の理由は必ず「学生の相談内容」か「その人が書いた・話したソース」に結びつけて表示します。根拠のない理由（「優しそう」など）は出しません。

### 6. 行動ログ

`lib/store.ts` は localStorage に保存しています。本番ではイベントをサーバーに送り、人事向けの集計（`lib/analytics.ts`）をDB側のクエリに移します。人事に見せるのは匿名IDだけにして、個人情報は学生が訪問を依頼したときに初めて開示する設計を想定しています。

---

## プロトタイプでやっていないこと

認証、決済、本番DB、本物のLLM・ベクトル検索との連携、実在企業のデータ。

## 既知の制限

- キーワード辞書による簡易検索なので、辞書にない言い回しには反応しないことがあります（例：「給料」は拾えるが「お金」は拾えない）。
- モック学生の質問ログの回答可否は、読み込み時に現在のソースで判定しています（本番では質問した時点の判定を記録する想定）。
- ダークモードには対応していません（ライト表示のみ）。
