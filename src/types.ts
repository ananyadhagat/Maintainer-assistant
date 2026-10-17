export interface GitHubUser {
  login: string;
  avatar_url?: string;
  html_url?: string;
}

export interface GitHubLabel {
  id?: number;
  name: string;
  color: string;
  description?: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  html_url: string;
  user: GitHubUser;
  labels: (string | GitHubLabel)[];
  comments: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  pull_request?: {
    url: string;
    html_url: string;
  };
  assignee?: GitHubUser | null;
  assignees?: GitHubUser[];
  completenessScore?: number;
  duplicateOf?: number;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  html_url: string;
  user: GitHubUser;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  draft?: boolean;
  additions?: number;
  deletions?: number;
  changed_files?: number;
  diff_url?: string;
  patch_url?: string;
  base?: { ref: string };
  head?: { ref: string; sha: string };
}

export interface RepositoryMetadata {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  default_branch: string;
  license?: { name: string; spdx_id?: string } | null;
  updated_at: string;
}

export interface RepositoryAnalysisSummary {
  repo: RepositoryMetadata;
  analyzedAt: string;
  issuesAnalyzedCount: number;
  duplicateGroupsCount: number;
  incompleteIssuesCount: number;
  pullRequestsAnalyzedCount: number;
  reviewDraftsCount: number;
  isDemo?: boolean;
  rateLimitRemaining?: number;
  modelUsed?: string;
}

// 5 Actionable States for Pre-Fix Bug Detective
export type BugDetectiveState =
  | 'existing_fix_found' // State A: Existing report and a potentially relevant fix found
  | 'existing_issue_no_fix' // State B: Existing issue found, but no verified fix
  | 'uncertain_match' // State C: Similar issue found, but the match is uncertain
  | 'no_strong_match' // State D: No strong match found
  | 'insufficient_details' // State E: Insufficient bug details
  | 'existing_fix_available' // Alias for backward compatibility
  | 'possible_duplicate_no_fix' // Alias for backward compatibility
  | 'insufficient_information'; // Alias for backward compatibility

export interface BugDetectiveEvidence {
  issueNumber: number;
  issueTitle: string;
  issueUrl: string;
  issueState: 'open' | 'closed';
  similarityScore: number; // 0 - 100
  overlappingSymptoms: string[];
  differencesAndUncertainties: string[];
  whyRelated: string;
  whatFixChanges?: string;
  linkedPrNumber?: number;
  linkedPrUrl?: string;
  linkedPrMerged?: boolean;
  linkedCommitSha?: string;
  linkedCommitUrl?: string;
  isVerifiedFix?: boolean;
  verificationNotes?: string;
}

export interface BugDetectiveResult {
  state: BugDetectiveState;
  verdictTitle: string;
  recommendation: string;
  reasoning: string;
  confidenceScore: number; // 0 - 100
  matches: BugDetectiveEvidence[];
  missingDetailsSuggested?: string[];
  draftContributionComment?: string;
  analyzedRepository: string;
  timestamp: string;
  searchedCount: number;
  isPartialSearch: boolean;
  searchScopeNotes: string;
  modelUsed: string;
}

export interface DuplicateGroup {
  id: string;
  canonicalIssue: {
    number: number;
    title: string;
    html_url: string;
    state: 'open' | 'closed';
    author: string;
    created_at: string;
    commentsCount: number;
  };
  similarIssues: Array<{
    number: number;
    title: string;
    html_url: string;
    state: 'open' | 'closed';
    similarityScore: number;
    overlappingSymptoms: string;
    confidence: 'high' | 'medium' | 'low';
  }>;
  commonComponent: string;
  recommendedAction: string;
}

export interface CompletenessItem {
  id: string;
  label: string;
  present: boolean;
  explanation: string;
  importance: 'critical' | 'recommended' | 'optional';
}

export interface CompletenessReport {
  issueNumber: number;
  issueTitle: string;
  issueUrl: string;
  issueState: 'open' | 'closed';
  issueAuthor: string;
  score: number; // 0 to 100
  isComplete: boolean;
  checklist: CompletenessItem[];
  missingSummary: string[];
  suggestedMaintainerComment: string;
  modelUsed?: string;
}

export interface PullRequestAnalysis {
  prNumber: number;
  title: string;
  url: string;
  author: string;
  state: 'open' | 'closed';
  isMerged: boolean;
  isDraft: boolean;
  changedFilesCount: number;
  additions: number;
  deletions: number;
  aiSummary: string;
  affectedComponents: string[];
  riskLevel: 'low' | 'medium' | 'high';
  risksAndEdgeCases: string[];
  testSufficiency: {
    status: 'adequate' | 'insufficient' | 'missing' | 'untestable';
    explanation: string;
    suggestedCases: string[];
  };
  diffSnippetSample?: string;
  modelUsed?: string;
}

export interface ReviewCommentDraft {
  id: string;
  filePath?: string;
  lineNumber?: number;
  comment: string;
  severity: 'suggestion' | 'nitpick' | 'important' | 'blocking';
  isVerifiedInDiff: boolean;
}

export interface ReviewDraft {
  id: string;
  prNumber: number;
  prTitle: string;
  prUrl: string;
  repoFullName: string;
  generatedAt: string;
  summary: string;
  correctnessConcerns: string[];
  edgeCasesToInspect: string[];
  testingRecommendations: string[];
  suggestedComments: ReviewCommentDraft[];
  markdownDraft: string;
  status: 'draft' | 'reviewed';
  modelUsed?: string;
}

export interface AnalysisHistoryItem {
  id: string;
  type: 'repo_analysis' | 'bug_detective' | 'duplicate_detection' | 'pr_review';
  repoFullName: string;
  title: string;
  summary: string;
  timestamp: string;
  detailsUrl?: string;
  metadata?: Record<string, unknown>;
  modelUsed?: string;
}

// Model Diagnostic Test Result
export interface ModelTestResult {
  modelId: string;
  success: boolean;
  latencyMs: number;
  sampleResponse?: string;
  errorMessage?: string;
  checkedAt: string;
}

// SSE Real-Time Streaming Types
export type StreamStageId =
  | 'validate'
  | 'issues'
  | 'pulls'
  | 'duplicates'
  | 'completeness'
  | 'finalize';

export interface StreamStage {
  id: StreamStageId;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  detail?: string;
}

export interface StreamLog {
  id: string;
  timestamp: string;
  text: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

export interface StreamProgressUpdate {
  percent: number;
  stageId: StreamStageId;
  status: 'in_progress' | 'completed' | 'failed';
  message: string;
}
