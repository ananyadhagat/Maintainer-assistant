import { Router, Request, Response } from 'express';
import { gitHubService, parseRepoUrl } from './github.js';
import {
  runBugDetectiveCheckBeforeFix,
  detectDuplicateGroups,
  evaluateIssueCompleteness,
  summarizePullRequest,
  generateReviewDraft,
  testGemmaModelInference,
  getGemmaModel,
} from './gemini.js';
import { store } from './store.js';
import { RepositoryAnalysisSummary } from '../src/types.js';
import { ollamaRouter } from './ollamaController.js';

export const apiRouter = Router();

// Local Ollama Gemma 4 controller routes
apiRouter.use('/ollama', ollamaRouter);

// Health & Config status
apiRouter.get('/health', async (req: Request, res: Response) => {
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5);
  const hasEnvGitHubToken = Boolean(process.env.GITHUB_TOKEN);
  const hasCustomGitHubToken = Boolean(store.customGitHubToken);
  const configuredModel = getGemmaModel();

  res.json({
    status: 'ok',
    geminiConfigured: hasGeminiKey,
    githubTokenConfigured: hasEnvGitHubToken || hasCustomGitHubToken,
    activeRepo: store.currentRepo?.full_name || null,
    configuredModel,
    isGemma: configuredModel.toLowerCase().includes('gemma'),
  });
});

