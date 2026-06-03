import React, { useState } from 'react';
import { Loader2, MessageSquare, Send } from 'lucide-react';
import { Button, Markdown } from '../ui.jsx';
import { callAI } from '../../lib/ai.js';
import { compactItem } from './feedbackData.js';

export function QAPanel({ creds, allData, annotations }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState('');

  const ask = async () => {
    if (!question.trim()) return;
    if (!creds.aiKey) {
      setError('No AI key provided.');
      return;
    }
    setAsking(true);
    setError('');
    try {
      const compact = {
        contributed: allData.authored.slice(0, 150).map((i) => compactItem(i, annotations, 200)),
        reviewed: allData.reviewed.slice(0, 150).map((i) => compactItem(i, annotations, 0)),
        issues: allData.issues.slice(0, 150).map((i) => compactItem(i, annotations, 200)),
      };
      const system =
        "You are an engineering career assistant. Answer the user's question about their GitHub contributions using ONLY the provided data. Be specific. Cite items as markdown links to their URLs. When items have an author-written \"note\" field, weight it heavily — it is the engineer's own framing of impact.";
      const prompt = `User question: "${question}"

Their GitHub activity for the feedback window:
${JSON.stringify(compact, null, 2)}`;
      const result = await callAI({
        provider: creds.aiProvider,
        apiKey: creds.aiKey,
        system,
        prompt,
      });
      setAnswer(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="border border-stone-300 bg-white">
      <div className="px-4 py-3 border-b border-stone-200 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-stone-700" />
        <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wider">
          Ask a question
        </h3>
      </div>
      <div className="p-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder='e.g. "What authentication work did I do?" or "Which PRs took longest to merge?"'
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && ask()}
            className="flex-1 px-3 py-2 bg-white border border-stone-300 text-stone-900 placeholder-stone-400 focus:border-stone-900 focus:outline-none text-sm"
          />
          <Button variant="primary" onClick={ask} disabled={asking || !question.trim()}>
            {asking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        {error && <div className="mt-3 text-sm text-red-700">{error}</div>}
        {answer && (
          <div className="mt-4 p-3 bg-stone-50 border border-stone-200">
            <Markdown>{answer}</Markdown>
          </div>
        )}
      </div>
    </div>
  );
}
