import { Request, Response, Router } from 'express';
import {
  GitHubIssue,
  GitHubPullRequest,
  BugDetectiveResult,
  BugDetectiveEvidence,
  DuplicateGroup,
} from '../src/types.js';
import { store } from './store.js';
import { computeFlexibleIssueScore } from './gemini.js';

/**
 * Controller configuration for local Ollama running Gemma 4
 */
export interface OllamaConfig {
  baseUrl: string;
  model: string;
  timeoutMs: number;
}

export function getEffectiveOllamaConfig(): OllamaConfig {
  const baseUrl = store.ollamaBaseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const model = store.customModel || process.env.GEMMA_MODEL || 'gemma4:26b';
  const timeoutMs = parseInt(process.env.OLLAMA_TIMEOUT_MS || '7000', 10);
  return {
    baseUrl: baseUrl.replace(/\/+$/, ''),
    model: model.trim(),
    timeoutMs,
  };
}

// Common stop words to filter out for keyword-based similarity
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'cannot', 'cant', 'could', 'couldn', 'did', 'didn', 'do', 'does', 'doesn', 'doing', 'dont',
  'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn', 'has', 'hasn', 'have',
  'haven', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i',
  'if', 'in', 'into', 'is', 'isn', 'it', 'its', 'itself', 'let', 'me', 'more', 'most', 'mustn',
  'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought',
  'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan', 'she', 'should', 'shouldn',
  'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then',
  'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very',
  'was', 'wasn', 'we', 'were', 'weren', 'what', 'when', 'where', 'which', 'while', 'who', 'whom',
  'why', 'with', 'won', 'would', 'wouldn', 'you', 'your', 'yours', 'yourself', 'yourselves',
  // Common generic issue words
  'bug', 'issue', 'error', 'fails', 'failed', 'failing', 'failure', 'fix', 'problem', 'please',
  'help', 'exception', 'warn', 'warning', 'crash', 'crashing', 'repro', 'reproduce',
]);

/**
 * Tokenize and extract significant terms from untrusted text
 */