// Model Diagnostic Endpoints
apiRouter.get('/model/status', (req: Request, res: Response) => {
  res.json({
    configuredModel: getGemmaModel(),
    isGemma: getGemmaModel().toLowerCase().includes('gemma'),
    hasKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

apiRouter.post('/model/test', async (req: Request, res: Response) => {
  try {
    const result = await testGemmaModelInference();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      modelId: getGemmaModel(),
      success: false,
      latencyMs: 0,
      errorMessage: err.message || 'Model test failed',
      checkedAt: new Date().toISOString(),
    });
  }
});

// Update custom GitHub token in session
apiRouter.post('/settings/token', (req: Request, res: Response) => {
  const { token } = req.body;
  store.customGitHubToken = typeof token === 'string' ? token.trim() : '';
  res.json({ success: true, isConfigured: Boolean(store.customGitHubToken) });
});

// SSE Streaming Live Analysis
apiRouter.get('/repository/stream-analyze', async (req: Request, res: Response) => {
  const url = req.query.url as string;
  const forceDemo = req.query.forceDemo === 'true';
  const customToken = (req.query.token as string) || (req.headers['x-github-token'] as string) || store.customGitHubToken;

  if (!url) {
    return res.status(400).json({ error: 'Repository URL is required.' });
  }

  const parsed = parseRepoUrl(url);
  if (!parsed) {
    return res.status(400).json({
      error: 'Invalid GitHub repository URL. Format should be "https://github.com/owner/repo" or "owner/repo".',
    });
  }

  // Set SSE response headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const sendLog = (text: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    sendEvent('log', {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString(),
      text,
      type,
    });
  };

  try {
    const { owner, repo } = parsed;

    // Stage 1: Validation & Metadata
    sendEvent('stage', {
      id: 'validate',
      status: 'in_progress',
      percent: 10,
      message: `Connecting to GitHub API for ${owner}/${repo}...`,
    });
    sendLog(`Validating repository URL: ${owner}/${repo}`);

    const { metadata, isDemo, rateLimitRemaining } = await gitHubService.getRepository(owner, repo, {
      token: customToken,
      forceDemo,
    });
    store.currentRepo = metadata;

    sendLog(
      `Verified repository "${metadata.full_name}" • ${metadata.stargazers_count?.toLocaleString()} stars, ${metadata.open_issues_count} open issues`,
      'success'
    );
    if (rateLimitRemaining !== undefined) {
      sendLog(`GitHub API rate limit remaining: ${rateLimitRemaining} requests`, 'info');
    }
    sendEvent('stage', {
      id: 'validate',
      status: 'completed',
      percent: 20,
      message: `Validated ${metadata.full_name}`,
    });

    // Stage 2: Issue Ingestion & Segregation
    sendEvent('stage', {
      id: 'issues',
      status: 'in_progress',
      percent: 30,
      message: 'Ingesting repository issues and filtering out PRs...',
    });
    sendLog('Fetching active open and closed issues from GitHub REST API...');

    const { issues } = await gitHubService.getIssues(owner, repo, {
      token: customToken,
      forceDemo,
    });
    const repoKey = metadata.full_name.toLowerCase();
    store.cachedIssues[repoKey] = issues;

    sendLog(`Retrieved ${issues.length} distinct issues (pull request objects segregated)`, 'success');
    sendEvent('stage', {
      id: 'issues',
      status: 'completed',
      percent: 45,
      message: `Ingested ${issues.length} issues`,
    });

    // Stage 3: Pull Request Pipeline
    sendEvent('stage', {
      id: 'pulls',
      status: 'in_progress',
      percent: 55,
      message: 'Fetching open pull requests and branches...',
    });
    sendLog('Fetching pull requests and commit diff metadata...');

    const { pulls } = await gitHubService.getPullRequests(owner, repo, {
      token: customToken,
      forceDemo,
    });
    store.cachedPulls[repoKey] = pulls;

    sendLog(`Retrieved ${pulls.length} pull requests available for AI diff review`, 'success');
    sendEvent('stage', {
      id: 'pulls',
      status: 'completed',
      percent: 65,
      message: `Loaded ${pulls.length} pull requests`,
    });

    // Stage 4: Duplicate Detection
    sendEvent('stage', {
      id: 'duplicates',
      status: 'in_progress',
      percent: 75,
      message: 'Clustering issues with Gemini 3.8 Flash semantic reasoning...',
    });
    sendLog('Evaluating issue bodies and error signatures for duplicate clusters...');

    let duplicateGroups = store.duplicateGroups[repoKey];
    if (!duplicateGroups) {
      duplicateGroups = await detectDuplicateGroups(issues, metadata.full_name);
      store.duplicateGroups[repoKey] = duplicateGroups;
    }

    sendLog(
      `Identified ${duplicateGroups.length} duplicate clusters with canonical issue recommendations`,
      'success'
    );
    sendEvent('stage', {
      id: 'duplicates',
      status: 'completed',
      percent: 85,
      message: `Found ${duplicateGroups.length} duplicate clusters`,
    });

    // Stage 5: Completeness Screening
    sendEvent('stage', {
      id: 'completeness',
      status: 'in_progress',
      percent: 90,
      message: 'Auditing issue completeness against diagnostic criteria...',
    });

    const incompleteCount = issues.filter(
      (iss) => (iss.body?.length || 0) < 140 || !iss.body?.toLowerCase().includes('repro')
    ).length;

    sendLog(`Screened ${issues.length} issues: ${incompleteCount} missing reproduction/environment details`, 'info');
    sendEvent('stage', {
      id: 'completeness',
      status: 'completed',
      percent: 95,
      message: `Screened completeness for ${issues.length} issues`,
    });

    // Stage 6: Finalize
    sendEvent('stage', {
      id: 'finalize',
      status: 'in_progress',
      percent: 98,
      message: 'Compiling repository diagnostic report...',
    });

    const reviewDraftsForRepo = Object.values(store.reviewDrafts).filter(
      (d) => d.repoFullName.toLowerCase() === repoKey
    ).length;

    const summary: RepositoryAnalysisSummary = {
      repo: metadata,
      analyzedAt: new Date().toISOString(),
      issuesAnalyzedCount: issues.length,
      duplicateGroupsCount: duplicateGroups.length,
      incompleteIssuesCount: incompleteCount,
      pullRequestsAnalyzedCount: pulls.length,
      reviewDraftsCount: reviewDraftsForRepo,
      isDemo,
      rateLimitRemaining,
    };

    store.addHistory({
      type: 'repo_analysis',
      repoFullName: metadata.full_name,
      title: `Live analysis of ${metadata.full_name}`,
      summary: `Analyzed ${issues.length} live issues, ${duplicateGroups.length} duplicate groups, and ${pulls.length} PRs via SSE.`,
      detailsUrl: metadata.html_url,
    });

    sendEvent('stage', {
      id: 'finalize',
      status: 'completed',
      percent: 100,
      message: 'Repository analysis complete!',
    });

    sendLog('Live analysis complete. Ready for triage and Bug Detective inspection.', 'success');

    // Send complete payload
    sendEvent('complete', {
      summary,
      issues,
      pulls,
      duplicateGroups,
    });

    res.end();
  } catch (err: any) {
    console.error('SSE Stream analysis error:', err);
    sendLog(`Error: ${err.message}`, 'error');
    sendEvent('error', { message: err.message || 'Analysis stream failed' });
    res.end();
  }
});

