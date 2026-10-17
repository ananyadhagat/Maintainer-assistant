import { Node, Edge, MarkerType } from '@xyflow/react';
import { ArchitectureNodeData } from './types';

export interface ArchitecturePresetData {
  id: string;
  name: string;
  tagline: string;
  description: string;
  nodes: Node<ArchitectureNodeData>[];
  edges: Edge[];
}

export const ARCHITECTURE_PRESETS: ArchitecturePresetData[] = [
  {
    id: 'maintainer-copilot',
    name: 'Maintainer Copilot System Architecture',
    tagline: 'Production Multi-Tier AI Issue Triage & Review Engine',
    description:
      'Complete end-to-end architecture showcasing Web Clients, REST & SSE APIs, Controller orchestrators, Gemini AI workers, Redis queue, and PostgreSQL datastores.',
    nodes: [
      // CLIENTS
      {
        id: 'client-web',
        type: 'architectureNode',
        position: { x: 50, y: 150 },
        data: {
          title: 'Maintainer Web App',
          category: 'client',
          tech: 'React 19 + Vite SPA',
          endpoint: 'PORT :3000',
          description: 'Responsive desktop workspace with live SSE streaming updates and issue inspector',
          status: 'healthy',
          metrics: { latency: '12ms', rps: '45' },
        },
      },
      {
        id: 'client-github',
        type: 'architectureNode',
        position: { x: 50, y: 350 },
        data: {
          title: 'GitHub Webhook Agent',
          category: 'client',
          tech: 'GitHub App / Octokit',
          endpoint: 'api.github.com',
          description: 'Listens for opened issues, bug reports, and pull request review events',
          status: 'healthy',
          metrics: { latency: '85ms', rps: '120' },
        },
      },

      // API GATEWAYS
      {
        id: 'api-gateway',
        type: 'architectureNode',
        position: { x: 380, y: 140 },
        data: {
          title: 'API Gateway & Router',
          category: 'api',
          tech: 'Express.js + TypeScript',
          endpoint: '/api/v1/*',
          description: 'Request authentication, rate limiting, and REST endpoint distribution',
          status: 'healthy',
          metrics: { latency: '4ms', rps: '680' },
        },
      },
      {
        id: 'api-sse',
        type: 'architectureNode',
        position: { x: 380, y: 360 },
        data: {
          title: 'SSE Streaming Endpoint',
          category: 'api',
          tech: 'Server-Sent Events',
          endpoint: '/api/stream/analyze',
          description: 'Real-time multi-stage pipeline telemetry streamed directly to client browsers',
          status: 'healthy',
          metrics: { latency: '2ms', rps: '35' },
        },
      },

      // CONTROLLERS
      {
        id: 'ctrl-triage',
        type: 'architectureNode',
        position: { x: 740, y: 40 },
        data: {
          title: 'Issue Triage Controller',
          category: 'controller',
          tech: 'TypeScript Business Logic',
          endpoint: 'POST /check-completeness',
          description: 'Audits issues against reproduction checklists and scores completeness',
          status: 'healthy',
          metrics: { latency: '18ms', rps: '85' },
        },
      },
      {
        id: 'ctrl-bug',
        type: 'architectureNode',
        position: { x: 740, y: 220 },
        data: {
          title: 'Bug Detective Controller',
          category: 'controller',
          tech: 'Deterministic + AI Triage',
          endpoint: 'POST /check-bug',
          description: 'Matches user bug reports to known issues, verified fixes, and commits',
          status: 'healthy',
          metrics: { latency: '42ms', rps: '110' },
        },
      },
      {
        id: 'ctrl-pr',
        type: 'architectureNode',
        position: { x: 740, y: 400 },
        data: {
          title: 'PR Review Controller',
          category: 'controller',
          tech: 'AST + Diff Orchestrator',
          endpoint: 'POST /summarize-pr',
          description: 'Coordinates diff slicing, test sufficiency analysis, and draft generation',
          status: 'healthy',
          metrics: { latency: '65ms', rps: '40' },
        },
      },

      // SERVICES & WORKERS
      {
        id: 'srv-gemini',
        type: 'architectureNode',
        position: { x: 1100, y: 60 },
        data: {
          title: 'Gemini 2.5 Flash Agent',
          category: 'service',
          tech: '@google/genai SDK',
          endpoint: 'models/gemini-2.5-flash',
          description: 'High-speed semantic duplicate clustering and review draft generation',
          status: 'healthy',
          metrics: { latency: '420ms', rps: '60' },
        },
      },
      {
        id: 'srv-embedder',
        type: 'architectureNode',
        position: { x: 1100, y: 240 },
        data: {
          title: 'Semantic Vector Embedder',
          category: 'service',
          tech: 'Text Embedding 004',
          endpoint: 'models/text-embedding-004',
          description: 'Computes high-dimensional vector embeddings of issue descriptions & stack traces',
          status: 'healthy',
          metrics: { latency: '110ms', rps: '210' },
        },
      },
      {
        id: 'srv-github-sync',
        type: 'architectureNode',
        position: { x: 1100, y: 420 },
        data: {
          title: 'GitHub Octokit Ingestion',
          category: 'service',
          tech: 'Node.js Async Worker',
          endpoint: 'worker:github_sync',
          description: 'Fetches raw issue catalogs, comments, PR diffs, and pagination streams',
          status: 'healthy',
          metrics: { latency: '95ms', rps: '150' },
        },
      },

      // QUEUE & BROKER
      {
        id: 'queue-redis',
        type: 'architectureNode',
        position: { x: 740, y: 580 },
        data: {
          title: 'Redis Message Queue',
          category: 'queue',
          tech: 'BullMQ / Redis PubSub',
          endpoint: 'redis://10.0.1.5:6379',
          description: 'Buffers background LLM tasks, rate limits, and asynchronous diff parsing',
          status: 'healthy',
          metrics: { latency: '1ms', rps: '1.4k' },
        },
      },

      // DATABASES
      {
        id: 'db-postgres',
        type: 'architectureNode',
        position: { x: 1460, y: 100 },
        data: {
          title: 'PostgreSQL Primary Store',
          category: 'database',
          tech: 'PostgreSQL 16 Relational',
          endpoint: 'PORT :5432 (SSL)',
          description: 'Persistent schema for repositories, triage history, review drafts, and audit logs',
          status: 'healthy',
          metrics: { latency: '3ms', rps: '850' },
        },
      },
      {
        id: 'db-vector',
        type: 'architectureNode',
        position: { x: 1460, y: 280 },
        data: {
          title: 'Vector Embeddings Store',
          category: 'database',
          tech: 'pgvector / HNSW Index',
          endpoint: 'vector_dimensions: 768',
          description: 'Stores issue embeddings for sub-millisecond cosine similarity search',
          status: 'healthy',
          metrics: { latency: '6ms', rps: '320' },
        },
      },
      {
        id: 'db-cache',
        type: 'architectureNode',
        position: { x: 1460, y: 460 },
        data: {
          title: 'Redis Cache Cluster',
          category: 'database',
          tech: 'Redis v7.2 In-Memory',
          endpoint: 'PORT :6380',
          description: 'Caches GitHub API rate limits, AST hashes, and token authorization states',
          status: 'healthy',
          metrics: { latency: '0.8ms', rps: '3.1k' },
        },
      },
    ],
    edges: [
      // Client -> API
      {
        id: 'e-web-api',
        source: 'client-web',
        target: 'api-gateway',
        animated: true,
        style: { stroke: '#38bdf8', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#38bdf8' },
        label: 'HTTP REST',
      },
      {
        id: 'e-web-sse',
        source: 'client-web',
        target: 'api-sse',
        animated: true,
        style: { stroke: '#38bdf8', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#38bdf8' },
        label: 'SSE EventSource',
      },
      {
        id: 'e-gh-api',
        source: 'client-github',
        target: 'api-gateway',
        animated: true,
        style: { stroke: '#38bdf8', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#38bdf8' },
        label: 'Webhooks',
      },

      // API -> Controllers
      {
        id: 'e-api-triage',
        source: 'api-gateway',
        target: 'ctrl-triage',
        style: { stroke: '#f59e0b', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' },
      },
      {
        id: 'e-api-bug',
        source: 'api-gateway',
        target: 'ctrl-bug',
        style: { stroke: '#f59e0b', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' },
      },
      {
        id: 'e-api-pr',
        source: 'api-gateway',
        target: 'ctrl-pr',
        style: { stroke: '#f59e0b', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' },
      },
      {
        id: 'e-sse-controllers',
        source: 'api-sse',
        target: 'ctrl-bug',
        style: { stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '5,5' },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' },
      },

      // Controllers -> Queue
      {
        id: 'e-pr-queue',
        source: 'ctrl-pr',
        target: 'queue-redis',
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
        label: 'Enqueue Diff Jobs',
      },
      {
        id: 'e-triage-queue',
        source: 'ctrl-triage',
        target: 'queue-redis',
        style: { stroke: '#6366f1', strokeWidth: 1.5, strokeDasharray: '4,4' },
      },

      // Controllers -> Services
      {
        id: 'e-triage-gemini',
        source: 'ctrl-triage',
        target: 'srv-gemini',
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
      },
      {
        id: 'e-bug-embedder',
        source: 'ctrl-bug',
        target: 'srv-embedder',
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
      },
      {
        id: 'e-bug-gemini',
        source: 'ctrl-bug',
        target: 'srv-gemini',
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
      },
      {
        id: 'e-pr-gemini',
        source: 'ctrl-pr',
        target: 'srv-gemini',
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
      },
      {
        id: 'e-queue-ghsync',
        source: 'queue-redis',
        target: 'srv-github-sync',
        animated: true,
        style: { stroke: '#f43f5e', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#f43f5e' },
      },

      // Services -> Databases
      {
        id: 'e-gemini-postgres',
        source: 'srv-gemini',
        target: 'db-postgres',
        style: { stroke: '#a855f7', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#a855f7' },
        label: 'Save Drafts & Audits',
      },
      {
        id: 'e-embedder-vector',
        source: 'srv-embedder',
        target: 'db-vector',
        style: { stroke: '#a855f7', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#a855f7' },
        label: 'Cosine Index',
      },
      {
        id: 'e-ghsync-cache',
        source: 'srv-github-sync',
        target: 'db-cache',
        style: { stroke: '#a855f7', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#a855f7' },
      },
      {
        id: 'e-ctrl-cache',
        source: 'ctrl-bug',
        target: 'db-cache',
        style: { stroke: '#6366f1', strokeWidth: 1.5, strokeDasharray: '3,3' },
      },
    ],
  },
  {
    id: 'data-pipeline',
    name: 'Real-time Event Stream & Vector Pipeline',
    tagline: 'High-Throughput Analytics & Search Infrastructure',
    description:
      'Distributed event ingestion pipeline routing through Kafka/Redis streams, microservice worker pools, and PostgreSQL storage layers.',
    nodes: [
      {
        id: 'dp-client',
        type: 'architectureNode',
        position: { x: 50, y: 180 },
        data: {
          title: 'Edge Ingestion Clients',
          category: 'client',
          tech: 'SDK & Telemetry Agents',
          endpoint: 'edge.network:443',
          description: 'Worldwide client SDKs emitting telemetry events',
          status: 'healthy',
          metrics: { latency: '5ms', rps: '4.5k' },
        },
      },
      {
        id: 'dp-api-gateway',
        type: 'architectureNode',
        position: { x: 380, y: 180 },
        data: {
          title: 'High-Speed Ingestion API',
          category: 'api',
          tech: 'Golang / HTTP3',
          endpoint: 'POST /v1/events',
          description: 'Zero-copy high-throughput network receiver',
          status: 'healthy',
          metrics: { latency: '1.2ms', rps: '12k' },
        },
      },
      {
        id: 'dp-ctrl-dispatcher',
        type: 'architectureNode',
        position: { x: 740, y: 100 },
        data: {
          title: 'Stream Partition Controller',
          category: 'controller',
          tech: 'Hash Partitioning Engine',
          endpoint: 'partition:by_tenant',
          description: 'Distributes batches by tenant and data affinity',
          status: 'healthy',
          metrics: { latency: '2ms', rps: '12k' },
        },
      },
      {
        id: 'dp-ctrl-sanitizer',
        type: 'architectureNode',
        position: { x: 740, y: 300 },
        data: {
          title: 'Schema Validation Controller',
          category: 'controller',
          tech: 'JSON Schema / Protobuf',
          endpoint: 'validate:strict',
          description: 'Validates structure and drops malformed frames',
          status: 'healthy',
          metrics: { latency: '3ms', rps: '8k' },
        },
      },
      {
        id: 'dp-queue-stream',
        type: 'architectureNode',
        position: { x: 1100, y: 100 },
        data: {
          title: 'Kafka / Redis Stream Bus',
          category: 'queue',
          tech: 'Distributed Append Log',
          endpoint: 'partition_count: 32',
          description: 'Persistent replay log with 7-day retention',
          status: 'healthy',
          metrics: { latency: '1.5ms', rps: '25k' },
        },
      },
      {
        id: 'dp-srv-ai',
        type: 'architectureNode',
        position: { x: 1100, y: 300 },
        data: {
          title: 'Enrichment & Vector Service',
          category: 'service',
          tech: 'PyTorch / ONNX Runtime',
          endpoint: 'batch_size: 64',
          description: 'Enriches raw events with classification embeddings',
          status: 'healthy',
          metrics: { latency: '18ms', rps: '1.8k' },
        },
      },
      {
        id: 'dp-db-lake',
        type: 'architectureNode',
        position: { x: 1460, y: 100 },
        data: {
          title: 'PostgreSQL Cold Storage',
          category: 'database',
          tech: 'Postgres partitioned by month',
          endpoint: 'tablespace: /data/cold',
          description: 'Aggregated analytics datastore for historical queries',
          status: 'healthy',
          metrics: { latency: '15ms', rps: '450' },
        },
      },
      {
        id: 'dp-db-vector',
        type: 'architectureNode',
        position: { x: 1460, y: 300 },
        data: {
          title: 'Vector Similarity Index',
          category: 'database',
          tech: 'HNSW Graph Index',
          endpoint: 'metric: euclidean',
          description: 'Sub-millisecond semantic similarity search',
          status: 'healthy',
          metrics: { latency: '4ms', rps: '2.1k' },
        },
      },
    ],
    edges: [
      {
        id: 'e-dp-1',
        source: 'dp-client',
        target: 'dp-api-gateway',
        animated: true,
        style: { stroke: '#38bdf8', strokeWidth: 2 },
      },
      {
        id: 'e-dp-2',
        source: 'dp-api-gateway',
        target: 'dp-ctrl-dispatcher',
        style: { stroke: '#f59e0b', strokeWidth: 2 },
      },
      {
        id: 'e-dp-3',
        source: 'dp-api-gateway',
        target: 'dp-ctrl-sanitizer',
        style: { stroke: '#f59e0b', strokeWidth: 2 },
      },
      {
        id: 'e-dp-4',
        source: 'dp-ctrl-dispatcher',
        target: 'dp-queue-stream',
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 2 },
      },
      {
        id: 'e-dp-5',
        source: 'dp-ctrl-sanitizer',
        target: 'dp-srv-ai',
        style: { stroke: '#6366f1', strokeWidth: 2 },
      },
      {
        id: 'e-dp-6',
        source: 'dp-queue-stream',
        target: 'dp-db-lake',
        style: { stroke: '#f43f5e', strokeWidth: 2 },
      },
      {
        id: 'e-dp-7',
        source: 'dp-srv-ai',
        target: 'dp-db-vector',
        animated: true,
        style: { stroke: '#a855f7', strokeWidth: 2 },
      },
    ],
  },
];
