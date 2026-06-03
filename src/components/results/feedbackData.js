export const VIEW_LABELS = {
  contributed: 'Pull Requests I authored or co-authored',
  reviewed: 'Pull Requests I reviewed or commented on',
  issues: 'Issues I opened or participated in',
};

export function compactItem(i, annotations, snippetLen = 300) {
  const note = annotations?.[i.url];
  return {
    repo: i.repository.nameWithOwner,
    title: i.title,
    state: i.state,
    date: i.createdAt?.slice(0, 10),
    role: i._role || 'author',
    url: i.url,
    snippet: (i.body || '').slice(0, snippetLen),
    ...(note ? { note } : {}),
  };
}

export function buildSummaryPrompt({ viewType, username, items, annotations }) {
  const compact = items.slice(0, 200).map((i) => compactItem(i, annotations));
  const noteCount = compact.filter((c) => c.note).length;
  const notesGuidance = noteCount
    ? `\n\n${noteCount} item${noteCount === 1 ? ' has' : 's have'} an author-written "note" field describing the impact in the engineer's own words. Weight these heavily — they are the source of truth for significance. Quote or paraphrase them; do not contradict.`
    : '';

  return `Here is a list of ${VIEW_LABELS[viewType]} for user "${username}" during their feedback window.

For each item I've included: repo, title, state, date, role, URL, a snippet of the description, and optionally an author-written impact note.${notesGuidance}

Please produce a structured self-review section covering THIS view only:

1. **Headline accomplishments** — 3 to 5 bullets highlighting the most impactful work, with inline links to the relevant PRs/issues. Prefer items that have impact notes.
2. **Themes** — Group related work into 2-4 themes (e.g. "Authentication refactor", "Performance work", "Onboarding new teammates"). For each theme, briefly describe the throughline and link 2-3 representative items.
3. **By the numbers** — A short paragraph with counts and patterns (e.g. "${items.length} items, X% merged, mostly concentrated in repos Y and Z").
4. **One STAR story** — Pick the single most interesting item and sketch a Situation/Task/Action/Result narrative the engineer could expand on.

Be direct. Skip filler. Preserve the URLs as markdown links.

Data:
${JSON.stringify(compact, null, 2)}`;
}

export function buildExportMarkdown({ viewType, username, items, annotations }) {
  const compact = items.map((i) => compactItem(i, annotations));
  const lines = [
    `# ${VIEW_LABELS[viewType]}`,
    `_User: ${username} · ${items.length} item${items.length === 1 ? '' : 's'}_`,
    '',
    'Paste this into ChatGPT / Claude / Gemini with a prompt like:',
    '> Summarize this into a self-review with headline accomplishments, themes, by-the-numbers, and one STAR story. Weight any "Note" lines heavily — those are the author\'s own framing of impact.',
    '',
    '---',
    '',
  ];
  compact.forEach((c) => {
    lines.push(`## [${c.title}](${c.url})`);
    lines.push(`\`${c.repo}\` · ${c.state} · ${c.date} · ${c.role}`);
    if (c.snippet) lines.push(`\n${c.snippet}`);
    if (c.note) lines.push(`\n> **Note:** ${c.note}`);
    lines.push('');
  });
  return lines.join('\n');
}

export function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