// Standard synchronous Repository Analysis (kept for fallback)
apiRouter.post('/repository/analyze', async (req: Request, res: Response) => {
  try {
    const { url, forceDemo } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Repository URL is required.' });
    }

    const parsed = parseRepoUrl(url);
    if (!parsed) {
      return res.status(400).json({
        error: 'Invalid GitHub repository URL. Format should be "https://github.com/owner/repo" or "owner/repo".',
      });
    }

    const token = (req.headers['x-github-token'] as string) || store.customGitHubToken;
    const { owner, repo } = parsed;

    // Fetch repository metadata
    const { metadata, isDemo, rateLimitRemaining } = await gitHubService.getRepository(owner, repo, {
      token,
      forceDemo,
    });
    store.currentRepo = metadata;

    // Fetch issues and pull requests
    const [{ issues }, { pulls }] = await Promise.all([
      gitHubService.getIssues(owner, repo, { token, forceDemo }),
      gitHubService.getPullRequests(owner, repo, { token, forceDemo }),
    ]);

    const repoKey = metadata.full_name.toLowerCase();
    store.cachedIssues[repoKey] = issues;
    store.cachedPulls[repoKey] = pulls;

    // Run duplicate groups scan (cached if already present)
    let duplicateGroups = store.duplicateGroups[repoKey];
    if (!duplicateGroups) {
      duplicateGroups = await detectDuplicateGroups(issues, metadata.full_name);
      store.duplicateGroups[repoKey] = duplicateGroups;
    }

    const incompleteCount = issues.filter(
      (iss) => (iss.body?.length || 0) < 140 || !iss.body?.toLowerCase().includes('repro')
    ).length;

    const reviewDraftsForRepo = Object.values(store.reviewDrafts).filter(
      (d) => d.repoFullName.toLowerCase() === repoKey
    ).length;

    const summary: RepositoryAnalysisSummary = {
      repo: metadata,
      analyzedAt: new Date().toISOString(),
      issuesAnalyzedCount: issues.length,
      duplicateGroupsCount: duplicateGroups.length,
      incompleteIssuesCount: incompleteCount,
      pullRequestsAnalyzedCount: pulls.length,
      reviewDraftsCount: reviewDraftsForRepo,
      isDemo,
      rateLimitRemaining,
    };

    store.addHistory({
      type: 'repo_analysis',
      repoFullName: metadata.full_name,
      title: `Analyzed repository ${metadata.full_name}`,
      summary: `Processed ${issues.length} issues, ${duplicateGroups.length} duplicate groups, and ${pulls.length} PRs.`,
      detailsUrl: metadata.html_url,
    });

    res.json(summary);
  } catch (err: any) {
    console.error('Repository analysis failed:', err);
    res.status(500).json({ error: err.message || 'Failed to analyze repository.' });
  }
});

// Issues list
apiRouter.get('/repository/:owner/:repo/issues', async (req: Request, res: Response) => {
  try {
    const { owner, repo } = req.params;
    const token = (req.headers['x-github-token'] as string) || store.customGitHubToken;
    const forceDemo = req.query.demo === 'true';

    const repoKey = `${owner.toLowerCase()}/${repo.toLowerCase()}`;
    const forceRefresh = req.query.refresh === 'true';
    if (store.cachedIssues[repoKey] && !forceDemo && !forceRefresh && store.cachedIssues[repoKey].length > 3) {
      return res.json({ issues: store.cachedIssues[repoKey], totalFetched: store.cachedIssues[repoKey].length, isDemo: false });
    }

    const result = await gitHubService.getIssues(owner, repo, { token, forceDemo });
    store.cachedIssues[repoKey] = result.issues;
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch issues.' });
  }
});

// Duplicate Groups list
apiRouter.get('/repository/:owner/:repo/duplicate-groups', async (req: Request, res: Response) => {
  try {
    const { owner, repo } = req.params;
    const repoKey = `${owner.toLowerCase()}/${repo.toLowerCase()}`;

    if (store.duplicateGroups[repoKey]) {
      return res.json({ duplicateGroups: store.duplicateGroups[repoKey] });
    }

    let issues = store.cachedIssues[repoKey];
    if (!issues) {
      const token = (req.headers['x-github-token'] as string) || store.customGitHubToken;
      const issuesRes = await gitHubService.getIssues(owner, repo, { token });
      issues = issuesRes.issues;
      store.cachedIssues[repoKey] = issues;
    }

    const groups = await detectDuplicateGroups(issues, `${owner}/${repo}`);
    store.duplicateGroups[repoKey] = groups;

    res.json({ duplicateGroups: groups });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to analyze duplicate groups.' });
  }
});

