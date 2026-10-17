/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { api } from './api';
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
  StreamStage,
  StreamStageId,
  StreamLog,
} from './types';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewView } from './components/views/OverviewView';
import { RepositoryAnalysisView } from './components/views/RepositoryAnalysisView';
import { DuplicateDetectorView } from './components/views/DuplicateDetectorView';
import { BugDetectiveView } from './components/views/BugDetectiveView';
import { IncompleteIssuesView } from './components/views/IncompleteIssuesView';
import { PullRequestAnalyzerView } from './components/views/PullRequestAnalyzerView';
import { ReviewDraftsView } from './components/views/ReviewDraftsView';
import { AnalysisHistoryView } from './components/views/AnalysisHistoryView';
import { SettingsView } from './components/views/SettingsView';
import { StreamProgressModal } from './components/common/StreamProgressModal';

const INITIAL_STAGES: StreamStage[] = [
  { id: 'validate', label: '1. Resolve & Validate Repo', status: 'pending' },
  { id: 'issues', label: '2. Ingest Issues (Filter PRs)', status: 'pending' },
  { id: 'pulls', label: '3. Pull Requests & Diff Refs', status: 'pending' },
  { id: 'duplicates', label: '4. Gemini Semantic Clustering', status: 'pending' },
  { id: 'completeness', label: '5. Audit Completeness Checklist', status: 'pending' },
  { id: 'finalize', label: '6. Finalize Diagnostic Report', status: 'pending' },
];

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [summary, setSummary] = useState<RepositoryAnalysisSummary | null>(null);
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [pulls, setPulls] = useState<GitHubPullRequest[]>([]);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [completenessReports, setCompletenessReports] = useState<Record<number, CompletenessReport>>({});
  const [cachedAnalyses, setCachedAnalyses] = useState<Record<number, PullRequestAnalysis>>({});
  const [reviewDrafts, setReviewDrafts] = useState<ReviewDraft[]>([]);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [lastBugResult, setLastBugResult] = useState<BugDetectiveResult | null>(null);
  const [activeReviewPrNumber, setActiveReviewPrNumber] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [healthStatus, setHealthStatus] = useState({
    geminiConfigured: true,
    githubTokenConfigured: false,
  });

  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamRepoSlug, setStreamRepoSlug] = useState('');
  const [streamPercent, setStreamPercent] = useState(0);
  const [streamStages, setStreamStages] = useState<StreamStage[]>(INITIAL_STAGES);
  const [streamLogs, setStreamLogs] = useState<StreamLog[]>([]);
  const [streamElapsed, setStreamElapsed] = useState(0);
  const [streamError, setStreamError] = useState<string | null>(null);
  const abortStreamRef = useRef<(() => void) | null>(null);

  // Timer for elapsed seconds during streaming
  useEffect(() => {
    let interval: any = null;
    if (isStreaming) {
      setStreamElapsed(0);
      interval = setInterval(() => {
        setStreamElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming]);

  // Initial load
  useEffect(() => {
    async function init() {
      try {
        const health = await api.getHealth();
        setHealthStatus(health);

        const histRes = await api.getHistory().catch(() => ({ history: [] }));
        setHistory(histRes.history || []);

        const draftsRes = await api.getReviewDrafts().catch(() => ({ drafts: [] }));
        setReviewDrafts(draftsRes.drafts || []);

        // Start initial analysis with SSE stream
        handleStreamAnalyze('https://github.com/acme/taskflow-core', true);
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }
    init();
  }, []);

  const handleStreamAnalyze = (url: string, forceDemo = false) => {
    if (abortStreamRef.current) {
      abortStreamRef.current();
    }

    setIsLoading(true);
    setError(null);
    setStreamError(null);
    setStreamRepoSlug(url.replace(/^(https?:\/\/)?(www\.)?github\.com\//i, ''));
    setStreamPercent(5);
    setStreamStages(INITIAL_STAGES.map((s) => ({ ...s, status: 'pending', detail: undefined })));
    setStreamLogs([]);
    setIsStreaming(true);

    const abortFn = api.streamAnalyzeRepository(
      url,
      {
        onStage: (stageEvent) => {
          setStreamPercent(stageEvent.percent);
          setStreamStages((prev) =>
            prev.map((s) => {
              if (s.id === stageEvent.id) {
                return {
                  ...s,
                  status: stageEvent.status,
                  detail: stageEvent.message,
                };
              }
              return s;
            })
          );
        },
        onLog: (log) => {
          setStreamLogs((prev) => [...prev, log]);
        },
        onComplete: (data) => {
          setSummary(data.summary);
          setIssues(data.issues);
          setPulls(data.pulls);
          setDuplicateGroups(data.duplicateGroups);
          setIsDemoMode(Boolean(data.summary.isDemo));
          setIsLoading(false);

          // Refresh history & drafts
          api.getHistory().then((h) => setHistory(h.history || []));
          api.getReviewDrafts().then((d) => setReviewDrafts(d.drafts || []));

          // Brief delay before closing modal so user sees completion
          setTimeout(() => {
            setIsStreaming(false);
          }, 800);
        },
        onError: (errMsg) => {
          setStreamError(errMsg);
          setError(errMsg);
          setIsLoading(false);
          setStreamStages((prev) =>
            prev.map((s) => (s.status === 'in_progress' ? { ...s, status: 'failed' } : s))
          );
        },
      },
      forceDemo
    );

    abortStreamRef.current = abortFn;
  };

  const handleCancelStream = () => {
    if (abortStreamRef.current) {
      abortStreamRef.current();
      abortStreamRef.current = null;
    }
    setIsStreaming(false);
    setIsLoading(false);
  };

  const handleEvaluateCompleteness = async (issueNumber: number): Promise<CompletenessReport> => {
    if (!summary) throw new Error('No repository selected');
    const owner = summary.repo.owner.login;
    const repo = summary.repo.name;
    const report = await api.checkIssueCompleteness(owner, repo, issueNumber);
    setCompletenessReports((prev) => ({ ...prev, [issueNumber]: report }));
    return report;
  };

  const handleCheckBug = async (payload: {
    bugTitle: string;
    bugDescription?: string;
    expectedBehavior?: string;
    actualBehavior?: string;
    stepsToReproduce?: string;
    errorMessage?: string;
    relevantFiles?: string;
    repoUrl?: string;
  }): Promise<BugDetectiveResult> => {
    setIsLoading(true);
    try {
      const res = await api.checkBugDuplicates({
        ...payload,
        repoUrl: payload.repoUrl || summary?.repo.html_url || 'acme/taskflow-core',
      });
      setLastBugResult(res);

      const histRes = await api.getHistory().catch(() => ({ history: [] }));
      setHistory(histRes.history || []);
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummarizePr = async (prNumber: number): Promise<PullRequestAnalysis> => {
    if (!summary) throw new Error('No repository selected');
    const owner = summary.repo.owner.login;
    const repo = summary.repo.name;
    const analysis = await api.summarizePullRequest(owner, repo, prNumber);
    setCachedAnalyses((prev) => ({ ...prev, [prNumber]: analysis }));
    return analysis;
  };

  const handleGenerateDraft = async (prNumber: number, feedback?: string): Promise<ReviewDraft> => {
    if (!summary) throw new Error('No repository selected');
    const owner = summary.repo.owner.login;
    const repo = summary.repo.name;
    const draft = await api.generateReviewDraft(owner, repo, prNumber, feedback);
    setReviewDrafts((prev) => [draft, ...prev.filter((d) => d.id !== draft.id)]);
    setActiveReviewPrNumber(prNumber);
    setCurrentTab('review_drafts');

    const histRes = await api.getHistory().catch(() => ({ history: [] }));
    setHistory(histRes.history || []);
    return draft;
  };

  const handleUpdateDraft = async (id: string, updates: Partial<ReviewDraft>): Promise<ReviewDraft> => {
    const updated = await api.updateReviewDraft(id, updates);
    setReviewDrafts((prev) => prev.map((d) => (d.id === id ? updated : d)));
    return updated;
  };

  const handleSaveToken = async (token: string) => {
    const res = await api.setGithubToken(token);
    setHealthStatus((prev) => ({ ...prev, githubTokenConfigured: res.isConfigured }));
  };

  return (
    <div className="flex h-screen w-full bg-[#0e1014] text-zinc-100 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activeRepo={summary?.repo || null}
        counts={{
          duplicates: duplicateGroups.length,
          incomplete: summary?.incompleteIssuesCount,
          pulls: pulls.length,
          drafts: reviewDrafts.length,
        }}
        isDemo={isDemoMode}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Global Repository Bar */}
        <Header
          activeRepo={summary?.repo || null}
          onAnalyze={(url, demo) => handleStreamAnalyze(url, demo)}
          isLoading={isLoading}
          isDemo={isDemoMode}
          rateLimitRemaining={summary?.rateLimitRemaining}
        />

        {/* Scrollable Workspace */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#0e1014]">
          {currentTab === 'overview' && (
            <OverviewView
              summary={summary}
              history={history}
              onNavigate={setCurrentTab}
              onQuickBugCheck={() => setCurrentTab('bug_detective')}
            />
          )}

          {currentTab === 'repository_analysis' && (
            <RepositoryAnalysisView
              summary={summary}
              issues={issues}
              pulls={pulls}
              onAnalyze={(url) => handleStreamAnalyze(url)}
              isLoading={isLoading}
              error={error}
            />
          )}

          {currentTab === 'duplicate_detector' && (
            <DuplicateDetectorView
              groups={duplicateGroups}
              repoFullName={summary?.repo.full_name || 'acme/taskflow-core'}
              isLoading={isLoading}
              onRefresh={() => {
                if (summary) handleStreamAnalyze(summary.repo.html_url);
              }}
            />
          )}

          {currentTab === 'bug_detective' && (
            <BugDetectiveView
              repoUrl={summary?.repo.html_url || 'https://github.com/acme/taskflow-core'}
              onCheckBug={handleCheckBug}
              lastResult={lastBugResult}
              isLoading={isLoading}
            />
          )}

          {currentTab === 'incomplete_issues' && (
            <IncompleteIssuesView
              issues={issues}
              repoFullName={summary?.repo.full_name || 'acme/taskflow-core'}
              onEvaluateIssue={handleEvaluateCompleteness}
              completenessReports={completenessReports}
            />
          )}

          {currentTab === 'pr_analyzer' && (
            <PullRequestAnalyzerView
              pulls={pulls}
              repoFullName={summary?.repo.full_name || 'acme/taskflow-core'}
              onSummarizePr={handleSummarizePr}
              onGenerateDraft={(prNumber) => handleGenerateDraft(prNumber)}
              cachedAnalyses={cachedAnalyses}
            />
          )}

          {currentTab === 'review_drafts' && (
            <ReviewDraftsView
              drafts={reviewDrafts}
              onUpdateDraft={handleUpdateDraft}
              onRegenerateDraft={(prNumber, feedback) => handleGenerateDraft(prNumber, feedback)}
              activePrNumber={activeReviewPrNumber}
            />
          )}

          {currentTab === 'history' && (
            <AnalysisHistoryView history={history} />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              geminiConfigured={healthStatus.geminiConfigured}
              githubTokenConfigured={healthStatus.githubTokenConfigured}
              onSaveToken={handleSaveToken}
              isDemoMode={isDemoMode}
              onToggleDemoMode={(val) => setIsDemoMode(val)}
            />
          )}
        </main>
      </div>

      {/* SSE Live Streaming Progress Modal */}
      <StreamProgressModal
        isOpen={isStreaming}
        repoSlug={streamRepoSlug}
        percent={streamPercent}
        stages={streamStages}
        logs={streamLogs}
        elapsedSeconds={streamElapsed}
        onCancel={handleCancelStream}
        error={streamError}
      />
    </div>
  );
}
