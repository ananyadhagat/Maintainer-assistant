import {
  RepositoryMetadata,
  GitHubIssue,
  GitHubPullRequest,
  DuplicateGroup,
  CompletenessReport,
  BugDetectiveResult,
  PullRequestAnalysis,
  ReviewDraft,
  AnalysisHistoryItem,
} from '../src/types.js';

class MemoryStore {
  public currentRepo: RepositoryMetadata | null = null;
  public cachedIssues: Record<string, GitHubIssue[]> = {};
  public cachedPulls: Record<string, GitHubPullRequest[]> = {};
  public duplicateGroups: Record<string, DuplicateGroup[]> = {};
  public completenessReports: Record<string, Record<number, CompletenessReport>> = {};
  public prAnalyses: Record<string, Record<number, PullRequestAnalysis>> = {};
  public reviewDrafts: Record<string, ReviewDraft> = {};
  public bugChecks: BugDetectiveResult[] = [];
  public customGitHubToken: string = '';
  public aiProvider: 'google' | 'ollama' = (process.env.AI_PROVIDER as any) === 'ollama' ? 'ollama' : 'google';
  public ollamaBaseUrl: string = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  public customModel: string = '';
  public history: AnalysisHistoryItem[] = [];

  addHistory(item: Omit<AnalysisHistoryItem, 'id' | 'timestamp'>): AnalysisHistoryItem {
    const fullItem: AnalysisHistoryItem = {
      ...item,
      id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
    };
    this.history.unshift(fullItem);
    if (this.history.length > 50) {
      this.history.pop();
    }
    return fullItem;
  }

  saveReviewDraft(draft: ReviewDraft): void {
    this.reviewDrafts[draft.id] = draft;
  }

  updateReviewDraft(id: string, updates: Partial<ReviewDraft>): ReviewDraft | null {
    if (!this.reviewDrafts[id]) return null;
    this.reviewDrafts[id] = { ...this.reviewDrafts[id], ...updates };
    return this.reviewDrafts[id];
  }
}

export const store = new MemoryStore();
