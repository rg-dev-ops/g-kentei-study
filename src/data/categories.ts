import type { Category, CategoryId, Tag } from '../types';

// G検定シラバス 2024年版（2026年時点でも継続使用）の 10 分野。
// weight は模試の出題配分に使う推定値（合計 1.0）。
export const CATEGORIES: Category[] = [
  {
    id: 1,
    name: '人工知能とは',
    weight: 0.05,
    tags: [
      { id: 'c1-definition', name: 'AIの定義とレベル分類' },
      { id: 'c1-ai-effect', name: 'AI効果' },
      { id: 'c1-history', name: 'AIの歴史と3度のブーム' },
      { id: 'c1-strong-weak', name: '強いAIと弱いAI' },
      { id: 'c1-frame', name: 'フレーム問題・シンボルグラウンディング問題' },
      { id: 'c1-turing', name: 'チューリングテスト・中国語の部屋' },
      { id: 'c1-singularity', name: 'シンギュラリティ' },
    ],
  },
  {
    id: 2,
    name: '人工知能をめぐる動向',
    weight: 0.07,
    tags: [
      { id: 'c2-search', name: '探索・推論' },
      { id: 'c2-game', name: 'ゲームAI（ミニマックス法・MCTS）' },
      { id: 'c2-knowledge', name: '知識表現とオントロジー' },
      { id: 'c2-expert', name: 'エキスパートシステム' },
      { id: 'c2-ml-rise', name: '機械学習と統計的自然言語処理' },
      { id: 'c2-dl-rise', name: 'ディープラーニングの登場' },
    ],
  },
  {
    id: 3,
    name: '機械学習の概要',
    weight: 0.13,
    tags: [
      { id: 'c3-learning-types', name: '教師あり・教師なし・強化学習' },
      { id: 'c3-regression', name: '線形回帰・ロジスティック回帰' },
      { id: 'c3-tree-ensemble', name: '決定木とアンサンブル学習' },
      { id: 'c3-svm', name: 'サポートベクターマシン' },
      { id: 'c3-clustering', name: 'クラスタリング' },
      { id: 'c3-dimred', name: '次元削減' },
      { id: 'c3-rl', name: '強化学習の基礎' },
      { id: 'c3-metrics', name: '評価指標' },
      { id: 'c3-overfitting', name: '過学習と正則化' },
      { id: 'c3-validation', name: '交差検証とモデル選択' },
    ],
  },
  {
    id: 4,
    name: 'ディープラーニングの概要',
    weight: 0.1,
    tags: [
      { id: 'c4-nn-basics', name: 'ニューラルネットワークの基礎' },
      { id: 'c4-activation', name: '活性化関数' },
      { id: 'c4-backprop', name: '誤差逆伝播法と勾配消失' },
      { id: 'c4-optimizer', name: '最適化手法' },
      { id: 'c4-loss', name: '損失関数' },
      { id: 'c4-regularization', name: 'ドロップアウト・早期終了' },
      { id: 'c4-normalization', name: 'バッチ正規化などの正規化手法' },
      { id: 'c4-hardware', name: 'GPU・TPUなどのハードウェア' },
    ],
  },
  {
    id: 5,
    name: 'ディープラーニングの要素技術',
    weight: 0.15,
    tags: [
      { id: 'c5-conv', name: '畳み込み層とプーリング層' },
      { id: 'c5-cnn-models', name: '代表的なCNNモデル' },
      { id: 'c5-rnn', name: 'RNN・LSTM・GRU' },
      { id: 'c5-attention', name: 'Attention と Transformer' },
      { id: 'c5-autoencoder', name: 'オートエンコーダ' },
      { id: 'c5-augmentation', name: 'データ拡張' },
      { id: 'c5-transfer', name: '転移学習・ファインチューニング' },
      { id: 'c5-skip', name: 'スキップ結合・正規化層' },
    ],
  },
  {
    id: 6,
    name: 'ディープラーニングの応用例',
    weight: 0.15,
    tags: [
      { id: 'c6-detection', name: '物体検出' },
      { id: 'c6-segmentation', name: 'セグメンテーション' },
      { id: 'c6-nlp', name: '自然言語処理と単語埋め込み' },
      { id: 'c6-llm', name: '大規模言語モデル（LLM）' },
      { id: 'c6-speech', name: '音声処理' },
      { id: 'c6-drl', name: '深層強化学習' },
      { id: 'c6-generative', name: '生成モデル（VAE・GAN・拡散モデル）' },
      { id: 'c6-multimodal', name: 'マルチモーダル' },
      { id: 'c6-xai', name: 'モデルの解釈性（XAI）' },
      { id: 'c6-compression', name: 'モデルの軽量化' },
    ],
  },
  {
    id: 7,
    name: 'AIの社会実装に向けて',
    weight: 0.07,
    tags: [
      { id: 'c7-project', name: 'AIプロジェクトの進め方' },
      { id: 'c7-data', name: 'データの収集と加工' },
      { id: 'c7-mlops', name: '運用とMLOps' },
      { id: 'c7-business', name: 'AIとビジネス活用' },
    ],
  },
  {
    id: 8,
    name: 'AIに必要な数理・統計知識',
    weight: 0.06,
    tags: [
      { id: 'c8-statistics', name: '記述統計' },
      { id: 'c8-probability', name: '確率と確率分布' },
      { id: 'c8-correlation', name: '相関と検定' },
      { id: 'c8-linear-algebra', name: '線形代数' },
      { id: 'c8-calculus', name: '微分' },
      { id: 'c8-information', name: '情報理論' },
      { id: 'c8-distance', name: '距離と類似度' },
    ],
  },
  {
    id: 9,
    name: 'AIに関する法律と契約',
    weight: 0.11,
    tags: [
      { id: 'c9-privacy-law', name: '個人情報保護法' },
      { id: 'c9-copyright', name: '著作権法' },
      { id: 'c9-patent', name: '特許法' },
      { id: 'c9-unfair-competition', name: '不正競争防止法' },
      { id: 'c9-contract', name: 'AI開発の契約' },
      { id: 'c9-antitrust', name: '独占禁止法・その他の法規制' },
    ],
  },
  {
    id: 10,
    name: 'AIの倫理・AIガバナンス',
    weight: 0.11,
    tags: [
      { id: 'c10-principles', name: 'AI原則とガイドライン' },
      { id: 'c10-fairness', name: '公平性とバイアス' },
      { id: 'c10-privacy', name: 'プライバシー' },
      { id: 'c10-transparency', name: '透明性・説明責任' },
      { id: 'c10-safety', name: '安全性とセキュリティ' },
      { id: 'c10-misuse', name: 'ディープフェイク・悪用' },
      { id: 'c10-global', name: '国際動向（EU AI法など）' },
      { id: 'c10-governance', name: 'AIガバナンス体制' },
    ],
  },
];

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<
  CategoryId,
  Category
>;

export const TAG_BY_ID: Record<string, Tag & { category: CategoryId }> = Object.fromEntries(
  CATEGORIES.flatMap((c) => c.tags.map((t) => [t.id, { ...t, category: c.id }])),
);
