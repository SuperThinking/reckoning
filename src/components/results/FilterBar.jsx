import React, { useMemo, useState } from 'react';
import { ArrowDownUp, ChevronDown, Search, X } from 'lucide-react';

export const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest first' },
  { key: 'oldest', label: 'Oldest first' },
  { key: 'changes', label: 'Most changes' },
];

export const STATUS_FOR_TAB = {
  contributed: ['OPEN', 'MERGED', 'CLOSED'],
  reviewed: ['OPEN', 'MERGED', 'CLOSED'],
  issues: ['OPEN', 'CLOSED'],
};

export const defaultFilterState = () => ({
  statuses: [],
  repos: [],
  query: '',
  sort: 'newest',
});

export function applyFilters(items, filter) {
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
    sorted.sort(
      (a, b) => (b.additions || 0) + (b.deletions || 0) - ((a.additions || 0) + (a.deletions || 0))
    );
  } else {
    sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  return sorted;
}

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

export function FilterBar({ items, filter, setFilter, tabKey }) {
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
