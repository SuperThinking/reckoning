import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDownUp,
  Check,
  ChevronDown,
  Copy,
  Eye as EyeShown,
  EyeOff,
  ExternalLink,
  Eye,
  FileText,
  GitPullRequest,
  Loader2,
  MessageSquare,
  Search,
  Send,
  Settings,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { Button, Logo, Markdown, Modal } from './ui.jsx';
import { callAI, PROVIDER_LABELS, PROVIDER_KEY_PLACEHOLDERS } from '../lib/ai.js';
import { storage, STORAGE_KEYS } from '../lib/storage.js';

function ContributionCard({ item, type }) {
  const [showDesc, setShowDesc] = useState(false);

  const stateColor =
    item.state === 'MERGED'
      ? 'bg-purple-100 text-purple-800 border-purple-200'
      : item.state === 'OPEN'
      ? 'bg-green-100 text-green-800 border-green-200'
      : item.state === 'CLOSED'
      ? 'bg-red-100 text-red-800 border-red-200'
      : 'bg-stone-100 text-stone-700 border-stone-200';

  const roleLabel =
    type === 'reviewed'
      ? item._role === 'reviewer'
        ? 'Reviewed'
        : 'Commented'
      : type === 'issues'
      ? item._role === 'author'
        ? 'Opened'
        : 'Participated'
      : 'Authored';

  return (
    <>
      <div className="border border-stone-200 bg-white hover:border-stone-400 transition-colors">
        <div className="p-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs mb-1.5 flex-wrap">
              <span className="font-mono text-stone-500">{item.repository.nameWithOwner}</span>
              <span className="text-stone-300">·</span>
              <span
                className={`px-1.5 py-0.5 border text-[10px] uppercase tracking-wider font-medium ${stateColor}`}
              >
                {item.state}
              </span>
              <span className="text-stone-300">·</span>
              <span className="text-stone-600 font-medium">{roleLabel}</span>
            </div>
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="text-stone-900 hover:text-amber-700 font-medium leading-snug inline-flex items-start gap-1 group"
            >
              <span>{item.title}</span>
              <ExternalLink className="w-3 h-3 mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </a>
            <div className="text-xs text-stone-500 mt-1.5 font-mono">
              #{item.number} · {new Date(item.createdAt).toLocaleDateString()}
              {item.mergedAt && ` · merged ${new Date(item.mergedAt).toLocaleDateString()}`}
              {item.additions != null && ` · +${item.additions} −${item.deletions}`}
            </div>
            {item.body && (
              <button
                type="button"
                onClick={() => setShowDesc(true)}
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-amber-700 hover:text-amber-900 font-medium"
              >
                <FileText className="w-3.5 h-3.5" />
                View description
              </button>
            )}
          </div>
        </div>
      </div>
      <Modal
        open={showDesc}
        onClose={() => setShowDesc(false)}
        title={
          <div>
            <div className="flex items-center gap-2 text-xs mb-1 flex-wrap">
              <span className="font-mono text-stone-500">{item.repository.nameWithOwner}</span>
              <span className="text-stone-300">·</span>
              <span
                className={`px-1.5 py-0.5 border text-[10px] uppercase tracking-wider font-medium ${stateColor}`}
              >
                {item.state}
              </span>
              <span className="text-stone-300">·</span>
              <span className="font-mono text-stone-500">#{item.number}</span>
            </div>
            <div className="font-serif text-lg text-stone-900 leading-snug">{item.title}</div>
          </div>
        }
        headerRight={
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 px-2 py-1 border border-amber-300 bg-amber-50"
          >
            Open on GitHub <ExternalLink className="w-3 h-3" />
          </a>
        }
      >
        {item.body ? (
          <Markdown>{item.body}</Markdown>
        ) : (
          <div className="text-sm text-stone-500 italic">No description.</div>
        )}
      </Modal>
    </>
  );
}