export function extractSignificantTokens(text: string | null | undefined): Set<string> {
  if (!text) return new Set();
  const normalized = text
    .toLowerCase()
    .replace(/[`"'’“”]/g, '')
    .replace(/[^a-z0-9_.-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  return new Set(normalized);
}

/**
 * Calculate Jaccard similarity and shared technical tokens
 */
export function calculateJaccardSimilarity(
  tokensA: Set<string>,
  tokensB: Set<string>
): { score: number; sharedTokens: string[] } {
  if (tokensA.size === 0 || tokensB.size === 0) {
    return { score: 0, sharedTokens: [] };
  }
  const sharedTokens = [...tokensA].filter((token) => tokensB.has(token));
  const unionSize = new Set([...tokensA, ...tokensB]).size;
  const score = unionSize > 0 ? Math.round((sharedTokens.length / unionSize) * 100) : 0;
  return { score, sharedTokens };
}

/**
 * Perform a fetch to local Ollama with timeout protection
 */
export async function fetchFromOllama(
  endpointPath: string,
  options: {
    method?: string;
    body?: any;
    baseUrl?: string;
    timeoutMs?: number;
  } = {}
): Promise<{ ok: boolean; status: number; data?: any; error?: string }> {
  const config = getEffectiveOllamaConfig();
  const baseUrl = (options.baseUrl || config.baseUrl).replace(/\/+$/, '');
  const url = `${baseUrl}${endpointPath.startsWith('/') ? '' : '/'}${endpointPath}`;
  const timeoutMs = options.timeoutMs || config.timeoutMs;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const fetchOptions: RequestInit = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    };

    if (options.body) {
      fetchOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }

    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      return {
        ok: false,
        status: response.status,
        error: `Ollama returned HTTP ${response.status}: ${errorText || response.statusText}`,
      };
    }

    const data = await response.json();
    return { ok: true, status: response.status, data };
  } catch (err: any) {
    clearTimeout(timeoutId);
    let message = err.message || 'Unknown network error';
    if (err.name === 'AbortError') {
      message = `Connection to Ollama timed out after ${timeoutMs}ms. Is Ollama running on ${baseUrl}?`;
    } else if (message.includes('ECONNREFUSED') || message.includes('Failed to fetch')) {
      message = `Ollama service unreachable at ${baseUrl} (ECONNREFUSED). Please verify that "ollama serve" is running locally.`;
    }
    return { ok: false, status: 0, error: message };
  }
}

/**
 * Keyword-based Duplicate Issue Clustering Fallback
 */
export function detectDuplicateGroupsKeywordFallback(
  issues: GitHubIssue[],
  repoFullName: string,
  fallbackReason?: string
): DuplicateGroup[] {
  if (issues.length < 2) return [];

  const groups: DuplicateGroup[] = [];
  const visited = new Set<number>();

  for (let i = 0; i < issues.length; i++) {
    const canonical = issues[i];
    if (visited.has(canonical.number)) continue;

    const canonicalTokens = extractSignificantTokens(`${canonical.title} ${canonical.body || ''}`);
    const similarMatches: Array<{
      number: number;
      title: string;
      html_url: string;
      state: 'open' | 'closed';
      similarityScore: number;
      overlappingSymptoms: string;
      confidence: 'high' | 'medium' | 'low';
    }> = [];

    for (let j = i + 1; j < issues.length; j++) {
      const candidate = issues[j];
      if (visited.has(candidate.number)) continue;

      const candidateTokens = extractSignificantTokens(`${candidate.title} ${candidate.body || ''}`);
      const { score, sharedTokens } = calculateJaccardSimilarity(canonicalTokens, candidateTokens);

      // Match condition: high Jaccard score or at least 2 key terms shared
      if (score >= 25 || sharedTokens.length >= 3) {
        visited.add(candidate.number);
        similarMatches.push({
          number: candidate.number,
          title: candidate.title,
          html_url: candidate.html_url,
          state: candidate.state,
          similarityScore: Math.min(score + 25, 95),
          overlappingSymptoms: `Shared symptoms & keywords: ${sharedTokens.slice(0, 4).join(', ')}`,
          confidence: score > 45 ? 'high' : 'medium',
        });
      }
    }

    if (similarMatches.length > 0) {
      visited.add(canonical.number);
      const topShared = extractSignificantTokens(canonical.title);
      const componentName = topShared.size > 0 ? [...topShared].slice(0, 2).join(' / ') : 'Core Module';

      groups.push({
        id: `ollama-group-${canonical.number}`,
        canonicalIssue: {
          number: canonical.number,
          title: canonical.title,
          html_url: canonical.html_url,
          state: canonical.state,
          author: canonical.user.login,
          created_at: canonical.created_at,
          commentsCount: canonical.comments,
        },
        similarIssues: similarMatches,
        commonComponent: componentName,
        recommendedAction: `Consolidate discussion on canonical #${canonical.number} and reference candidates.${
          fallbackReason ? ` (Keyword Fallback: ${fallbackReason})` : ''
        }`,
      });
    }
  }

  return groups;
}

/**
 * Keyword-based Pre-Fix Bug Detective Fallback
 */
export function checkBeforeFixKeywordFallback(params: {
  bugTitle: string;
  bugDescription?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  stepsToReproduce?: string;
  errorMessage?: string;
  relevantFiles?: string;
  repoFullName: string;
  candidateIssues: GitHubIssue[];
  candidatePulls: GitHubPullRequest[];
  isPartialSearch: boolean;
  fallbackReason?: string;
}): BugDetectiveResult {
  const {
    bugTitle,
    bugDescription,
    expectedBehavior,
    actualBehavior,
    stepsToReproduce,
    errorMessage,
    relevantFiles,
    candidateIssues,
    candidatePulls,
    repoFullName,
    isPartialSearch,
    fallbackReason,
  } = params;

  const totalLength =
    (bugTitle?.length || 0) +
    (bugDescription?.length || 0) +
    (actualBehavior?.length || 0) +
    (stepsToReproduce?.length || 0);

  // State E: Insufficient bug details
  if (totalLength < 30 && !errorMessage && !relevantFiles) {
    return {
      state: 'insufficient_details',
      verdictTitle: 'Insufficient Bug Details Provided',
      recommendation: 'Provide steps to reproduce, actual vs expected behavior, error logs, or affected file paths to search effectively before fixing.',
      reasoning: 'The submitted bug description lacks sufficient diagnostic details to reliably match against repository issues or pull requests.',
      confidenceScore: 10,
      matches: [],
      missingDetailsSuggested: [
        'Precise steps to reproduce the issue',
        'Exact error message or stack trace',
        'Expected behavior vs observed behavior',
        'Affected file path or component name',
      ],
      analyzedRepository: repoFullName,
      timestamp: new Date().toISOString(),
      searchedCount: candidateIssues.length,
      isPartialSearch,
      searchScopeNotes: `Examined ${candidateIssues.length} issues in ${repoFullName}. (Keyword fallback: ${fallbackReason || 'Ollama offline'})`,
      modelUsed: 'Gemma 4 (Keyword Similarity Fallback)',
    };
  }

  const queryText = `${bugTitle} ${bugDescription || ''} ${actualBehavior || ''} ${errorMessage || ''} ${relevantFiles || ''}`;

  const candidateMatches: BugDetectiveEvidence[] = [];

  for (const iss of candidateIssues) {
    const { score, shared } = computeFlexibleIssueScore(queryText, iss.title, iss.body || '');

    if (score >= 18 || shared.length >= 1) {
      // Check if any PR links or references this issue
      const linkedPr = candidatePulls.find(
        (p) =>
          (p.body || '').includes(`#${iss.number}`) ||
          (p.title || '').includes(`#${iss.number}`) ||
          (iss.pull_request && p.html_url === iss.pull_request.html_url)
      );

      const isPrMerged = Boolean(linkedPr?.merged_at);
      const isIssueClosed = iss.state === 'closed';

      candidateMatches.push({
        issueNumber: iss.number,
        issueTitle: iss.title,
        issueUrl: iss.html_url,
        issueState: iss.state,
        similarityScore: Math.min(score, 98),
        overlappingSymptoms: shared.length > 0 ? shared.map((s) => `Related term / symptom: "${s}"`) : ['Matching keywords in title/body'],
        differencesAndUncertainties: [
          'Match determined via flexible keyword and stem analysis while local Ollama is offline.',
          'Verify your environment matches the reporter runtime.',
        ],
        whyRelated: `Shares critical keywords (${shared.slice(0, 4).join(', ')}) with issue #${iss.number} (${iss.state}).`,
        whatFixChanges: linkedPr ? `PR #${linkedPr.number} (${linkedPr.title}) addresses this issue.` : undefined,
        linkedPrNumber: linkedPr?.number,
        linkedPrUrl: linkedPr?.html_url,
        linkedPrMerged: isPrMerged,
        linkedCommitSha: linkedPr?.head?.sha,
        isVerifiedFix: isIssueClosed && isPrMerged,
        verificationNotes:
          isIssueClosed && isPrMerged
            ? `Issue #${iss.number} is closed and PR #${linkedPr?.number} was merged into default branch.`
            : iss.state === 'closed'
            ? `Issue #${iss.number} is closed, but automated commit linkage is unverified.`
            : `Issue #${iss.number} is open; no verified merged fix is linked.`,
      });
    }
  }

  // Sort candidate matches by similarity score descending
  candidateMatches.sort((a, b) => b.similarityScore - a.similarityScore);

  // State determination
  const topMatch = candidateMatches[0];

  if (topMatch && topMatch.isVerifiedFix) {
    return {
      state: 'existing_fix_found',
      verdictTitle: `Existing Report and Potential Fix Found (#${topMatch.issueNumber})`,
      recommendation: `Inspect the existing fix in PR #${topMatch.linkedPrNumber} and verify whether it addresses your bug before implementing a new solution.`,
      reasoning: `Found an existing closed issue #${topMatch.issueNumber} with a merged pull request addressing similar symptoms.`,
      confidenceScore: topMatch.similarityScore,
      matches: candidateMatches.slice(0, 5),
      analyzedRepository: repoFullName,
      timestamp: new Date().toISOString(),
      searchedCount: candidateIssues.length,
      isPartialSearch,
      searchScopeNotes: `Examined ${candidateIssues.length} issues and ${candidatePulls.length} PRs in ${repoFullName}. (Keyword fallback: ${fallbackReason || 'Ollama offline'})`,
      modelUsed: 'Gemma 4 (Keyword Similarity Fallback)',
    };
  }

  if (topMatch && topMatch.similarityScore >= 50) {
    return {
      state: 'existing_issue_no_fix',
      verdictTitle: `Existing Issue Found (#${topMatch.issueNumber}), No Verified Fix`,
      recommendation: `Consider contributing diagnostic evidence or reproduction steps to issue #${topMatch.issueNumber} instead of opening a duplicate issue.`,
      reasoning: `Issue #${topMatch.issueNumber} (${topMatch.issueTitle}) reports matching symptoms but has no verified merged pull request.`,
      confidenceScore: topMatch.similarityScore,
      matches: candidateMatches.slice(0, 5),
      draftContributionComment: `Hi! I encountered the same behavior: "${bugTitle}". In my setup, the observed failure is: ${actualBehavior || 'identical to the report'}. Here are additional details that may help resolve this: ${errorMessage ? `\n\nError log:\n\`\`\`\n${errorMessage}\n\`\`\`` : ''}`,
      analyzedRepository: repoFullName,
      timestamp: new Date().toISOString(),
      searchedCount: candidateIssues.length,
      isPartialSearch,
      searchScopeNotes: `Examined ${candidateIssues.length} issues in ${repoFullName}. (Keyword fallback: ${fallbackReason || 'Ollama offline'})`,
      modelUsed: 'Gemma 4 (Keyword Similarity Fallback)',
    };
  }

  if (candidateMatches.length > 0) {
    return {
      state: 'uncertain_match',
      verdictTitle: 'Similar Issue Found, Match Uncertain',
      recommendation: 'Inspect candidate issues to confirm whether your bug is a variant or an independent problem.',
      reasoning: `Found ${candidateMatches.length} candidate issues with overlapping keywords, but symptoms or root cause may differ.`,
      confidenceScore: candidateMatches[0].similarityScore,
      matches: candidateMatches.slice(0, 5),
      analyzedRepository: repoFullName,
      timestamp: new Date().toISOString(),
      searchedCount: candidateIssues.length,
      isPartialSearch,
      searchScopeNotes: `Examined ${candidateIssues.length} issues in ${repoFullName}. (Keyword fallback: ${fallbackReason || 'Ollama offline'})`,
      modelUsed: 'Gemma 4 (Keyword Similarity Fallback)',
    };
  }

  return {
    state: 'no_strong_match',
    verdictTitle: 'No Strong Match Found in Repository',
    recommendation: 'Continue investigating and proceed with your fix or consider creating a new issue.',
    reasoning: `No existing issues or pull requests in ${repoFullName} matched the keywords in this bug description.`,
    confidenceScore: 80,
    matches: [],
    analyzedRepository: repoFullName,
    timestamp: new Date().toISOString(),
    searchedCount: candidateIssues.length,
    isPartialSearch,
    searchScopeNotes: `Examined ${candidateIssues.length} issues and ${candidatePulls.length} pull requests in ${repoFullName}. No duplicate signatures found.`,
    modelUsed: 'Gemma 4 (Keyword Similarity Fallback)',
  };
}

/**
 * Perform inference on local Ollama running Gemma 4, with automatic fallback
 */
export async function queryOllamaGemma(
  prompt: string,
  systemInstruction?: string,
  options: { baseUrl?: string; model?: string; timeoutMs?: number } = {}
): Promise<{ text: string; usedFallback: boolean; fallbackReason?: string }> {
  const config = getEffectiveOllamaConfig();
  const model = options.model || config.model;

  const requestBody = {
    model,
    prompt: systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt,
    stream: false,
    format: 'json',
    options: {
      temperature: 0.1,
    },
  };

  const response = await fetchFromOllama('/api/generate', {
    method: 'POST',
    body: requestBody,
    baseUrl: options.baseUrl,
    timeoutMs: options.timeoutMs,
  });

  if (!response.ok || !response.data?.response) {
    const reason = response.error || 'Empty or invalid response from local Ollama instance';
    console.warn(`[Ollama Controller] Local Ollama call failed (${reason}). Triggering fallback.`);
    return {
      text: '',
      usedFallback: true,
      fallbackReason: reason,
    };
  }

  return {
    text: response.data.response.trim(),
    usedFallback: false,
  };
}

// ==========================================
// Express Route Handlers
// ==========================================

export const ollamaRouter = Router();

/**
 * GET /api/ollama/status
 * Check local Ollama health and verify whether Gemma 4 is installed
 */
ollamaRouter.get('/status', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const config = getEffectiveOllamaConfig();
  const customBaseUrl = req.query.baseUrl as string | undefined;
  const targetBaseUrl = (customBaseUrl || config.baseUrl).replace(/\/+$/, '');

  const tagsRes = await fetchFromOllama('/api/tags', { baseUrl: targetBaseUrl, timeoutMs: 3000 });
  const latencyMs = Date.now() - startTime;

  if (!tagsRes.ok) {
    return res.json({
      isOnline: false,
      baseUrl: targetBaseUrl,
      configuredModel: config.model,
      isModelAvailable: false,
      availableModels: [],
      latencyMs,
      error: tagsRes.error,
      instruction: `Make sure Ollama is installed and running locally with "ollama serve". Then pull the Gemma 4 model with "ollama pull ${config.model}".`,
      activeProvider: store.aiProvider,
    });
  }

  const models: Array<{ name: string; size?: number; modified_at?: string }> = tagsRes.data?.models || [];
  const modelNames = models.map((m) => m.name);
  const isModelAvailable = modelNames.some(
    (name) => name.toLowerCase() === config.model.toLowerCase() || name.toLowerCase().includes('gemma')
  );

  return res.json({
    isOnline: true,
    baseUrl: targetBaseUrl,
    configuredModel: config.model,
    isModelAvailable,
    availableModels: modelNames,
    latencyMs,
    instruction: isModelAvailable
      ? `Local Ollama is online with ${config.model} ready for inference.`
      : `Model "${config.model}" not found in local Ollama. Run: "ollama pull ${config.model}".`,
    activeProvider: store.aiProvider,
  });
});

/**
 * GET /api/ollama/models
 * List models installed in the local Ollama instance
 */
ollamaRouter.get('/models', async (req: Request, res: Response) => {
  const config = getEffectiveOllamaConfig();
  const tagsRes = await fetchFromOllama('/api/tags', { timeoutMs: 3000 });
  if (!tagsRes.ok) {
    return res.status(503).json({
      error: tagsRes.error || 'Failed to connect to local Ollama instance.',
      models: [],
      isOnline: false,
    });
  }
  return res.json({
    models: tagsRes.data?.models || [],
    configuredModel: config.model,
    isOnline: true,
  });
});

/**
 * POST /api/ollama/configure
 * Update local Ollama URL, model, and switch active provider
 */
ollamaRouter.post('/configure', (req: Request, res: Response) => {
  const { baseUrl, model, setActive } = req.body;

  if (baseUrl) {
    store.ollamaBaseUrl = baseUrl.trim().replace(/\/+$/, '');
  }
  if (model) {
    store.customModel = model.trim();
  }
  if (setActive === true) {
    store.aiProvider = 'ollama';
  } else if (setActive === false) {
    store.aiProvider = 'google';
  }

  return res.json({
    success: true,
    baseUrl: store.ollamaBaseUrl,
    model: store.customModel || process.env.GEMMA_MODEL || 'gemma4:26b',
    activeProvider: store.aiProvider,
    message: `Configured local Ollama (${store.ollamaBaseUrl}, model: ${store.customModel || 'gemma4:26b'}). Provider: ${store.aiProvider}.`,
  });
});

/**
 * POST /api/ollama/test
 * Test inference with Gemma 4 on local Ollama, reporting fallback if unreachable
 */
ollamaRouter.post('/test', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const config = getEffectiveOllamaConfig();

  const result = await queryOllamaGemma(
    'Output {"status":"ok","model":"' + config.model + '","message":"Local Gemma 4 connection verified"}',
    'You are a testing agent. Respond strictly with JSON.'
  );

  const latencyMs = Date.now() - startTime;

  if (result.usedFallback) {
    return res.json({
      success: false,
      modelId: config.model,
      baseUrl: config.baseUrl,
      latencyMs,
      usedFallback: true,
      fallbackReason: result.fallbackReason,
      message: `Local Ollama endpoint unreachable (${result.fallbackReason}). Keyword similarity fallback is active.`,
    });
  }

  return res.json({
    success: true,
    modelId: config.model,
    baseUrl: config.baseUrl,
    latencyMs,
    usedFallback: false,
    sampleResponse: result.text.slice(0, 300),
    checkedAt: new Date().toISOString(),
  });
});

/**
 * POST /api/ollama/duplicates
 * Duplicate issues clustering via local Ollama Gemma 4 with keyword fallback
 */
ollamaRouter.post('/duplicates', async (req: Request, res: Response) => {
  const { issues, repoFullName } = req.body;
  if (!Array.isArray(issues) || issues.length === 0) {
    return res.status(400).json({ error: 'issues array is required.' });
  }

  const config = getEffectiveOllamaConfig();
  const repoName = repoFullName || 'repository';

  const issueList = issues.slice(0, 25).map((iss) => ({
    number: iss.number,
    title: iss.title,
    state: iss.state,
    bodyExcerpt: iss.body ? iss.body.slice(0, 250) : '',
    author: iss.user?.login || 'unknown',
    url: iss.html_url,
    comments: iss.comments || 0,
  }));

  const prompt = `Identify duplicate or closely related bug reports from this list of issues for repository ${repoName}.
Group issues that report the same bug, root cause, or failure mode under one canonical issue.
Do NOT group unrelated issues.

ISSUES TO EVALUATE:
${JSON.stringify(issueList, null, 2)}

Return a JSON array of duplicate groups:
[
  {
    "id": "group-1",
    "canonicalIssue": {
      "number": 142,
      "title": "string",
      "html_url": "string",
      "state": "open" | "closed",
      "author": "string",
      "created_at": "string",
      "commentsCount": number
    },
    "similarIssues": [
      {
        "number": 149,
        "title": "string",
        "html_url": "string",
        "state": "open" | "closed",
        "similarityScore": 88,
        "overlappingSymptoms": "string",
        "confidence": "high" | "medium" | "low"
      }
    ],
    "commonComponent": "string",
    "recommendedAction": "string"
  }
]`;

  const ollamaResult = await queryOllamaGemma(
    prompt,
    'You are Gemma 4 analyzing GitHub issues. Output valid JSON only.'
  );

  if (ollamaResult.usedFallback || !ollamaResult.text) {
    const fallbackGroups = detectDuplicateGroupsKeywordFallback(
      issues,
      repoName,
      ollamaResult.fallbackReason || 'Local Ollama endpoint offline'
    );
    return res.json({
      duplicateGroups: fallbackGroups,
      modelUsed: `Gemma 4 (Keyword Fallback - ${ollamaResult.fallbackReason || 'Ollama offline'})`,
      usedFallback: true,
      fallbackReason: ollamaResult.fallbackReason,
    });
  }

  try {
    const parsed = JSON.parse(ollamaResult.text);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return res.json({
        duplicateGroups: parsed,
        modelUsed: `${config.model} (Local Ollama)`,
        usedFallback: false,
      });
    }
    // If AI found no groups, fall back to keyword check
    const fallbackGroups = detectDuplicateGroupsKeywordFallback(issues, repoName);
    return res.json({
      duplicateGroups: fallbackGroups,
      modelUsed: `${config.model} (Local Ollama / Heuristic)`,
      usedFallback: false,
    });
  } catch (parseErr: any) {
    console.warn('[Ollama Controller] Failed to parse Ollama JSON response, using keyword fallback:', parseErr.message);
    const fallbackGroups = detectDuplicateGroupsKeywordFallback(issues, repoName, 'Invalid JSON from local model');
    return res.json({
      duplicateGroups: fallbackGroups,
      modelUsed: `Gemma 4 (Keyword Fallback - Parse Error)`,
      usedFallback: true,
    });
  }
});

/**
 * POST /api/ollama/check-before-fix
 * Pre-Fix Bug Detective workflow using local Ollama Gemma 4 with keyword fallback
 */
ollamaRouter.post('/check-before-fix', async (req: Request, res: Response) => {
  const {
    bugTitle,
    bugDescription,
    expectedBehavior,
    actualBehavior,
    stepsToReproduce,
    errorMessage,
    relevantFiles,
    repoFullName,
    candidateIssues,
    candidatePulls,
    isPartialSearch,
  } = req.body;

  if (!bugTitle) {
    return res.status(400).json({ error: 'bugTitle is required.' });
  }

  const effectiveRepo = repoFullName || 'repository';
  const issues: GitHubIssue[] = Array.isArray(candidateIssues) ? candidateIssues : [];
  const pulls: GitHubPullRequest[] = Array.isArray(candidatePulls) ? candidatePulls : [];

  const config = getEffectiveOllamaConfig();

  // Quick check for insufficient details
  const totalLength =
    (bugTitle?.length || 0) +
    (bugDescription?.length || 0) +
    (actualBehavior?.length || 0) +
    (stepsToReproduce?.length || 0);

  if (totalLength < 30 && !errorMessage && !relevantFiles) {
    return res.json(
      checkBeforeFixKeywordFallback({
        bugTitle,
        bugDescription,
        expectedBehavior,
        actualBehavior,
        stepsToReproduce,
        errorMessage,
        relevantFiles,
        repoFullName: effectiveRepo,
        candidateIssues: issues,
        candidatePulls: pulls,
        isPartialSearch: Boolean(isPartialSearch),
      })
    );
  }

  const prompt = `Analyze this newly discovered bug in repository "${effectiveRepo}" BEFORE the developer starts fixing it.
Determine if the same or similar bug has already been reported, investigated, or fixed.

SUBMITTED NEW BUG:
Title: ${bugTitle}
Observed: ${actualBehavior || 'Not specified'}
Expected: ${expectedBehavior || 'Not specified'}
Description: ${bugDescription || ''}
Steps: ${stepsToReproduce || 'None'}
Logs: ${errorMessage || 'None'}
Files: ${relevantFiles || 'None'}

CANDIDATE ISSUES (${issues.length}):
${JSON.stringify(
  issues.slice(0, 25).map((i) => ({
    number: i.number,
    title: i.title,
    state: i.state,
    body: (i.body || '').slice(0, 250),
    url: i.html_url,
  })),
  null,
  2
)}

CANDIDATE PULL REQUESTS (${pulls.length}):
${JSON.stringify(
  pulls.slice(0, 15).map((p) => ({
    number: p.number,
    title: p.title,
    state: p.state,
    merged_at: p.merged_at,
    url: p.html_url,
  })),
  null,
  2
)}

Return JSON with state ("existing_fix_found" | "existing_issue_no_fix" | "uncertain_match" | "no_strong_match" | "insufficient_details"), verdictTitle, recommendation, reasoning, confidenceScore, matches array, draftContributionComment.`;

  const ollamaResult = await queryOllamaGemma(
    prompt,
    'You are Gemma 4 software engineer analyzing bugs against repository data. Respond strictly with JSON.'
  );

  if (ollamaResult.usedFallback || !ollamaResult.text) {
    const fallbackResult = checkBeforeFixKeywordFallback({
      bugTitle,
      bugDescription,
      expectedBehavior,
      actualBehavior,
      stepsToReproduce,
      errorMessage,
      relevantFiles,
      repoFullName: effectiveRepo,
      candidateIssues: issues,
      candidatePulls: pulls,
      isPartialSearch: Boolean(isPartialSearch),
      fallbackReason: ollamaResult.fallbackReason,
    });
    return res.json(fallbackResult);
  }

  try {
    const parsed = JSON.parse(ollamaResult.text);
    let state = parsed.state || 'no_strong_match';
    if (state === 'existing_fix_available') state = 'existing_fix_found';
    if (state === 'possible_duplicate_no_fix') state = 'existing_issue_no_fix';

    const result: BugDetectiveResult = {
      state,
      verdictTitle: parsed.verdictTitle || 'Pre-Fix Analysis Complete',
      recommendation: parsed.recommendation || 'Inspect findings before writing new code.',
      reasoning: parsed.reasoning || `Evaluated using local Ollama (${config.model}).`,
      confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 75,
      matches: Array.isArray(parsed.matches) ? parsed.matches : [],
      missingDetailsSuggested: parsed.missingDetailsSuggested || [],
      draftContributionComment: parsed.draftContributionComment || undefined,
      analyzedRepository: effectiveRepo,
      timestamp: new Date().toISOString(),
      searchedCount: issues.length,
      isPartialSearch: Boolean(isPartialSearch),
      searchScopeNotes: `Examined ${issues.length} issues via local Ollama (${config.model}).`,
      modelUsed: `${config.model} (Local Ollama)`,
    };
    return res.json(result);
  } catch (parseErr: any) {
    console.warn('[Ollama Controller] JSON parse failed, returning keyword fallback:', parseErr.message);
    const fallbackResult = checkBeforeFixKeywordFallback({
      bugTitle,
      bugDescription,
      expectedBehavior,
      actualBehavior,
      stepsToReproduce,
      errorMessage,
      relevantFiles,
      repoFullName: effectiveRepo,
      candidateIssues: issues,
      candidatePulls: pulls,
      isPartialSearch: Boolean(isPartialSearch),
      fallbackReason: 'Local Ollama output parsing failed',
    });
    return res.json(fallbackResult);
  }
});
