import {
  RepositoryMetadata,
  GitHubIssue,
  GitHubPullRequest,
  DuplicateGroup,
  CompletenessReport,
  BugDetectiveResult,
  PullRequestAnalysis,
  ReviewDraft,
} from '../src/types.js';

export const DEMO_REPOSITORIES: Record<
  string,
  {
    metadata: RepositoryMetadata;
    issues: GitHubIssue[];
    pulls: GitHubPullRequest[];
    sampleDiffs: Record<number, string>;
  }
> = {
  'acme/taskflow-core': {
    metadata: {
      id: 9812401,
      name: 'taskflow-core',
      full_name: 'acme/taskflow-core',
      owner: {
        login: 'acme',
        avatar_url: 'https://avatars.githubusercontent.com/u/14985020?v=4',
        html_url: 'https://github.com/acme',
      },
      description: 'High-throughput async job execution engine with Redis queue and WebSocket telemetry',
      html_url: 'https://github.com/acme/taskflow-core',
      stargazers_count: 4820,
      forks_count: 612,
      open_issues_count: 24,
      language: 'TypeScript',
      default_branch: 'main',
      license: { name: 'MIT License', spdx_id: 'MIT' },
      updated_at: new Date().toISOString(),
    },
    issues: [
      {
        id: 101,
        number: 142,
        title: 'Memory leak in WorkerPool when processing large batches of stream jobs',
        body: `### Problem Description
Workers do not release memory after streaming large data payloads (>100MB). Over several hours, RSS memory climbs from 150MB to 1.8GB until the container crashes with OOMKilled.

### Steps to Reproduce
1. Start worker pool with default concurrency of 8.
2. Dispatch 500 stream tasks with 100MB chunk payloads.
3. Observe \`process.memoryUsage().rss\` increasing without garbage collection release.

### Expected Behavior
Worker memory should return to baseline (<200MB) once task streams are closed and flushed.

### Actual Behavior
Node.js heap dump shows unclosed EventEmitter listeners and retained buffer segments in \`streamHandler.ts:84\`.

### Environment
- Node: v20.11.0
- taskflow-core: v3.4.1
- OS: Alpine Linux 3.19`,
        state: 'open',
        html_url: 'https://github.com/acme/taskflow-core/issues/142',
        user: { login: 'dev_alexander', avatar_url: 'https://avatars.githubusercontent.com/u/101?v=4' },
        labels: [{ name: 'bug', color: 'd73a4a' }, { name: 'memory-leak', color: 'b60205' }],
        comments: 6,
        created_at: '2026-09-12T10:00:00Z',
        updated_at: '2026-10-02T15:30:00Z',
        closed_at: null,
      },
      {
        id: 102,
        number: 149,
        title: 'Worker OOM crash after heavy streaming load',
        body: `Our production pods keep getting OOM killed after high volume streaming. Node garbage collector doesn't reclaim memory in stream pipelines. Memory profile points to buffer retains in stream handler. Duplicate of 142?`,
        state: 'open',
        html_url: 'https://github.com/acme/taskflow-core/issues/149',
        user: { login: 'karen_ops', avatar_url: 'https://avatars.githubusercontent.com/u/102?v=4' },
        labels: [{ name: 'bug', color: 'd73a4a' }, { name: 'duplicate-candidate', color: 'cfd3d7' }],
        comments: 2,
        created_at: '2026-09-18T14:20:00Z',
        updated_at: '2026-09-20T08:10:00Z',
        closed_at: null,
      },
      {
        id: 103,
        number: 118,
        title: 'Redis reconnect backoff fails with UnhandledPromiseRejection on socket timeout',
        body: `### Issue
When Redis primary undergoes failover, the connection drops and throws an unhandled error during exponential backoff calculation.

\`\`\`
UnhandledPromiseRejection: Error: Socket closed unexpectedly during reconnect retry 3
    at RedisTransport.retry (/src/transport/redis.ts:114:15)
\`\`\`

Fixed in PR #122 by adding try-catch and proper error boundary.`,
        state: 'closed',
        html_url: 'https://github.com/acme/taskflow-core/issues/118',
        user: { login: 'marcus_c', avatar_url: 'https://avatars.githubusercontent.com/u/103?v=4' },
        labels: [{ name: 'bug', color: 'd73a4a' }, { name: 'redis', color: '006b75' }],
        comments: 5,
        created_at: '2026-08-01T09:12:00Z',
        updated_at: '2026-08-15T11:45:00Z',
        closed_at: '2026-08-15T11:45:00Z',
      },
      {
        id: 104,
        number: 160,
        title: 'WebSocket telemetry disconnects silently without firing onDisconnect hook',
        body: `Clients lose connection after 60s idle timeout without \`onDisconnect\` hook firing. Can reproduce on Safari and Chrome. Need ping-pong keepalive.`,
        state: 'open',
        html_url: 'https://github.com/acme/taskflow-core/issues/160',
        user: { login: 'frontend_sara', avatar_url: 'https://avatars.githubusercontent.com/u/104?v=4' },
        labels: [{ name: 'telemetry', color: '5319e7' }],
        comments: 3,
        created_at: '2026-10-01T12:00:00Z',
        updated_at: '2026-10-05T09:20:00Z',
        closed_at: null,
      },
      {
        id: 105,
        number: 165,
        title: 'Jobs fail sometimes',
        body: `It does not work. Please fix it. Yesterday everything failed with an error.`,
        state: 'open',
        html_url: 'https://github.com/acme/taskflow-core/issues/165',
        user: { login: 'anonymous_user', avatar_url: 'https://avatars.githubusercontent.com/u/105?v=4' },
        labels: [{ name: 'needs-info', color: 'e4e669' }],
        comments: 0,
        created_at: '2026-10-10T16:00:00Z',
        updated_at: '2026-10-10T16:00:00Z',
        closed_at: null,
      },
      {
        id: 106,
        number: 171,
        title: 'Cannot parse ISO8601 timestamps with microsecond precision in scheduler',
        body: `### Problem
When scheduling tasks with sub-millisecond precision like \`2026-10-15T14:30:00.123456Z\`, the scheduler parses it as NaN and defaults to immediate execution.

### Expected Behavior
Scheduler should truncate or parse microseconds gracefully without throwing NaN.

### Actual Behavior
Scheduled job runs immediately instead of designated time.`,
        state: 'open',
        html_url: 'https://github.com/acme/taskflow-core/issues/171',
        user: { login: 'time_traveler', avatar_url: 'https://avatars.githubusercontent.com/u/106?v=4' },
        labels: [{ name: 'scheduler', color: '1d76db' }, { name: 'bug', color: 'd73a4a' }],
        comments: 1,
        created_at: '2026-10-14T08:30:00Z',
        updated_at: '2026-10-15T18:00:00Z',
        closed_at: null,
      },
    ],
    pulls: [
      {
        id: 201,
        number: 122,
        title: 'fix(redis): handle socket timeouts gracefully during exponential backoff',
        body: `Closes #118. Catches socket disconnect errors during retry intervals and dispatches connection status events instead of throwing unhandled rejections. Includes integration test with mock Redis disconnects.`,
        state: 'closed',
        html_url: 'https://github.com/acme/taskflow-core/pull/122',
        user: { login: 'marcus_c', avatar_url: 'https://avatars.githubusercontent.com/u/103?v=4' },
        created_at: '2026-08-05T14:00:00Z',
        updated_at: '2026-08-15T11:45:00Z',
        merged_at: '2026-08-15T11:45:00Z',
        draft: false,
        additions: 42,
        deletions: 11,
        changed_files: 3,
        base: { ref: 'main' },
        head: { ref: 'fix/redis-backoff', sha: 'c4e912a' },
      },
      {
        id: 202,
        number: 173,
        title: 'feat(stream): release buffer references immediately upon chunk consumption',
        body: `Addresses #142 and #149.
This PR modifies the internal stream consumer pipeline:
1. Replaces unbounded accumulator buffer with a bounded 16MB ring buffer.
2. Removes lingering listener references on pipeline end.
3. Adds automated stress test verifying heap stabilizes under 200MB.`,
        state: 'open',
        html_url: 'https://github.com/acme/taskflow-core/pull/173',
        user: { login: 'dev_alexander', avatar_url: 'https://avatars.githubusercontent.com/u/101?v=4' },
        created_at: '2026-10-15T19:00:00Z',
        updated_at: '2026-10-16T10:15:00Z',
        merged_at: null,
        draft: false,
        additions: 154,
        deletions: 48,
        changed_files: 5,
        base: { ref: 'main' },
        head: { ref: 'perf/stream-buffers', sha: '9fa3b1e' },
      },
      {
        id: 203,
        number: 178,
        title: 'refactor(auth): support granular API key scopes for worker endpoints',
        body: `Adds scope verification middleware for \`tasks:write\`, \`tasks:read\`, and \`admin:drain\`.
Note: Missing unit tests for the token revocation edge case when an API key is deleted mid-flight.`,
        state: 'open',
        html_url: 'https://github.com/acme/taskflow-core/pull/178',
        user: { login: 'security_guru', avatar_url: 'https://avatars.githubusercontent.com/u/107?v=4' },
        created_at: '2026-10-16T08:00:00Z',
        updated_at: '2026-10-16T12:00:00Z',
        merged_at: null,
        draft: true,
        additions: 210,
        deletions: 34,
        changed_files: 7,
        base: { ref: 'main' },
        head: { ref: 'feat/auth-scopes', sha: 'e2810ab' },
      },
    ],
    sampleDiffs: {
      173: `diff --git a/src/workers/streamHandler.ts b/src/workers/streamHandler.ts
index b7a3921..8a19bc3 100644
--- a/src/workers/streamHandler.ts
+++ b/src/workers/streamHandler.ts
@@ -81,14 +81,22 @@ export class StreamHandler extends EventEmitter {
   private chunks: Buffer[] = [];
+  private totalBufferedBytes = 0;
+  private readonly maxBufferSize = 16 * 1024 * 1024; // 16MB limit
 
   public pushChunk(chunk: Buffer): boolean {
-    this.chunks.push(chunk);
-    this.emit('data', chunk);
+    if (this.totalBufferedBytes + chunk.byteLength > this.maxBufferSize) {
+      this.emit('drain-wait');
+      return false;
+    }
+    this.chunks.push(chunk);
+    this.totalBufferedBytes += chunk.byteLength;
+    this.emit('data', chunk);
     return true;
   }
 
   public cleanup(): void {
-    this.chunks = [];
+    this.chunks.length = 0;
+    this.totalBufferedBytes = 0;
+    this.removeAllListeners();
   }
 }`,
      178: `diff --git a/src/middleware/auth.ts b/src/middleware/auth.ts
index d3f21a0..5b821ac 100644
--- a/src/middleware/auth.ts
+++ b/src/middleware/auth.ts
@@ -18,6 +18,18 @@ export function requireScope(requiredScope: string) {
     const token = req.headers['x-api-key'] as string;
     if (!token) return res.status(401).json({ error: 'Missing API key' });
+    
+    // TODO: Verify if cache needs eviction when key is revoked in redis
+    const cachedScopes = tokenCache.get(token);
+    if (cachedScopes && !cachedScopes.includes(requiredScope)) {
+      return res.status(403).json({ error: 'Insufficient permission scope' });
+    }
     next();
   };
 }`,
    },
  },
};