function SummaryPanel({ creds, items, viewType, summaryCache, setSummaryCache }) {
  const [summary, setSummary] = useState(summaryCache[viewType] || '');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSummary(summaryCache[viewType] || '');
    setError('');
  }, [viewType, summaryCache]);

  const generate = async () => {
    if (!creds.aiKey) {
      setError('No AI key provided. Add one via the AI settings button in the header.');
      return;
    }
    setGenerating(true);
    setError('');
    try {
      const compact = items.slice(0, 200).map((i) => ({
        repo: i.repository.nameWithOwner,
        title: i.title,
        state: i.state,
        date: i.createdAt?.slice(0, 10),
        role: i._role || 'author',
        url: i.url,
        snippet: (i.body || '').slice(0, 300),
      }));

      const labels = {
        contributed: 'Pull Requests I authored or co-authored',
        reviewed: 'Pull Requests I reviewed or commented on',
        issues: 'Issues I opened or participated in',
      };

      const system =
        "You are an engineering career assistant. You're helping a software engineer summarize their GitHub activity into a self-review for a performance feedback cycle. Be specific, factual, and use the engineer's own framing — never inflate or invent. Output well-structured markdown.";

      const prompt = `Here is a list of ${labels[viewType]} for user "${creds.username}" during their feedback window.

For each item I've included: repo, title, state, date, role, URL, and a snippet of the description.

Please produce a structured self-review section covering THIS view only:

1. **Headline accomplishments** — 3 to 5 bullets highlighting the most impactful work, with inline links to the relevant PRs/issues.
2. **Themes** — Group related work into 2-4 themes (e.g. "Authentication refactor", "Performance work", "Onboarding new teammates"). For each theme, briefly describe the throughline and link 2-3 representative items.
3. **By the numbers** — A short paragraph with counts and patterns (e.g. "${items.length} items, X% merged, mostly concentrated in repos Y and Z").
4. **One STAR story** — Pick the single most interesting item and sketch a Situation/Task/Action/Result narrative the engineer could expand on.

Be direct. Skip filler. Preserve the URLs as markdown links.

Data:
${JSON.stringify(compact, null, 2)}`;

      const result = await callAI({
        provider: creds.aiProvider,
        apiKey: creds.aiKey,
        system,
        prompt,
      });
      setSummary(result);
      setSummaryCache({ ...summaryCache, [viewType]: result });
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="border border-amber-300 bg-amber-50">
      <div className="px-4 py-3 border-b border-amber-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-700" />
          <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wider">
            AI Summary [BETA]
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {summary && (
            <Button variant="ghost" onClick={copy} className="!py-1 !px-2 text-xs">
              {copied ? (
                <>
                  <Check className="w-3 h-3" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> Copy
                </>
              )}
            </Button>
          )}
          <Button
            variant="primary"
            onClick={generate}
            disabled={generating || items.length === 0}
            className="!py-1 !px-3 text-xs"
          >
            {generating ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" /> Generating…
              </>
            ) : summary ? (
              'Regenerate'
            ) : (
              'Generate'
            )}
          </Button>
        </div>
      </div>
      <div className="p-4">
        {error && <div className="text-sm text-red-700 mb-2">{error}</div>}
        {!summary && !error && !generating && (
          <p className="text-sm text-stone-600">
            {creds.aiKey
              ? `Generate a structured self-review section from these ${items.length} item${
                  items.length === 1 ? '' : 's'
                }.`
              : 'Add an AI key via the “AI settings” button above to enable summarization.'}
          </p>
        )}
        {generating && (
          <div className="text-sm text-stone-600">Working through your contributions…</div>
        )}
        {summary && (
          <div className="prose prose-sm max-w-none prose-stone whitespace-pre-wrap font-serif leading-relaxed text-stone-800">
            {summary}
          </div>
        )}
      </div>
    </div>
  );
}