// Incomplete Issue Checker
apiRouter.post('/issues/check-completeness', async (req: Request, res: Response) => {
  try {
    const { issueNumber, owner, repo } = req.body;
    if (!issueNumber || !owner || !repo) {
      return res.status(400).json({ error: 'issueNumber, owner, and repo are required.' });
    }

    const repoKey = `${owner.toLowerCase()}/${repo.toLowerCase()}`;
    const cached = store.completenessReports[repoKey]?.[Number(issueNumber)];
    if (cached) {
      return res.json(cached);
    }

    let issues = store.cachedIssues[repoKey];
    if (!issues) {
      const token = (req.headers['x-github-token'] as string) || store.customGitHubToken;
      const issuesRes = await gitHubService.getIssues(owner, repo, { token });
      issues = issuesRes.issues;
      store.cachedIssues[repoKey] = issues;
    }

    const targetIssue = issues.find((i) => i.number === Number(issueNumber));
    if (!targetIssue) {
      return res.status(404).json({ error: `Issue #${issueNumber} not found in retrieved repository data.` });
    }

    const report = await evaluateIssueCompleteness(targetIssue, `${owner}/${repo}`);
    if (!store.completenessReports[repoKey]) {
      store.completenessReports[repoKey] = {};
    }
    store.completenessReports[repoKey][Number(issueNumber)] = report;

    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to check completeness.' });
  }
});

// Bug Detective — Check Before You Fix
async function handleCheckBeforeFix(req: Request, res: Response) {
  try {
    const {
      bugTitle,
      bugDescription,
      expectedBehavior,
      actualBehavior,
      observedBehavior,
      stepsToReproduce,
      errorMessage,
      relevantFiles,
      repoUrl,
    } = req.body;

    if (!bugTitle) {
      return res.status(400).json({ error: 'Bug title or short description is required.' });
    }

    const parsed = parseRepoUrl(repoUrl || store.currentRepo?.html_url || 'acme/taskflow-core');
    if (!parsed) {
      return res.status(400).json({ error: 'Please provide a valid GitHub repository URL.' });
    }

    const { owner, repo } = parsed;
    const repoFullName = `${owner}/${repo}`;
    const repoKey = repoFullName.toLowerCase();
    const token = (req.headers['x-github-token'] as string) || store.customGitHubToken;

    let candidateIssues = store.cachedIssues[repoKey];
    let candidatePulls = store.cachedPulls[repoKey];

    if (!candidateIssues || candidateIssues.length <= 3 || !candidatePulls) {
      const [issuesRes, pullsRes] = await Promise.all([
        gitHubService.getIssues(owner, repo, { token }),
        gitHubService.getPullRequests(owner, repo, { token }),
      ]);
      candidateIssues = issuesRes.issues;
      candidatePulls = pullsRes.pulls;
      store.cachedIssues[repoKey] = candidateIssues;
      store.cachedPulls[repoKey] = candidatePulls;
    }

    const effectiveActual = observedBehavior || actualBehavior || '';

    const result = await runBugDetectiveCheckBeforeFix({
      bugTitle,
      bugDescription: bugDescription || '',
      expectedBehavior: expectedBehavior || '',
      actualBehavior: effectiveActual,
      stepsToReproduce,
      errorMessage,
      relevantFiles,
      repoFullName,
      candidateIssues,
      candidatePulls,
      isPartialSearch: candidateIssues.length >= 50,
    });

    store.bugChecks.unshift(result);
    store.addHistory({
      type: 'bug_detective',
      repoFullName,
      title: `Pre-Fix Check: "${bugTitle.slice(0, 50)}${bugTitle.length > 50 ? '...' : ''}"`,
      summary: `${result.verdictTitle} (${result.state.replace(/_/g, ' ')}) • Gemma 4`,
      modelUsed: result.modelUsed,
    });

    res.json(result);
  } catch (err: any) {
    console.error('Bug detective error:', err);
    res.status(500).json({ error: err.message || 'Failed to check bug before fixing.' });
  }
}

