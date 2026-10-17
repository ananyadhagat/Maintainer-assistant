import {
  RepositoryAnalysisSummary,
  GitHubIssue,
  GitHubPullRequest,
  DuplicateGroup,
  CompletenessReport,
  BugDetectiveResult,
  PullRequestAnalysis,
  ReviewDraft,
  AnalysisHistoryItem,
  StreamStageId,
  StreamLog,
  ArchitectureAnalysisResult,
  ArchitectureNode,
  ArchitectureEdge,
  DiscoveredEndpoint,
  ArchitectureViewMode,
} from './types';

function getHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('maintainer_github_token');
  if (token) {
    headers['x-github-token'] = token;
  }
  return headers;
}

export const api = {
  async getHealth(): Promise<{
    status: string;
    geminiConfigured: boolean;
    githubTokenConfigured: boolean;
    activeRepo: string | null;
  }> {
    const res = await fetch('/api/health');
    return res.json();
  },

  async setGithubToken(token: string): Promise<{ success: boolean; isConfigured: boolean }> {
    if (token) {
      localStorage.setItem('maintainer_github_token', token);
    } else {
      localStorage.removeItem('maintainer_github_token');
    }
    const res = await fetch('/api/settings/token', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ token }),
    });
    return res.json();
  },

  streamAnalyzeRepository(
    url: string,
    callbacks: {
      onStage: (stage: { id: StreamStageId; status: 'in_progress' | 'completed' | 'failed'; percent: number; message: string }) => void;
      onLog: (log: StreamLog) => void;
      onComplete: (data: {
        summary: RepositoryAnalysisSummary;
        issues: GitHubIssue[];
        pulls: GitHubPullRequest[];
        duplicateGroups: DuplicateGroup[];
      }) => void;
      onError: (error: string) => void;
    },
    forceDemo = false
  ): () => void {
    const token = localStorage.getItem('maintainer_github_token') || '';
    const params = new URLSearchParams({
      url,
      forceDemo: forceDemo ? 'true' : 'false',
    });
    if (token) {
      params.append('token', token);
    }

    const abortController = new AbortController();

    fetch(`/api/repository/stream-analyze?${params.toString()}`, {
      signal: abortController.signal,
      headers: {
        Accept: 'text/event-stream',
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: response.statusText }));
          throw new Error(err.error || `HTTP Error ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('ReadableStream not supported.');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const block of lines) {
            if (!block.trim()) continue;
            const eventMatch = block.match(/^event:\s*(\w+)/m);
            const dataMatch = block.match(/^data:\s*(.+)$/m);

            if (eventMatch && dataMatch) {
              const eventType = eventMatch[1];
              try {
                const parsed = JSON.parse(dataMatch[1]);
                if (eventType === 'stage') {
                  callbacks.onStage(parsed);
                } else if (eventType === 'log') {
                  callbacks.onLog(parsed);
                } else if (eventType === 'complete') {
                  callbacks.onComplete(parsed);
                } else if (eventType === 'error') {
                  callbacks.onError(parsed.message || 'Stream analysis failed');
                }
              } catch (e) {
                console.warn('Failed to parse SSE payload:', dataMatch[1]);
              }
            }
          }
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          callbacks.onError(err.message || 'Connection lost');
        }
      });

    return () => {
      abortController.abort();
    };
  },

  async analyzeRepository(url: string, forceDemo = false): Promise<RepositoryAnalysisSummary> {
    const res = await fetch('/api/repository/analyze', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ url, forceDemo }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Analysis failed' }));
      throw new Error(err.error || `Error ${res.status}: ${res.statusText}`);
    }
    return res.json();
  },

  async getIssues(owner: string, repo: string, demo = false): Promise<{ issues: GitHubIssue[]; totalFetched: number; isDemo: boolean }> {
    const res = await fetch(`/api/repository/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?demo=${demo}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch issues');
    return res.json();
  },

  async getDuplicateGroups(owner: string, repo: string): Promise<{ duplicateGroups: DuplicateGroup[] }> {
    const res = await fetch(`/api/repository/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/duplicate-groups`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load duplicate groups');
    return res.json();
  },

  async checkIssueCompleteness(owner: string, repo: string, issueNumber: number): Promise<CompletenessReport> {
    const res = await fetch('/api/issues/check-completeness', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ owner, repo, issueNumber }),
    });
    if (!res.ok) throw new Error('Failed to evaluate issue completeness');
    return res.json();
  },

  async testModel(): Promise<import('./types').ModelTestResult> {
    const res = await fetch('/api/model/test', {
      method: 'POST',
      headers: getHeaders(),
    });
    return res.json();
  },

  async getModelStatus(): Promise<{ configuredModel: string; isGemma: boolean; hasKey: boolean }> {
    const res = await fetch('/api/model/status', { headers: getHeaders() });
    return res.json();
  },

  async checkBeforeFix(payload: {
    bugTitle: string;
    bugDescription?: string;
    expectedBehavior?: string;
    actualBehavior?: string;
    observedBehavior?: string;
    stepsToReproduce?: string;
    errorMessage?: string;
    relevantFiles?: string;
    repoUrl?: string;
  }): Promise<BugDetectiveResult> {
    const res = await fetch('/api/bugs/check-before-fix', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Pre-fix bug search failed' }));
      throw new Error(err.error || 'Failed to check bug before fixing');
    }
    return res.json();
  },

  async checkBugDuplicates(payload: {
    bugTitle: string;
    bugDescription?: string;
    expectedBehavior?: string;
    actualBehavior?: string;
    observedBehavior?: string;
    stepsToReproduce?: string;
    errorMessage?: string;
    relevantFiles?: string;
    repoUrl?: string;
  }): Promise<BugDetectiveResult> {
    return this.checkBeforeFix(payload);
  },

  async getPullRequests(owner: string, repo: string, demo = false): Promise<{ pulls: GitHubPullRequest[]; isDemo: boolean }> {
    const res = await fetch(`/api/repository/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pull-requests?demo=${demo}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load pull requests');
    return res.json();
  },

  async summarizePullRequest(owner: string, repo: string, prNumber: number): Promise<PullRequestAnalysis> {
    const res = await fetch(`/api/pull-requests/${prNumber}/summarize`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ owner, repo }),
    });
    if (!res.ok) throw new Error('Failed to summarize pull request');
    return res.json();
  },

  async generateReviewDraft(owner: string, repo: string, prNumber: number, userFeedback?: string): Promise<ReviewDraft> {
    const res = await fetch(`/api/pull-requests/${prNumber}/review-draft`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ owner, repo, userFeedback }),
    });
    if (!res.ok) throw new Error('Failed to generate review draft');
    return res.json();
  },

  async getReviewDrafts(): Promise<{ drafts: ReviewDraft[] }> {
    const res = await fetch('/api/review-drafts', { headers: getHeaders() });
    return res.json();
  },

  async updateReviewDraft(id: string, updates: Partial<ReviewDraft>): Promise<ReviewDraft> {
    const res = await fetch(`/api/review-drafts/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  async getHistory(): Promise<{ history: AnalysisHistoryItem[] }> {
    const res = await fetch('/api/analysis/history', { headers: getHeaders() });
    return res.json();
  },

  // Architecture Visualizer API
  async analyzeArchitecture(
    url: string,
    branch?: string,
    forceDemo = false
  ): Promise<ArchitectureAnalysisResult> {
    const res = await fetch('/api/architecture/analyze', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ url, branch, forceDemo }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Architecture analysis failed' }));
      throw new Error(err.error || `HTTP ${res.status}: ${res.statusText}`);
    }
    return res.json();
  },

  async getArchitectureAnalysis(analysisId: string): Promise<ArchitectureAnalysisResult> {
    const res = await fetch(`/api/architecture/${encodeURIComponent(analysisId)}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load architecture analysis');
    return res.json();
  },

  async getArchitectureGraph(
    analysisId: string,
    viewMode: ArchitectureViewMode = 'system'
  ): Promise<{ nodes: ArchitectureNode[]; edges: ArchitectureEdge[] }> {
    const res = await fetch(
      `/api/architecture/${encodeURIComponent(analysisId)}/graph?viewMode=${viewMode}`,
      { headers: getHeaders() }
    );
    if (!res.ok) throw new Error('Failed to load architecture graph');
    return res.json();
  },

  async getArchitectureEndpoints(analysisId: string): Promise<{ endpoints: DiscoveredEndpoint[] }> {
    const res = await fetch(`/api/architecture/${encodeURIComponent(analysisId)}/endpoints`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load discovered endpoints');
    return res.json();
  },

  async getSourceSnippet(
    analysisId: string,
    filePath: string,
    startLine?: number,
    endLine?: number
  ): Promise<{ filePath: string; startLine: number; endLine: number; totalLines: number; content: string }> {
    const params = new URLSearchParams({ file: filePath });
    if (startLine) params.append('start', startLine.toString());
    if (endLine) params.append('end', endLine.toString());

    const res = await fetch(`/api/architecture/${encodeURIComponent(analysisId)}/source?${params.toString()}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch source snippet');
    return res.json();
  },
};

