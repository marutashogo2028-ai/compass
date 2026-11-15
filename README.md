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

ブラウザで http://localhost:3000 を開きます。スマホ表示を優先しているので、PCの場合はブラウザの開発者ツールでスマホ幅（390px程度）にすると見やすいです。

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー |
| `npm run build` / `npm start` | 本番ビルドと起動 |
| `npm run lint` | ESLint |
| `node scripts/generate-students.mjs` | モック学生20人のログを作り直す（決定的な乱数を使うので毎回同じ結果） |

---

## デモの手順（約5分）

画面上部の「学生 / 企業人事」で表示を切り替えます。学生側の操作は「あなた」の記録としてブラウザ（localStorage）に保存され、人事側の集計にもその場で反映されます。

### 学生側

1. **企業マップ**（`/`）
   横軸が採用人数、縦軸が採用競争力の4象限です。色は入社後の成長タイプ（早期裁量型 / 専門性型 / 育成体系型）で、上のチップで絞り込めます。「アークライト」をタップします。
2. **企業詳細** → 職種「戦略コンサルタント」をタップします。
3. **仕事詳細**（`/jobs/j-arc`）
   1日のタイムライン、主な業務、1年目/3年目/5年目に任される仕事、必要なスキルが表示されます。どの項目にも📎の根拠バッジが付いていて、タップすると原文・書いた人・入社年次・日付・公開同意が確認できます。
   - ポイント：カタリスト・ロジの「カスタマーサクセス」（`/jobs/j-ct`）は、5年目の情報が**空欄**になっています。根拠がないので書かず、「OB/OG訪問で聞いてみよう」と表示します。
4. **仕事Q&A**（「この仕事について質問する」から）
   - 「コンサルの1年目は具体的に何をする？」→ 引用 [1][2] 付きで回答します。
   - 「アークライトの年収はどれくらい？」→ **⚠ 根拠なし**として「情報がありません」と返し、聞けそうなOB/OGを提案します。
5. **OB/OG訪問への橋渡し**（「OB/OGに聞きに行く」から）
   さっき答えられなかった「年収」の質問が、「この人に聞くとよいこと」の1つ目に入っています。理由も表示されます。「訪問を依頼する」を押すと、依頼したことになります（モック）。
6. **解像度ダッシュボード**（下のタブ「解像度」）
   理解した職種の数、職種ごとの4段階の解像度、質問の傾向、興味のある象限（ヒートマップ）が見られます。記録がないときは「サンプル履歴を読み込む」で用意できます。

### 企業人事側

7. 上部で「企業人事」に切り替え、「アークライト戦略研究所 人事部」を選びます。
   - **学生インサイト**：仕事ページの閲覧数、よく聞かれる質問、**答えられなかった質問**（＝発信すべきコンテンツの候補と、おすすめの発信形式）
   - **訪問意欲の高い学生**：匿名の一覧です。意欲スコアの内訳も表示します。デモで操作した「あなた（デモ操作中）」も並びます。

伝えたいストーリー：学生は**根拠つきで仕事を知る**ことで興味が具体的になり、**聞くべきことがはっきりした状態でOB/OG訪問に進む**。企業側は**学生が答えを得られなかった質問**から、発信すべき内容が分かる。結果として訪問の数と質が上がり、採用企業に提供できる価値も上がる。

---

## 構成

```
src/
├─ data/                 モックデータ（JSON）
│  ├─ companies.json     架空の企業8社（4象限に分布）
│  ├─ sources.json       ソース41件（40件が公開同意あり、1件は同意なしで検索から外れる確認用）
│  ├─ jobs.json          職種10個（記述はすべてパッセージIDを根拠に持つ）
│  ├─ alumni.json        OB/OG 20人
│  └─ students.json      学生20人と行動ログ（scripts/generate-students.mjs で生成）
├─ lib/
│  ├─ types.ts           ドメインモデル（Source / Passage / Claim / Job ...）
│  ├─ data.ts            データの読み込みと整合性チェック（根拠のない記述があれば起動時にエラー）
│  ├─ qa/
│  │  ├─ types.ts        ★回答生成のインターフェース（Retriever / AnswerGenerator / VisitQuestionSuggester）
│  │  ├─ index.ts        ★実装の組み立て（差し替えるのはここ）＋引用IDの検証
│  │  ├─ keywordRetriever.ts     モック検索（キーワード辞書）
│  │  ├─ extractiveGenerator.ts  モック生成（パッセージをそのまま引用）
│  │  ├─ ruleBasedSuggester.ts   OB/OG訪問で聞くことの提案（ルールベース）
│  │  └─ dictionary.ts           トピック辞書・質問カテゴリ
│  ├─ analytics.ts       ダッシュボードと人事インサイトの集計
│  └─ store.ts           「あなた」の行動ログ（localStorage）
├─ app/
│  ├─ page.tsx                 企業マップ
│  ├─ companies/[id]/          企業詳細
│  ├─ jobs/[id]/               仕事詳細
│  ├─ ask/                     仕事Q&A
│  ├─ visit/[jobId]/           OB/OG訪問への橋渡し
│  ├─ dashboard/               解像度ダッシュボード
│  ├─ hr/                      学生インサイト（人事）
│  ├─ hr/students/             訪問意欲の高い学生（人事）
│  └─ api/ask, api/visit-questions   回答生成API（サーバー側）
└─ components/           共通UI（根拠バッジ、企業マップ、OB/OGカードなど）
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

### 4. OB/OG訪問の質問提案（VisitQuestionSuggester）

`RuleBasedSuggester` を、LLMを使う実装に替えられます。入力は「職種の公開情報で欠けているトピック」と「学生の答えられなかった質問」です。ここでも、提案の理由に使ったソースや質問を出力に含めるようにします。

### 5. 行動ログ

`lib/store.ts` は localStorage に保存しています。本番ではイベントをサーバーに送り、人事向けの集計（`lib/analytics.ts`）をDB側のクエリに移します。人事に見せるのは匿名IDだけにして、個人情報は学生が訪問を依頼したときに初めて開示する設計を想定しています。

---

## プロトタイプでやっていないこと

認証、決済、本番DB、本物のLLM・ベクトル検索との連携、実在企業のデータ。

## 既知の制限

- キーワード辞書による簡易検索なので、辞書にない言い回しには反応しないことがあります（例：「給料」は拾えるが「お金」は拾えない）。
- モック学生の質問ログの回答可否は、読み込み時に現在のソースで判定しています（本番では質問した時点の判定を記録する想定）。
- ダークモードには対応していません（ライト表示のみ）。