apiRouter.post('/bugs/check-before-fix', handleCheckBeforeFix);
apiRouter.post('/bugs/check-duplicates', handleCheckBeforeFix);

// Pull Requests list
apiRouter.get('/repository/:owner/:repo/pull-requests', async (req: Request, res: Response) => {
  try {
    const { owner, repo } = req.params;
    const token = (req.headers['x-github-token'] as string) || store.customGitHubToken;
    const forceDemo = req.query.demo === 'true';

    const repoKey = `${owner.toLowerCase()}/${repo.toLowerCase()}`;
    if (store.cachedPulls[repoKey] && !forceDemo) {
      return res.json({ pulls: store.cachedPulls[repoKey], isDemo: false });
    }

    const result = await gitHubService.getPullRequests(owner, repo, { token, forceDemo });
    store.cachedPulls[repoKey] = result.pulls;
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch pull requests.' });
  }
});

// Pull Request Summarize
apiRouter.post('/pull-requests/:number/summarize', async (req: Request, res: Response) => {
  try {
    const prNumber = parseInt(req.params.number, 10);
    const { owner, repo } = req.body;
    if (!owner || !repo) {
      return res.status(400).json({ error: 'owner and repo are required in body.' });
    }

    const repoKey = `${owner.toLowerCase()}/${repo.toLowerCase()}`;
    const token = (req.headers['x-github-token'] as string) || store.customGitHubToken;

    if (store.prAnalyses[repoKey]?.[prNumber]) {
      return res.json(store.prAnalyses[repoKey][prNumber]);
    }

    let pulls = store.cachedPulls[repoKey];
    if (!pulls) {
      const resPulls = await gitHubService.getPullRequests(owner, repo, { token });
      pulls = resPulls.pulls;
      store.cachedPulls[repoKey] = pulls;
    }

    const pr = pulls.find((p) => p.number === prNumber);
    if (!pr) {
      return res.status(404).json({ error: `Pull request #${prNumber} not found.` });
    }

    const { diff } = await gitHubService.getPullRequestDiff(owner, repo, prNumber, { token });
    const analysis = await summarizePullRequest(pr, diff, `${owner}/${repo}`);

    if (!store.prAnalyses[repoKey]) {
      store.prAnalyses[repoKey] = {};
    }
    store.prAnalyses[repoKey][prNumber] = analysis;

    res.json(analysis);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to summarize pull request.' });
  }
});

// Review Draft Generation
apiRouter.post('/pull-requests/:number/review-draft', async (req: Request, res: Response) => {
  try {
    const prNumber = parseInt(req.params.number, 10);
    const { owner, repo, userFeedback } = req.body;
    if (!owner || !repo) {
      return res.status(400).json({ error: 'owner and repo are required.' });
    }

    const repoKey = `${owner.toLowerCase()}/${repo.toLowerCase()}`;
    const token = (req.headers['x-github-token'] as string) || store.customGitHubToken;

    let pulls = store.cachedPulls[repoKey];
    if (!pulls) {
      const resPulls = await gitHubService.getPullRequests(owner, repo, { token });
      pulls = resPulls.pulls;
      store.cachedPulls[repoKey] = pulls;
    }

    const pr = pulls.find((p) => p.number === prNumber);
    if (!pr) {
      return res.status(404).json({ error: `Pull request #${prNumber} not found.` });
    }

    const { diff } = await gitHubService.getPullRequestDiff(owner, repo, prNumber, { token });
    const draft = await generateReviewDraft(pr, diff, `${owner}/${repo}`, userFeedback);

    store.saveReviewDraft(draft);
    store.addHistory({
      type: 'pr_review',
      repoFullName: `${owner}/${repo}`,
      title: `Review draft for PR #${prNumber}`,
      summary: draft.summary,
      detailsUrl: pr.html_url,
    });

    res.json(draft);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate review draft.' });
  }
});

// Get all review drafts
apiRouter.get('/review-drafts', (req: Request, res: Response) => {
  res.json({ drafts: Object.values(store.reviewDrafts) });
});

// Update review draft (edit comments or status)
apiRouter.put('/review-drafts/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = store.updateReviewDraft(id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Review draft not found.' });
  }
  res.json(updated);
});

// Analysis History
apiRouter.get('/analysis/history', (req: Request, res: Response) => {
  res.json({ history: store.history });
});

