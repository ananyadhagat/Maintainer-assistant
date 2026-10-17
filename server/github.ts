import {
  RepositoryMetadata,
  GitHubIssue,
  GitHubPullRequest,
} from '../src/types.js';
import { DEMO_REPOSITORIES } from './fixtures.js';

export interface GitHubApiOptions {
  token?: string;
  forceDemo?: boolean;
}

export function parseRepoUrl(input: string): { owner: string; repo: string } | null {
  if (!input || typeof input !== 'string') return null;
  let cleaned = input.trim();

  // Strip git+ or git:// or ssh or https://github.com
  cleaned = cleaned.replace(/^(https?:\/\/)?(www\.)?github\.com\//i, '');
  cleaned = cleaned.replace(/\.git$/i, '');
  cleaned = cleaned.replace(/^\/+|\/+$/g, '');

  const parts = cleaned.split('/');
  if (parts.length >= 2) {
    const owner = parts[0].trim();
    const repo = parts[1].trim();
    if (/^[a-zA-Z0-9_.-]+$/.test(owner) && /^[a-zA-Z0-9_.-]+$/.test(repo)) {
      return { owner, repo };
    }
  }
  return null;
}

export function isValidGitHubToken(token?: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const t = token.trim();
  // Valid GitHub tokens start with ghp_, github_pat_, gho_, ghu_, or 40-char hex
  return t.length >= 20 && (/^(ghp_|github_pat_|gho_|ghu_|ghs_)/i.test(t) || /^[a-f0-9]{40}$/i.test(t));
}

export class GitHubService {
  private defaultToken: string;

  constructor() {
    this.defaultToken = process.env.GITHUB_TOKEN || '';
  }

  private getHeaders(customToken?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': 'Maintainer-Copilot/1.0 (AI Studio Assistant)',
      Accept: 'application/vnd.github.v3+json',
    };
    const token = customToken || this.defaultToken;
    if (isValidGitHubToken(token)) {
      headers['Authorization'] = `Bearer ${token.trim()}`;
    }
    return headers;
  }

  async getRepository(
    owner: string,
    repo: string,
    options: GitHubApiOptions = {}
  ): Promise<{ metadata: RepositoryMetadata; isDemo: boolean; rateLimitRemaining?: number }> {
    // Only use demo data if user requested forceDemo AND repository is a registered demo fixture
    const key = `${owner.toLowerCase()}/${repo.toLowerCase()}`;
    if (options.forceDemo && DEMO_REPOSITORIES[key]) {
      const demo = DEMO_REPOSITORIES[key];
      return {
        metadata: {
          ...demo.metadata,
          name: repo,
          full_name: `${owner}/${repo}`,
          owner: {
            ...demo.metadata.owner,
            login: owner,
          },
        },
        isDemo: true,
        rateLimitRemaining: 9999,
      };
    }

    const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
    const response = await fetch(url, { headers: this.getHeaders(options.token) });

    const remaining = response.headers.get('x-ratelimit-remaining');
    const rateLimitRemaining = remaining ? parseInt(remaining, 10) : undefined;
    const resetTime = response.headers.get('x-ratelimit-reset');
    const resetDate = resetTime ? new Date(parseInt(resetTime, 10) * 1000).toLocaleTimeString() : '';

    if (response.status === 404) {
      throw new Error(`Repository "${owner}/${repo}" was not found on GitHub. Verify the URL, owner, and repository name.`);
    }

    if (response.status === 403) {
      if (rateLimitRemaining === 0) {
        throw new Error(
          `GitHub API rate limit exhausted (resets at ${resetDate}). Please add a GitHub Personal Access Token in Settings to get 5,000 req/hr, or enable Demo Mode.`
        );
      }
      throw new Error(`Access forbidden to repository "${owner}/${repo}". It might be private or require authentication.`);
    }

    if (!response.ok) {
      throw new Error(`GitHub API error (${response.status}): ${response.statusText}`);
    }

    const data = await response.json();
    const metadata: RepositoryMetadata = {
      id: data.id,
      name: data.name,
      full_name: data.full_name,
      owner: {
        login: data.owner.login,
        avatar_url: data.owner.avatar_url,
        html_url: data.owner.html_url,
      },
      description: data.description,
      html_url: data.html_url,
      stargazers_count: data.stargazers_count,
      forks_count: data.forks_count,
      open_issues_count: data.open_issues_count,
      language: data.language,
      default_branch: data.default_branch,
      license: data.license,
      updated_at: data.updated_at,
    };

    return { metadata, isDemo: false, rateLimitRemaining };
  }

  async getIssues(
    owner: string,
    repo: string,
    options: GitHubApiOptions = {}
  ): Promise<{ issues: GitHubIssue[]; isDemo: boolean; totalFetched: number }> {
    const key = `${owner.toLowerCase()}/${repo.toLowerCase()}`;
    if (options.forceDemo && DEMO_REPOSITORIES[key]) {
      const demo = DEMO_REPOSITORIES[key];
      return { issues: demo.issues, isDemo: true, totalFetched: demo.issues.length };
    }

    const headers = this.getHeaders(options.token);

    const mapRawItemToIssue = (item: any): GitHubIssue => ({
      id: item.id,
      number: item.number,
      title: item.title,
      body: item.body || '',
      state: item.state,
      html_url: item.html_url,
      user: {
        login: item.user?.login || 'unknown',
        avatar_url: item.user?.avatar_url,
        html_url: item.user?.html_url,
      },
      assignee: item.assignee
        ? {
            login: item.assignee.login,
            avatar_url: item.assignee.avatar_url,
            html_url: item.assignee.html_url,
          }
        : null,
      assignees: (item.assignees || []).map((a: any) => ({
        login: a.login,
        avatar_url: a.avatar_url,
        html_url: a.html_url,
      })),
      labels: item.labels || [],
      comments: item.comments || 0,
      created_at: item.created_at,
      updated_at: item.updated_at,
      closed_at: item.closed_at,
    });

    // Strategy 1: GitHub Search API (guarantees pure issues, never contaminated with pull requests)
    try {
      const openSearchUrl = `https://api.github.com/search/issues?q=repo:${encodeURIComponent(owner)}/${encodeURIComponent(
        repo
      )}+is:issue+is:open&per_page=100`;
      const closedSearchUrl = `https://api.github.com/search/issues?q=repo:${encodeURIComponent(owner)}/${encodeURIComponent(
        repo
      )}+is:issue+is:closed&sort=updated&order=desc&per_page=100`;

      const [openRes, closedRes] = await Promise.all([
        fetch(openSearchUrl, { headers }),
        fetch(closedSearchUrl, { headers }),
      ]);

      if (openRes.ok) {
        const openData = await openRes.json();
        const closedData = closedRes.ok ? await closedRes.json() : { items: [] };

        const issueMap = new Map<number, GitHubIssue>();

        for (const item of openData.items || []) {
          if (!item.pull_request) {
            issueMap.set(item.number, mapRawItemToIssue(item));
          }
        }

        for (const item of closedData.items || []) {
          if (!item.pull_request && !issueMap.has(item.number)) {
            issueMap.set(item.number, mapRawItemToIssue(item));
          }
        }

        const issues = Array.from(issueMap.values());
        if (issues.length > 0) {
          return { issues, isDemo: false, totalFetched: issues.length };
        }
      }
    } catch (searchErr) {
      console.warn('GitHub Search API call failed, falling back to repository issues endpoint:', searchErr);
    }

    // Strategy 2: Direct repository endpoint fallback with pagination and state filtering
    try {
      const openIssuesUrlP1 = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
        repo
      )}/issues?state=open&per_page=100&page=1`;
      const openIssuesUrlP2 = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
        repo
      )}/issues?state=open&per_page=100&page=2`;
      const closedIssuesUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
        repo
      )}/issues?state=closed&per_page=100&sort=updated&direction=desc`;

      const [p1Res, p2Res, closedRes] = await Promise.all([
        fetch(openIssuesUrlP1, { headers }),
        fetch(openIssuesUrlP2, { headers }),
        fetch(closedIssuesUrl, { headers }),
      ]);

      if (!p1Res.ok && !closedRes.ok) {
        const remaining = p1Res.headers.get('x-ratelimit-remaining');
        if (p1Res.status === 403 && remaining === '0') {
          throw new Error('GitHub API rate limit exceeded while retrieving issues. Please provide a token in Settings or use Demo Mode.');
        }
        throw new Error(`Failed to fetch live issues from GitHub (${p1Res.status}): ${p1Res.statusText}`);
      }

      const p1Data = p1Res.ok ? await p1Res.json() : [];
      const p2Data = p2Res.ok ? await p2Res.json() : [];
      const closedData = closedRes.ok ? await closedRes.json() : [];

      const rawCombined = [
        ...(Array.isArray(p1Data) ? p1Data : []),
        ...(Array.isArray(p2Data) ? p2Data : []),
        ...(Array.isArray(closedData) ? closedData : []),
      ];

      const issueMap = new Map<number, GitHubIssue>();
      for (const item of rawCombined) {
        if (!item.pull_request && !issueMap.has(item.number)) {
          issueMap.set(item.number, mapRawItemToIssue(item));
        }
      }

      const issues = Array.from(issueMap.values());
      return { issues, isDemo: false, totalFetched: issues.length };
    } catch (err: any) {
      throw new Error(`Failed to fetch live issues from GitHub: ${err.message}`);
    }
  }

  async getPullRequests(
    owner: string,
    repo: string,
    options: GitHubApiOptions = {}
  ): Promise<{ pulls: GitHubPullRequest[]; isDemo: boolean }> {
    const key = `${owner.toLowerCase()}/${repo.toLowerCase()}`;
    if (options.forceDemo && DEMO_REPOSITORIES[key]) {
      const demo = DEMO_REPOSITORIES[key];
      return { pulls: demo.pulls, isDemo: true };
    }

    const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
      repo
    )}/pulls?state=all&per_page=30&sort=updated&direction=desc`;
    const response = await fetch(url, { headers: this.getHeaders(options.token) });

    if (!response.ok) {
      throw new Error(`Failed to fetch live pull requests (${response.status}): ${response.statusText}`);
    }

    const rawItems = await response.json();
    const pulls: GitHubPullRequest[] = rawItems.map((item: any) => ({
      id: item.id,
      number: item.number,
      title: item.title,
      body: item.body || '',
      state: item.state,
      html_url: item.html_url,
      user: {
        login: item.user?.login || 'unknown',
        avatar_url: item.user?.avatar_url,
        html_url: item.user?.html_url,
      },
      created_at: item.created_at,
      updated_at: item.updated_at,
      merged_at: item.merged_at,
      draft: item.draft,
      base: { ref: item.base?.ref || 'main' },
      head: { ref: item.head?.ref || '', sha: item.head?.sha || '' },
    }));

    return { pulls, isDemo: false };
  }

  async getPullRequestDiff(
    owner: string,
    repo: string,
    prNumber: number,
    options: GitHubApiOptions = {}
  ): Promise<{ diff: string; isDemo: boolean }> {
    const key = `${owner.toLowerCase()}/${repo.toLowerCase()}`;
    if (options.forceDemo && DEMO_REPOSITORIES[key]) {
      const demo = DEMO_REPOSITORIES[key];
      const sample = demo.sampleDiffs[prNumber] || `diff --git a/README.md b/README.md\n+ Added documentation updates for #${prNumber}`;
      return { diff: sample, isDemo: true };
    }

    const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
      repo
    )}/pulls/${prNumber}`;
    const headers = {
      ...this.getHeaders(options.token),
      Accept: 'application/vnd.github.v3.diff',
    };
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Failed to fetch live PR diff (${response.status}): ${response.statusText}`);
    }

    let diff = await response.text();
    if (diff.length > 25000) {
      diff = diff.slice(0, 25000) + '\n\n... [Diff truncated for size limit] ...';
    }
    return { diff, isDemo: false };
  }

  async getIssueComments(
    owner: string,
    repo: string,
    issueNumber: number,
    options: GitHubApiOptions = {}
  ): Promise<Array<{ author: string; body: string; created_at: string }>> {
    try {
      const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
        repo
      )}/issues/${issueNumber}/comments?per_page=10`;
      const response = await fetch(url, { headers: this.getHeaders(options.token) });
      if (!response.ok) return [];
      const comments = await response.json();
      return comments.map((c: any) => ({
        author: c.user?.login || 'unknown',
        body: c.body || '',
        created_at: c.created_at,
      }));
    } catch {
      return [];
    }
  }
}

export const gitHubService = new GitHubService();
