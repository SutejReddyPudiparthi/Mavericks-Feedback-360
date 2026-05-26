// Stub AI service — replace with AWS Comprehend or equivalent in production
import prisma from '../prismaClient.js';

const SENTIMENT_KEYWORDS = {
  Positive: ['great', 'excellent', 'good', 'helpful', 'clear', 'amazing', 'best', 'enjoyed', 'learned'],
  Negative: ['poor', 'bad', 'boring', 'unclear', 'waste', 'disappointing', 'confusing', 'slow'],
};

const classifySentiment = (text) => {
  if (!text || text.length < 10) return { label: 'Insufficient Data', score: null };
  const lower = text.toLowerCase();
  let pos = 0, neg = 0;
  SENTIMENT_KEYWORDS.Positive.forEach(w => { if (lower.includes(w)) pos++; });
  SENTIMENT_KEYWORDS.Negative.forEach(w => { if (lower.includes(w)) neg++; });
  if (pos === 0 && neg === 0) return { label: 'Neutral', score: 0.6 };
  if (pos >= neg) return { label: 'Positive', score: +(pos / (pos + neg)).toFixed(2) };
  return { label: 'Negative', score: +(neg / (pos + neg)).toFixed(2) };
};

export const runSentimentForCycle = async (cycleId) => {
  const forms = await prisma.maverickFeedbackForm.findMany({
    where: { cycleId, status: 'Submitted' },
  });
  for (const form of forms) {
    const fields = [
      { name: 'keyLearnings', text: form.keyLearnings },
      { name: 'suggestedImprovements', text: form.suggestedImprovements },
      { name: 'followUpResponse', text: form.followUpResponse },
    ];
    for (const { name, text } of fields) {
      if (!text) continue;
      const { label, score } = classifySentiment(text);
      await prisma.sentimentResult.upsert({
        where: { formId_fieldName: { formId: form.id, fieldName: name } },
        update: { sentimentLabel: label, confidenceScore: score },
        create: { formId: form.id, fieldName: name, sentimentLabel: label, confidenceScore: score },
      }).catch(() =>
        prisma.sentimentResult.create({
          data: { formId: form.id, fieldName: name, sentimentLabel: label, confidenceScore: score },
        })
      );
    }
  }
};

export const runThemeClusteringForCycle = async (cycleId) => {
  const forms = await prisma.maverickFeedbackForm.findMany({
    where: { cycleId, status: 'Submitted' },
  });
  if (forms.length < 10) return;

  const allText = forms.flatMap(f => [f.keyLearnings, f.suggestedImprovements].filter(Boolean));
  const themes = {};
  allText.forEach(text => {
    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 4);
    words.forEach(w => { themes[w] = (themes[w] || 0) + 1; });
  });

  const topThemes = Object.entries(themes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  await prisma.themeCluster.deleteMany({ where: { cycleId } });
  for (const [label, count] of topThemes) {
    const samples = allText.filter(t => t.toLowerCase().includes(label)).slice(0, 3);
    await prisma.themeCluster.create({
      data: { cycleId, themeLabel: label, frequencyCount: count, sampleResponses: JSON.stringify(samples) },
    });
  }
};

export const getTrainerRecommendations = async (domain) => {
  const trainers = await prisma.trainer.findMany({
    where: { domain, status: 'Active' },
    include: { sessions: { include: { cycles: { include: { maverickForms: true } } } } },
  });

  const ranked = trainers.map(trainer => {
    const allForms = trainer.sessions.flatMap(s => s.cycles.flatMap(c => c.maverickForms.filter(f => f.status === 'Submitted')));
    const sessionCount = trainer.sessions.length;
    if (sessionCount < 2) return { trainer, compositeScore: null, sessionCount, avgRating: null };
    const ratings = allForms.map(f => f.overallRating).filter(Boolean);
    const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    const compositeScore = +(avgRating * 0.7 + (sessionCount * 0.3)).toFixed(2);
    return { trainer, compositeScore, sessionCount, avgRating: +avgRating.toFixed(2) };
  }).filter(r => r.compositeScore !== null).sort((a, b) => b.compositeScore - a.compositeScore);

  return ranked;
};