// ============================================================
// Repository Architecture Visualizer Endpoints
// ============================================================

// Analyze repository architecture
apiRouter.post('/architecture/analyze', async (req: Request, res: Response) => {
  try {
    const { url, branch, forceDemo } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Repository URL is required.' });
    }

    const token = (req.headers['x-github-token'] as string) || store.customGitHubToken;
    const { analyzeRepositoryArchitecture } = await import('./architectureService.js');

    const result = await analyzeRepositoryArchitecture(url, {
      branch,
      token,
      forceDemo: Boolean(forceDemo),
    });

    store.addHistory({
      type: 'repo_analysis',
      repoFullName: result.repo.full_name,
      title: `Architecture Analysis: ${result.repo.full_name}`,
      summary: `Mapped ${result.nodes.length} nodes, ${result.edges.length} connections, and ${result.endpoints.length} API endpoints.`,
      detailsUrl: result.repo.html_url,
    });

    res.json(result);
  } catch (err: any) {
    console.error('Architecture analysis failed:', err);
    res.status(500).json({ error: err.message || 'Failed to analyze repository architecture.' });
  }
});

// Get existing architecture analysis
apiRouter.get('/architecture/:analysisId', async (req: Request, res: Response) => {
  const { analysisId } = req.params;
  const { architectureStore } = await import('./architectureService.js');
  const result = architectureStore[analysisId];

  if (!result) {
    return res.status(404).json({ error: `Architecture analysis "${analysisId}" not found.` });
  }
  res.json(result);
});

// Get endpoints for analysis
apiRouter.get('/architecture/:analysisId/endpoints', async (req: Request, res: Response) => {
  const { analysisId } = req.params;
  const { architectureStore } = await import('./architectureService.js');
  const result = architectureStore[analysisId];

  if (!result) {
    return res.status(404).json({ error: `Architecture analysis "${analysisId}" not found.` });
  }
  res.json({ endpoints: result.endpoints, total: result.endpoints.length });
});

// Get graph for specific view mode
apiRouter.get('/architecture/:analysisId/graph', async (req: Request, res: Response) => {
  const { analysisId } = req.params;
  const viewMode = (req.query.viewMode as 'system' | 'api_flow' | 'feature_dep') || 'system';
  const { architectureStore, filterGraphForView } = await import('./architectureService.js');
  const result = architectureStore[analysisId];

  if (!result) {
    return res.status(404).json({ error: `Architecture analysis "${analysisId}" not found.` });
  }

  const filtered = filterGraphForView(result, viewMode);
  res.json({
    analysisId,
    viewMode,
    nodes: filtered.nodes,
    edges: filtered.edges,
    totalNodes: filtered.nodes.length,
    totalEdges: filtered.edges.length,
  });
});

// Get source snippet for node or endpoint
apiRouter.get('/architecture/:analysisId/source', async (req: Request, res: Response) => {
  const { analysisId } = req.params;
  const filePath = req.query.file as string;
  const startLine = req.query.start ? parseInt(req.query.start as string, 10) : undefined;
  const endLine = req.query.end ? parseInt(req.query.end as string, 10) : undefined;

  if (!filePath) {
    return res.status(400).json({ error: 'file query parameter is required.' });
  }

  const { architectureStore, fileSnippetCache } = await import('./architectureService.js');
  const result = architectureStore[analysisId];

  if (!result) {
    return res.status(404).json({ error: 'Architecture analysis not found.' });
  }

  const repoKey = result.repo.full_name.toLowerCase();
  const repoFiles = fileSnippetCache[repoKey] || {};
  let source = repoFiles[filePath];

  if (!source) {
    // If not in cache, create a synthetic readable stub
    source = `// Source file: ${filePath}\n// Fetched from branch: ${result.branch}\n\n// Architecture Component: ${filePath.split('/').pop()}\nexport default function module() {\n  // Implementation details\n}`;
  }

  const lines = source.split('\n');
  const totalLines = lines.length;
  let excerpt = source;

  if (startLine && endLine) {
    const s = Math.max(1, startLine) - 1;
    const e = Math.min(totalLines, endLine);
    excerpt = lines.slice(s, e).join('\n');
  }

  res.json({
    filePath,
    startLine: startLine || 1,
    endLine: endLine || totalLines,
    totalLines,
    content: excerpt,
  });
});