function QAPanel({ creds, allData }) {
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
        contributed: allData.authored.slice(0, 150).map((i) => ({
          repo: i.repository.nameWithOwner,
          title: i.title,
          state: i.state,
          date: i.createdAt?.slice(0, 10),
          url: i.url,
          snippet: (i.body || '').slice(0, 200),
        })),
        reviewed: allData.reviewed.slice(0, 150).map((i) => ({
          repo: i.repository.nameWithOwner,
          title: i.title,
          state: i.state,
          date: i.createdAt?.slice(0, 10),
          role: i._role,
          url: i.url,
        })),
        issues: allData.issues.slice(0, 150).map((i) => ({
          repo: i.repository.nameWithOwner,
          title: i.title,
          state: i.state,
          date: i.createdAt?.slice(0, 10),
          role: i._role,
          url: i.url,
          snippet: (i.body || '').slice(0, 200),
        })),
      };
      const system =
        "You are an engineering career assistant. Answer the user's question about their GitHub contributions using ONLY the provided data. Be specific. Cite items as markdown links to their URLs.";
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
          <div className="mt-4 p-3 bg-stone-50 border border-stone-200 text-sm text-stone-800 whitespace-pre-wrap font-serif leading-relaxed">
            {answer}
          </div>
        )}
      </div>
    </div>
  );
}

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest first' },
  { key: 'oldest', label: 'Oldest first' },
  { key: 'changes', label: 'Most changes' },
];

const STATUS_FOR_TAB = {
  contributed: ['OPEN', 'MERGED', 'CLOSED'],
  reviewed: ['OPEN', 'MERGED', 'CLOSED'],
  issues: ['OPEN', 'CLOSED'],
};

const defaultFilterState = () => ({
  statuses: [],
  repos: [],
  query: '',
  sort: 'newest',
});

