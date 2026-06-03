import React, { useEffect, useState } from 'react';
import { ExternalLink, FileText, Pencil, StickyNote, X } from 'lucide-react';
import { Button, Markdown, Modal } from '../ui.jsx';

export function ContributionCard({ item, type, note, onChangeNote }) {
  const [showDesc, setShowDesc] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [draftNote, setDraftNote] = useState(note || '');

  useEffect(() => {
    setDraftNote(note || '');
  }, [note]);

  const saveNote = () => {
    const trimmed = draftNote.trim();
    if (trimmed !== (note || '')) onChangeNote(trimmed);
    setEditingNote(false);
  };

  const clearNote = () => {
    setDraftNote('');
    onChangeNote('');
    setEditingNote(false);
  };

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
            <div className="mt-2 flex items-center gap-3 flex-wrap">
              {item.body && (
                <button
                  type="button"
                  onClick={() => setShowDesc(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-amber-700 hover:text-amber-900 font-medium"
                >
                  <FileText className="w-3.5 h-3.5" />
                  View description
                </button>
              )}
              {!editingNote && !note && (
                <button
                  type="button"
                  onClick={() => setEditingNote(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 font-medium"
                >
                  <StickyNote className="w-3.5 h-3.5" />
                  Add impact note
                </button>
              )}
            </div>
            {!editingNote && note && (
              <div className="mt-2 flex items-start gap-2 px-2.5 py-1.5 bg-amber-50 border-l-2 border-amber-400 text-xs text-stone-800">
                <StickyNote className="w-3.5 h-3.5 text-amber-700 flex-shrink-0 mt-0.5" />
                <div className="flex-1 whitespace-pre-wrap leading-snug">{note}</div>
                <button
                  type="button"
                  onClick={() => setEditingNote(true)}
                  className="text-stone-500 hover:text-stone-900 flex-shrink-0"
                  aria-label="Edit note"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={clearNote}
                  className="text-stone-500 hover:text-red-700 flex-shrink-0"
                  aria-label="Remove note"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {editingNote && (
              <div className="mt-2">
                <textarea
                  autoFocus
                  value={draftNote}
                  onChange={(e) => setDraftNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      saveNote();
                    } else if (e.key === 'Escape') {
                      setDraftNote(note || '');
                      setEditingNote(false);
                    }
                  }}
                  placeholder="What was the impact? Numbers, scope, who it helped…"
                  rows={2}
                  className="w-full px-2 py-1.5 bg-white border border-stone-300 text-xs text-stone-900 placeholder-stone-400 focus:border-stone-900 focus:outline-none resize-y"
                />
                <div className="mt-1 flex items-center gap-2">
                  <Button variant="primary" onClick={saveNote} className="!py-1 !px-2 text-xs">
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setDraftNote(note || '');
                      setEditingNote(false);
                    }}
                    className="!py-1 !px-2 text-xs"
                  >
                    Cancel
                  </Button>
                  {note && (
                    <button
                      type="button"
                      onClick={clearNote}
                      className="text-xs text-stone-500 hover:text-red-700 ml-auto"
                    >
                      Remove
                    </button>
                  )}
                  <span className="text-[10px] text-stone-400 ml-auto">⌘+Enter to save</span>
                </div>
              </div>
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
