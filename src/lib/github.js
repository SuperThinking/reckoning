// Client-side GitHub API helpers.
// Uses GraphQL where possible (cheaper rate-limit cost, fewer roundtrips).

const GH_GRAPHQL = 'https://api.github.com/graphql';
const GH_REST = 'https://api.github.com';

async function ghGraphQL(token, query, variables = {}) {
  const res = await fetch(GH_GRAPHQL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`GitHub API ${res.status}: ${txt.slice(0, 200)}`);
  }
  const json = await res.json();
  if (json.errors) {
    throw new Error(`GraphQL: ${json.errors.map((e) => e.message).join('; ')}`);
  }
  return {
    data: json.data,
    rateLimit: {
      remaining: parseInt(res.headers.get('x-ratelimit-remaining') || '0', 10),
      limit: parseInt(res.headers.get('x-ratelimit-limit') || '0', 10),
    },
  };
}

export async function validateToken(token) {
  const res = await fetch(`${GH_REST}/user`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Invalid token (HTTP ${res.status})`);
  return res.json();
}

function buildRepoFilters(repos) {
  if (!repos || repos.length === 0) return '';
  return repos.map((r) => `repo:${r}`).join(' ');
}

const QUERY_PR_SEARCH = `
  query PRSearch($q: String!, $after: String) {
    search(query: $q, type: ISSUE, first: 50, after: $after) {
      issueCount
      pageInfo { hasNextPage endCursor }
      nodes {
        ... on PullRequest {
          id number title url state createdAt mergedAt closedAt
          additions deletions changedFiles body
          repository { nameWithOwner }
          author { login }
        }
      }
    }
  }
`;

const QUERY_ISSUE_SEARCH = `
  query IssueSearch($q: String!, $after: String) {
    search(query: $q, type: ISSUE, first: 50, after: $after) {
      issueCount
      pageInfo { hasNextPage endCursor }
      nodes {
        ... on Issue {
          id number title url state createdAt closedAt body
          repository { nameWithOwner }
          author { login }
          comments(first: 1) { totalCount }
        }
      }
    }
  }
`;

async function fetchAllPages(token, query, baseQ, onProgress) {
  const items = [];
  let cursor = null;
  let totalCount = 0;
  let pages = 0;
  while (true) {
    const { data, rateLimit } = await ghGraphQL(token, query, { q: baseQ, after: cursor });
    const search = data.search;
    if (pages === 0) totalCount = search.issueCount;
    items.push(...search.nodes.filter((n) => n && n.id));
    pages += 1;
    if (onProgress) {
      onProgress({ fetched: items.length, total: Math.min(totalCount, 1000), rateLimit });
    }
    if (!search.pageInfo.hasNextPage) break;
    if (items.length >= 1000) break; // GH search API caps at 1000 results
    cursor = search.pageInfo.endCursor;
  }
  return { items, totalCount };
}

export async function fetchContributions({ token, username, fromDate, toDate, repos, onProgress }) {
  const repoFilter = buildRepoFilters(repos);
  const dateRange = `${fromDate}..${toDate}`;

  const authoredQ = `is:pr author:${username} created:${dateRange} ${repoFilter}`.trim();
  const reviewedQ = `is:pr reviewed-by:${username} -author:${username} updated:${dateRange} ${repoFilter}`.trim();
  const commentedQ = `is:pr commenter:${username} -author:${username} -reviewed-by:${username} updated:${dateRange} ${repoFilter}`.trim();
  const issuesQ = `is:issue involves:${username} updated:${dateRange} ${repoFilter}`.trim();

  onProgress({ phase: 'authored', label: 'Fetching authored PRs…' });
  const authored = await fetchAllPages(token, QUERY_PR_SEARCH, authoredQ, (p) =>
    onProgress({ phase: 'authored', ...p })
  );

  onProgress({ phase: 'reviewed', label: 'Fetching reviewed PRs…' });
  const reviewed = await fetchAllPages(token, QUERY_PR_SEARCH, reviewedQ, (p) =>
    onProgress({ phase: 'reviewed', ...p })
  );

  onProgress({ phase: 'commented', label: 'Fetching commented PRs…' });
  const commented = await fetchAllPages(token, QUERY_PR_SEARCH, commentedQ, (p) =>
    onProgress({ phase: 'commented', ...p })
  );

  onProgress({ phase: 'issues', label: 'Fetching issues…' });
  const issues = await fetchAllPages(token, QUERY_ISSUE_SEARCH, issuesQ, (p) =>
    onProgress({ phase: 'issues', ...p })
  );

  // Merge formal reviews + comment-only participation into one Reviewed view.
  const reviewedById = new Map();
  reviewed.items.forEach((pr) => reviewedById.set(pr.id, { ...pr, _role: 'reviewer' }));
  commented.items.forEach((pr) => {
    if (!reviewedById.has(pr.id)) reviewedById.set(pr.id, { ...pr, _role: 'commenter' });
  });
  const reviewMerged = Array.from(reviewedById.values());

  const issuesTagged = issues.items.map((issue) => ({
    ...issue,
    _role: issue.author?.login?.toLowerCase() === username.toLowerCase() ? 'author' : 'participant',
  }));

  return {
    authored: authored.items,
    reviewed: reviewMerged,
    issues: issuesTagged,
    counts: {
      authored: authored.totalCount,
      reviewed: reviewed.totalCount,
      commented: commented.totalCount,
      issues: issues.totalCount,
    },
  };
}

// Pull the user's recently-touched repos for the type-ahead filter.
export async function fetchUserRepos(token, username) {
  const query = `
    query UserRepos($login: String!) {
      user(login: $login) {
        contributionsCollection {
          commitContributionsByRepository(maxRepositories: 100) {
            repository { nameWithOwner }
          }
          pullRequestContributionsByRepository(maxRepositories: 100) {
            repository { nameWithOwner }
          }
        }
      }
    }
  `;
  try {
    const { data } = await ghGraphQL(token, query, { login: username });
    const c = data.user?.contributionsCollection;
    const set = new Set();
    c?.commitContributionsByRepository?.forEach((r) => set.add(r.repository.nameWithOwner));
    c?.pullRequestContributionsByRepository?.forEach((r) => set.add(r.repository.nameWithOwner));
    return Array.from(set).sort();
  } catch {
    return [];
  }
}