function ActiveFilterChip({ children, onRemove, tone = 'default' }) {
  const tones = {
    default: 'bg-stone-900 text-amber-50',
    OPEN: 'bg-green-100 text-green-800 border border-green-300',
    MERGED: 'bg-purple-100 text-purple-800 border border-purple-300',
    CLOSED: 'bg-red-100 text-red-800 border border-red-300',
    muted: 'bg-stone-100 text-stone-700 border border-stone-300',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium ${tones[tone] || tones.default}`}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="opacity-70 hover:opacity-100"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

function FilterBar({ items, filter, setFilter, tabKey }) {
  const [expanded, setExpanded] = useState(false);
  const [repoOpen, setRepoOpen] = useState(false);
  const [repoSearch, setRepoSearch] = useState('');

  const repoCounts = useMemo(() => {
    const m = new Map();
    items.forEach((i) => {
      const r = i.repository.nameWithOwner;
      m.set(r, (m.get(r) || 0) + 1);
    });
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [items]);

  const availableStatuses = STATUS_FOR_TAB[tabKey] || [];
  const activeFilterCount =
    filter.statuses.length +
    filter.repos.length +
    (filter.query.trim() ? 1 : 0) +
    (filter.sort !== 'newest' ? 1 : 0);
  const hasActiveFilters = activeFilterCount > 0;

  const toggleStatus = (s) => {
    setFilter({
      ...filter,
      statuses: filter.statuses.includes(s)
        ? filter.statuses.filter((x) => x !== s)
        : [...filter.statuses, s],
    });
  };

  const toggleRepo = (r) => {
    setFilter({
      ...filter,
      repos: filter.repos.includes(r) ? filter.repos.filter((x) => x !== r) : [...filter.repos, r],
    });
  };

  const filteredRepoOptions = repoCounts.filter(([r]) =>
    r.toLowerCase().includes(repoSearch.toLowerCase())
  );

  const statusPillClass = (active, status) => {
    const base = 'px-2.5 py-1 text-xs uppercase tracking-wider font-medium border transition-colors';
    if (!active) return `${base} bg-white border-stone-300 text-stone-600 hover:border-stone-500`;
    if (status === 'OPEN') return `${base} bg-green-100 border-green-400 text-green-800`;
    if (status === 'MERGED') return `${base} bg-purple-100 border-purple-400 text-purple-800`;
    if (status === 'CLOSED') return `${base} bg-red-100 border-red-400 text-red-800`;
    return `${base} bg-stone-900 border-stone-900 text-amber-50`;
  };

  const sortLabel = SORT_OPTIONS.find((o) => o.key === filter.sort)?.label;

  return (
    <div className="border border-stone-200 bg-white mb-4">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2.5 flex items-center justify-between gap-3 text-left hover:bg-stone-50 transition-colors"
      >
        <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
          <span className="text-xs uppercase tracking-wider text-stone-500 font-semibold inline-flex items-center gap-1">
            <ArrowDownUp className="w-3.5 h-3.5" />
            Filter
          </span>
          {hasActiveFilters ? (
            <>
              <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 bg-amber-400 text-stone-900 text-[10px] font-bold">
                {activeFilterCount}
              </span>
              {filter.statuses.map((s) => (
                <ActiveFilterChip key={s} tone={s} onRemove={() => toggleStatus(s)}>
                  {s}
                </ActiveFilterChip>
              ))}
              {filter.query.trim() && (
                <ActiveFilterChip
                  tone="muted"
                  onRemove={() => setFilter({ ...filter, query: '' })}
                >
                  <Search className="w-3 h-3" /> “{filter.query.trim()}”
                </ActiveFilterChip>
              )}
              {filter.repos.map((r) => (
                <ActiveFilterChip key={r} onRemove={() => toggleRepo(r)}>
                  <span className="font-mono">{r}</span>
                </ActiveFilterChip>
              ))}
              {filter.sort !== 'newest' && (
                <ActiveFilterChip
                  tone="muted"
                  onRemove={() => setFilter({ ...filter, sort: 'newest' })}
                >
                  Sort: {sortLabel}
                </ActiveFilterChip>
              )}
            </>
          ) : (
            <span className="text-xs text-stone-500">No filters applied</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasActiveFilters && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                setFilter(defaultFilterState());
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  e.preventDefault();
                  setFilter(defaultFilterState());
                }
              }}
              className="text-xs text-stone-500 hover:text-stone-900 inline-flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3 h-3" /> Reset
            </span>
          )}
          <span className="text-xs text-stone-600 inline-flex items-center gap-1">
            {expanded ? 'Hide' : 'Show'}
            <ChevronDown
              className={`w-4 h-4 text-stone-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-stone-100 px-4 py-3 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] uppercase tracking-wider text-stone-500 mr-1 font-medium">
              Status
            </span>
            {availableStatuses.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleStatus(s)}
                className={statusPillClass(filter.statuses.includes(s), s)}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-stone-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by title…"
              value={filter.query}
              onChange={(e) => setFilter({ ...filter, query: e.target.value })}
              className="flex-1 px-2 py-1.5 bg-white border border-stone-300 text-sm focus:outline-none focus:border-stone-900"
            />
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setRepoOpen(!repoOpen)}
              className="w-full text-left px-3 py-1.5 bg-white border border-stone-300 text-sm flex items-center justify-between hover:border-stone-500"
            >
              <span className="text-stone-700">
                {filter.repos.length === 0
                  ? 'All repositories'
                  : `Filtering to ${filter.repos.length} repo${filter.repos.length === 1 ? '' : 's'}`}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-stone-400 transition-transform ${
                  repoOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {filter.repos.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {filter.repos.map((r) => (
                  <span
                    key={r}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-stone-900 text-amber-50 text-xs font-mono"
                  >
                    {r}
                    <button
                      type="button"
                      onClick={() => toggleRepo(r)}
                      className="hover:text-amber-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {repoOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-stone-300 shadow-lg max-h-72 flex flex-col">
                <div className="p-2 border-b border-stone-100">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search repos…"
                    value={repoSearch}
                    onChange={(e) => setRepoSearch(e.target.value)}
                    className="w-full px-2 py-1 bg-stone-50 border border-stone-200 text-sm focus:outline-none focus:border-stone-900 font-mono"
                  />
                </div>
                <div className="overflow-y-auto">
                  {filteredRepoOptions.length === 0 ? (
                    <div className="px-3 py-4 text-xs text-stone-500 text-center">
                      No repos match.
                    </div>
                  ) : (
                    filteredRepoOptions.map(([r, count]) => {
                      const active = filter.repos.includes(r);
                      return (
                        <label
                          key={r}
                          className={`flex items-center justify-between gap-2 px-3 py-1.5 text-sm cursor-pointer ${
                            active ? 'bg-amber-50' : 'hover:bg-stone-50'
                          }`}
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={active}
                              onChange={() => toggleRepo(r)}
                              className="w-3.5 h-3.5 accent-stone-900 flex-shrink-0"
                            />
                            <span className="font-mono text-xs truncate">{r}</span>
                          </span>
                          <span className="text-[11px] text-stone-500 flex-shrink-0">{count}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-stone-100">
            <span className="text-[11px] uppercase tracking-wider text-stone-500 font-medium">
              Sort
            </span>
            <select
              value={filter.sort}
              onChange={(e) => setFilter({ ...filter, sort: e.target.value })}
              className="text-xs bg-white border border-stone-300 px-2 py-1 focus:outline-none focus:border-stone-900"
            >
              {SORT_OPTIONS.filter((o) => tabKey !== 'issues' || o.key !== 'changes').map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

function applyFilters(items, filter) {
  let out = items;
  if (filter.statuses.length > 0) {
    out = out.filter((i) => filter.statuses.includes(i.state));
  }
  if (filter.repos.length > 0) {
    out = out.filter((i) => filter.repos.includes(i.repository.nameWithOwner));
  }
  const q = filter.query.trim().toLowerCase();
  if (q) {
    out = out.filter((i) => i.title.toLowerCase().includes(q));
  }
  const sorted = [...out];
  if (filter.sort === 'oldest') {
    sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } else if (filter.sort === 'changes') {
    sorted.sort((a, b) => (b.additions || 0) + (b.deletions || 0) - ((a.additions || 0) + (a.deletions || 0)));
  } else {
    sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  return sorted;
}

function AiSettingsModal({ open, onClose, creds, onUpdateCreds }) {
  const [provider, setProvider] = useState(creds.aiProvider || 'anthropic');
  const [key, setKey] = useState(creds.aiKey || '');
  const [persist, setPersist] = useState(creds.persist);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (open) {
      setProvider(creds.aiProvider || 'anthropic');
      setKey(creds.aiKey || '');
      setPersist(creds.persist);
    }
  }, [open, creds.aiProvider, creds.aiKey, creds.persist]);

  const save = () => {
    storage.set(STORAGE_KEYS.aiProvider, provider, persist);
    if (key) {
      storage.set(STORAGE_KEYS.aiKey, key, persist);
    } else {
      // Clear if user emptied the key
      storage.set(STORAGE_KEYS.aiKey, '', persist);
    }
    storage.set(STORAGE_KEYS.persist, persist ? 'true' : 'false', persist);
    onUpdateCreds({ aiProvider: provider, aiKey: key, persist });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div>
          <div className="text-xs uppercase tracking-wider text-stone-500 mb-1">Settings</div>
          <div className="font-serif text-lg text-stone-900">AI provider &amp; key</div>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-stone-600 mb-1.5 font-medium">
            Provider
          </div>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-stone-300 text-stone-900 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 text-sm"
          >
            {Object.entries(PROVIDER_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wider text-stone-600 mb-1.5 font-medium">
            API key
          </div>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              placeholder={PROVIDER_KEY_PLACEHOLDERS[provider]}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full px-3 py-2 pr-10 bg-white border border-stone-300 text-stone-900 placeholder-stone-400 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 text-sm font-mono"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-900"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <EyeShown className="w-4 h-4" />}
            </button>
          </div>
          <div className="text-xs text-stone-500 mt-1">
            Leave blank to disable AI features. Switching providers? Paste the new key here.
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={persist}
            onChange={(e) => setPersist(e.target.checked)}
            className="w-4 h-4 accent-stone-900"
          />
          <span className="text-sm text-stone-800">
            Remember on this device (localStorage instead of session)
          </span>
        </label>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function ResultsScreen({ creds, data, range, onReset, onBack, onUpdateCreds }) {
  const [activeTab, setActiveTab] = useState('contributed');
  const [summaryCache, setSummaryCache] = useState({});
  const [showQA, setShowQA] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [filters, setFilters] = useState({
    contributed: defaultFilterState(),
    reviewed: defaultFilterState(),
    issues: defaultFilterState(),
  });

  const tabs = [
    {
      key: 'contributed',
      label: 'Contributed',
      icon: GitPullRequest,
      items: data.authored,
      hint: 'PRs you authored',
    },
    {
      key: 'reviewed',
      label: 'Reviewed',
      icon: Eye,
      items: data.reviewed,
      hint: 'PRs you reviewed or commented on',
    },
    {
      key: 'issues',
      label: 'Issues',
      icon: AlertCircle,
      items: data.issues,
      hint: 'Issues you opened or participated in',
    },
  ];

  const activeTabData = tabs.find((t) => t.key === activeTab);
  const allActiveItems = activeTabData.items;
  const activeFilter = filters[activeTab];
  const activeItems = useMemo(() => applyFilters(allActiveItems, activeFilter), [
    allActiveItems,
    activeFilter,
  ]);

  const setActiveFilter = (next) => setFilters({ ...filters, [activeTab]: next });

  return (
    <div className="max-w-5xl mx-auto py-10 px-6">
      <div className="flex items-center justify-between mb-8">
        <Logo />
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setShowSettings(true)}>
            <Settings className="w-4 h-4" /> AI settings
          </Button>
          <Button variant="ghost" onClick={onBack}>
            ← New search
          </Button>
          <Button variant="danger" onClick={onReset}>
            <Trash2 className="w-4 h-4" /> Clear &amp; restart
          </Button>
        </div>
      </div>

      <AiSettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        creds={creds}
        onUpdateCreds={onUpdateCreds}
      />

      <div className="mb-8">
        <div className="text-xs uppercase tracking-widest text-stone-500 mb-2">Window</div>
        <h1 className="font-serif text-4xl text-stone-900 tracking-tight">
          {new Date(range.fromDate).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}{' '}
          <span className="text-stone-400">→</span>{' '}
          {new Date(range.toDate).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </h1>
        <div className="mt-2 text-stone-600">
          For <span className="font-mono">{creds.username}</span>
          {range.repos.length > 0 && (
            <> in {range.repos.length} repo{range.repos.length === 1 ? '' : 's'}</>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          const filteredCount = applyFilters(t.items, filters[t.key]).length;
          const showFilteredCount = filteredCount !== t.items.length;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`text-left p-4 border transition-all ${
                isActive
                  ? 'bg-stone-900 text-amber-50 border-stone-900'
                  : 'bg-white text-stone-900 border-stone-200 hover:border-stone-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-stone-500'}`} />
                <span
                  className={`text-3xl font-serif ${isActive ? 'text-amber-100' : 'text-stone-900'}`}
                >
                  {showFilteredCount ? (
                    <>
                      {filteredCount}
                      <span
                        className={`text-base ml-1 ${isActive ? 'text-amber-200/60' : 'text-stone-400'}`}
                      >
                        / {t.items.length}
                      </span>
                    </>
                  ) : (
                    t.items.length
                  )}
                </span>
              </div>
              <div
                className={`text-sm font-semibold uppercase tracking-wider ${
                  isActive ? 'text-amber-200' : 'text-stone-700'
                }`}
              >
                {t.label}
              </div>
              <div className={`text-xs mt-0.5 ${isActive ? 'text-amber-100/70' : 'text-stone-500'}`}>
                {t.hint}
              </div>
            </button>
          );
        })}
      </div>

      {creds.aiKey && (
        <div className="mb-4">
          <Button variant="secondary" onClick={() => setShowQA(!showQA)}>
            <MessageSquare className="w-4 h-4" /> {showQA ? 'Hide' : 'Ask'} questions across all data
          </Button>
        </div>
      )}
      {showQA && (
        <div className="mb-6">
          <QAPanel creds={creds} allData={data} />
        </div>
      )}

      <FilterBar
        items={allActiveItems}
        filter={activeFilter}
        setFilter={setActiveFilter}
        tabKey={activeTab}
      />

      <div className="mb-6">
        <SummaryPanel
          creds={creds}
          items={activeItems}
          viewType={activeTab}
          summaryCache={summaryCache}
          setSummaryCache={setSummaryCache}
        />
      </div>

      <div className="mb-3 text-xs text-stone-500">
        Showing <span className="font-semibold text-stone-700">{activeItems.length}</span>
        {activeItems.length !== allActiveItems.length && (
          <> of {allActiveItems.length}</>
        )}{' '}
        item{activeItems.length === 1 ? '' : 's'}
      </div>

      <div className="space-y-2">
        {activeItems.length === 0 ? (
          <div className="text-center py-12 text-stone-500">
            {allActiveItems.length === 0
              ? 'No items found in this window.'
              : 'No items match the current filters.'}
          </div>
        ) : (
          activeItems.map((item) => (
            <ContributionCard key={item.id} item={item} type={activeTab} />
          ))
        )}
      </div>
    </div>
  );
}
