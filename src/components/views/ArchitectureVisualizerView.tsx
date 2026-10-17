import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Node,
  Edge,
  ConnectionLineType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng, toSvg } from 'html-to-image';
import {
  Network,
  Search,
  Filter,
  ArrowRight,
  Download,
  Share2,
  RefreshCw,
  GitBranch,
  Terminal,
  ShieldAlert,
  Info,
  CheckCircle2,
  Sliders,
  ExternalLink,
  Code2,
  Layers,
  Sparkles,
  Maximize2,
  RotateCcw,
  BookOpen,
  ChevronRight,
  ChevronDown,
  Lock,
} from 'lucide-react';
import {
  ArchitectureAnalysisResult,
  ArchitectureNode,
  ArchitectureEdge,
  DiscoveredEndpoint,
  ArchitectureViewMode,
  ArchitectureNodeType,
  ArchitectureLayer,
} from '../../types';
import { api } from '../../api';
import { ArchitectureCustomNode } from './architecture/ArchitectureCustomNode';
import { EndpointExplorerPanel } from './architecture/EndpointExplorerPanel';
import { ComponentDetailsDrawer } from './architecture/ComponentDetailsDrawer';

const nodeTypes = {
  custom: ArchitectureCustomNode,
};

interface ArchitectureVisualizerViewProps {
  initialRepoUrl?: string;
  onNavigateToSettings?: () => void;
}

export function ArchitectureVisualizerView({
  initialRepoUrl = 'https://github.com/acme/taskflow-core',
  onNavigateToSettings,
}: ArchitectureVisualizerViewProps) {
  // Input states
  const [repoUrl, setRepoUrl] = useState(initialRepoUrl);
  const [branch, setBranch] = useState('main');
  const [forceDemo, setForceDemo] = useState(false);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [progressStage, setProgressStage] = useState('');
  const [analysisResult, setAnalysisResult] = useState<ArchitectureAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // View Mode: system | api_flow | feature_dep
  const [viewMode, setViewMode] = useState<ArchitectureViewMode>('system');

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const flowContainerRef = useRef<HTMLDivElement>(null);

  // Interactions state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [tracedEndpointNodeId, setTracedEndpointNodeId] = useState<string | null>(null);

  // Panels visibility
  const [showExplorer, setShowExplorer] = useState(true);
  const [showEndpoints, setShowEndpoints] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Initial load: run demo repository analysis automatically
  useEffect(() => {
    handleRunAnalysis(initialRepoUrl, true);
  }, []);

  // Handler for running analysis
  const handleRunAnalysis = async (urlToAnalyze = repoUrl, isDemoRequest = forceDemo) => {
    if (!urlToAnalyze.trim()) {
      setError('Please enter a GitHub repository URL.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setTracedEndpointNodeId(null);

    // Simulated progress steps for user feedback
    setAnalysisProgress(15);
    setProgressStage('Resolving repository metadata & Git tree...');

    const timer1 = setTimeout(() => {
      setAnalysisProgress(40);
      setProgressStage('Parsing source files, routes, and imports...');
    }, 400);

    const timer2 = setTimeout(() => {
      setAnalysisProgress(70);
      setProgressStage('Discovering API endpoints and component dependencies...');
    }, 800);

    const timer3 = setTimeout(() => {
      setAnalysisProgress(90);
      setProgressStage('Arranging multi-tier architecture graph...');
    }, 1200);

    try {
      const res = await api.analyzeArchitecture(urlToAnalyze, branch, isDemoRequest);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setAnalysisProgress(100);
      setProgressStage('Analysis complete!');
      setAnalysisResult(res);
      setForceDemo(res.isDemo);
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setError(err.message || 'Failed to analyze repository architecture.');
    } finally {
      setTimeout(() => {
        setIsAnalyzing(false);
      }, 300);
    }
  };

  // Synchronize React Flow nodes & edges whenever analysisResult, viewMode, filters, or trace changes
  useEffect(() => {
    if (!analysisResult) return;

    // Filter nodes by viewMode
    let activeNodes = [...analysisResult.nodes];
    if (viewMode === 'api_flow') {
      const allowed = new Set<ArchitectureNodeType>([
        'client',
        'frontend_page',
        'frontend_component',
        'api_endpoint',
        'auth_middleware',
        'controller',
        'service',
        'database',
        'external_api',
      ]);
      activeNodes = activeNodes.filter((n) => allowed.has(n.data.nodeType));
    } else if (viewMode === 'feature_dep') {
      const allowed = new Set<ArchitectureNodeType>([
        'frontend_page',
        'frontend_component',
        'service',
        'database',
        'config',
        'utility',
        'controller',
      ]);
      activeNodes = activeNodes.filter((n) => allowed.has(n.data.nodeType));
    }

    // Category filter
    if (categoryFilter !== 'ALL') {
      activeNodes = activeNodes.filter((n) => {
        if (categoryFilter === 'FRONTEND') {
          return n.data.nodeType === 'client' || n.data.nodeType === 'frontend_page' || n.data.nodeType === 'frontend_component';
        }
        if (categoryFilter === 'API') {
          return n.data.nodeType === 'api_endpoint' || n.data.nodeType === 'auth_middleware';
        }
        if (categoryFilter === 'CONTROLLER') {
          return n.data.nodeType === 'controller';
        }
        if (categoryFilter === 'SERVICE') {
          return n.data.nodeType === 'service' || n.data.nodeType === 'utility';
        }
        if (categoryFilter === 'DATABASE') {
          return n.data.nodeType === 'database';
        }
        if (categoryFilter === 'EXTERNAL') {
          return n.data.nodeType === 'external_api';
        }
        return true;
      });
    }

    const activeNodeIds = new Set(activeNodes.map((n) => n.id));
    let activeEdges = analysisResult.edges.filter(
      (e) => activeNodeIds.has(e.source) && activeNodeIds.has(e.target)
    );

    // Calculate Traced Path if tracedEndpointNodeId is active
    let tracedNodeSet = new Set<string>();
    let tracedEdgeSet = new Set<string>();

    if (tracedEndpointNodeId) {
      tracedNodeSet.add(tracedEndpointNodeId);

      // Trace Upstream: Find who calls this endpoint
      activeEdges.forEach((e) => {
        if (e.target === tracedEndpointNodeId) {
          tracedNodeSet.add(e.source);
          tracedEdgeSet.add(e.id);
        }
      });

      // Trace Downstream: BFS from endpoint through controllers -> services -> database
      const queue = [tracedEndpointNodeId];
      const visited = new Set<string>([tracedEndpointNodeId]);

      while (queue.length > 0) {
        const curr = queue.shift()!;
        activeEdges.forEach((e) => {
          if (e.source === curr && !visited.has(e.target)) {
            visited.add(e.target);
            tracedNodeSet.add(e.target);
            tracedEdgeSet.add(e.id);
            queue.push(e.target);
          }
        });
      }
    }

    // Format React Flow Nodes
    const flowNodes: Node[] = activeNodes.map((node) => {
      const isSelected = node.id === selectedNodeId;
      const isTraced = tracedNodeSet.has(node.id);
      const isDimmed = Boolean(
        (tracedEndpointNodeId && !isTraced) ||
          (searchTerm &&
            !node.data.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !node.data.filePath?.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      return {
        id: node.id,
        type: 'custom',
        position: node.position,
        data: {
          ...node.data,
          isHighlighted: isSelected,
          isTraced,
          isDimmed,
        },
      };
    });

    // Format React Flow Edges
    const flowEdges: Edge[] = activeEdges.map((edge) => {
      const isSelected = edge.id === selectedEdgeId;
      const isTraced = tracedEdgeSet.has(edge.id);
      const isDimmed = Boolean(tracedEndpointNodeId && !isTraced);
      const isVerified = edge.data?.confidence === 'verified';

      // Edge styling
      let strokeColor = isVerified ? '#6366f1' : '#94a3b8'; // Indigo for verified, Slate for inferred
      if (isTraced) strokeColor = '#10b981'; // Emerald for traced
      if (isSelected) strokeColor = '#38bdf8'; // Sky for selected

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        animated: isTraced || edge.data?.relationshipType === 'calls',
        type: ConnectionLineType.SmoothStep,
        style: {
          stroke: strokeColor,
          strokeWidth: isTraced || isSelected ? 2.5 : 1.5,
          strokeDasharray: isVerified ? undefined : '5, 5',
          opacity: isDimmed ? 0.2 : 1,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: strokeColor,
          width: 18,
          height: 18,
        },
        label: edge.label || (edge.data?.httpMethod ? `${edge.data.httpMethod}` : undefined),
        labelStyle: {
          fill: '#cbd5e1',
          fontSize: 10,
          fontFamily: 'monospace',
          fontWeight: 500,
        },
        labelBgStyle: {
          fill: '#181b26',
          fillOpacity: 0.9,
          rx: 4,
          ry: 4,
          stroke: strokeColor,
          strokeWidth: 1,
        },
        data: edge.data,
      };
    });

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [analysisResult, viewMode, categoryFilter, searchTerm, selectedNodeId, selectedEdgeId, tracedEndpointNodeId]);

  // Click Node in React Flow
  const handleNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNodeId(node.id);
    setSelectedEdgeId(null);
  }, []);

  // Click Edge in React Flow
  const handleEdgeClick = useCallback((_: any, edge: Edge) => {
    setSelectedEdgeId(edge.id);
    setSelectedNodeId(null);
  }, []);

  // Trace Endpoint action
  const handleTraceEndpoint = useCallback((nodeId: string) => {
    setTracedEndpointNodeId((prev) => (prev === nodeId ? null : nodeId));
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
  }, []);

  // Reset layout / clear filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('ALL');
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setTracedEndpointNodeId(null);
  };

  // Export handlers
  const handleExportPng = async () => {
    if (!flowContainerRef.current) return;
    try {
      const dataUrl = await toPng(flowContainerRef.current, {
        backgroundColor: '#0c0e14',
        quality: 0.95,
      });
      const link = document.createElement('a');
      link.download = `${analysisResult?.repo.name || 'architecture'}-${viewMode}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('PNG export error:', err);
    }
  };

  const handleExportSvg = async () => {
    if (!flowContainerRef.current) return;
    try {
      const dataUrl = await toSvg(flowContainerRef.current, {
        backgroundColor: '#0c0e14',
      });
      const link = document.createElement('a');
      link.download = `${analysisResult?.repo.name || 'architecture'}-${viewMode}.svg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('SVG export error:', err);
    }
  };

  const handleExportJson = () => {
    if (!analysisResult) return;
    const blob = new Blob([JSON.stringify(analysisResult, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${analysisResult.repo.name}-architecture.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyMarkdownSummary = () => {
    if (!analysisResult) return;
    const md = `## Repository Architecture Report: ${analysisResult.repo.full_name}

**Analyzed at:** ${analysisResult.analyzedAt}  
**Primary Pattern:** ${analysisResult.systemOverview.primaryArchitecturePattern}  
**Detected Languages:** ${analysisResult.detectedLanguages.join(', ')}  
**Frameworks:** ${analysisResult.frameworks.join(', ')}  

### Architecture Summary
${analysisResult.systemOverview.summary}

### Key Strengths
${analysisResult.systemOverview.keyStrengths.map((s) => `- ${s}`).join('\n')}

### Potential Architectural Risks
${analysisResult.systemOverview.potentialRisks.map((r) => `- ${r}`).join('\n')}

### Discovered API Endpoints (${analysisResult.endpoints.length})
| Method | Path | Controller | Auth |
|---|---|---|---|
${analysisResult.endpoints
  .map((e) => `| ${e.method} | \`${e.path}\` | ${e.controllerName || '-'} | ${e.authRequired ? 'Yes' : 'No'} |`)
  .join('\n')}
`;
    navigator.clipboard.writeText(md);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  // Selected Node Data & connections for Details Drawer
  const selectedNodeData = useMemo(() => {
    if (!selectedNodeId || !analysisResult) return null;
    return analysisResult.nodes.find((n) => n.id === selectedNodeId)?.data || null;
  }, [selectedNodeId, analysisResult]);

  const selectedEdgeData = useMemo(() => {
    if (!selectedEdgeId || !analysisResult) return null;
    return analysisResult.edges.find((e) => e.id === selectedEdgeId)?.data || null;
  }, [selectedEdgeId, analysisResult]);

  const upstreamNodes = useMemo(() => {
    if (!selectedNodeId || !analysisResult) return [];
    const sourceIds = analysisResult.edges
      .filter((e) => e.target === selectedNodeId)
      .map((e) => e.source);
    return analysisResult.nodes.filter((n) => sourceIds.includes(n.id)).map((n) => n.data);
  }, [selectedNodeId, analysisResult]);

  const downstreamNodes = useMemo(() => {
    if (!selectedNodeId || !analysisResult) return [];
    const targetIds = analysisResult.edges
      .filter((e) => e.source === selectedNodeId)
      .map((e) => e.target);
    return analysisResult.nodes.filter((n) => targetIds.includes(n.id)).map((n) => n.data);
  }, [selectedNodeId, analysisResult]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full bg-[#0a0c12] text-zinc-100 overflow-hidden select-none -m-6 md:-m-8">
      {/* ============================================================
          TOP BANNER & CONTROLS
      ============================================================ */}
      <header className="p-4 md:px-6 bg-[#0f121a] border-b border-[#1f2330] shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Network className="w-4 h-4" />
              </div>
              <h1 className="text-lg font-bold tracking-tight text-zinc-100">
                Visualize Any GitHub Repository
              </h1>
              {analysisResult?.isDemo && (
                <span className="px-2 py-0.5 text-[10px] rounded font-mono bg-amber-950/70 border border-amber-800/50 text-amber-300">
                  Demo Mode
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              Explore how a codebase is structured, how its components communicate, and where its API endpoints lead.
            </p>
          </div>

          {/* Quick Demo Repository Chips */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-500 font-mono">Quick Repos:</span>
            <button
              onClick={() => {
                setRepoUrl('https://github.com/acme/taskflow-core');
                handleRunAnalysis('https://github.com/acme/taskflow-core', true);
              }}
              className="text-[11px] font-mono px-2 py-1 rounded bg-[#181c28] hover:bg-[#222738] border border-[#262c3e] text-zinc-300 cursor-pointer transition"
            >
              acme/taskflow-core (Full-Stack Demo)
            </button>
            <button
              onClick={() => {
                setRepoUrl('https://github.com/ananyadhagat/Maintainer-assistant');
                handleRunAnalysis('https://github.com/ananyadhagat/Maintainer-assistant', false);
              }}
              className="text-[11px] font-mono px-2 py-1 rounded bg-[#181c28] hover:bg-[#222738] border border-[#262c3e] text-zinc-300 cursor-pointer transition"
            >
              Maintainer-assistant (Current Repo)
            </button>
          </div>
        </div>

        {/* Input bar row */}
        <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
          <div className="flex-1 min-w-[280px] relative">
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repository"
              className="w-full px-3.5 py-2 rounded-lg bg-[#141722] border border-[#262b3a] text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
            />
          </div>

          <div className="w-28 relative">
            <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-zinc-500">
              <GitBranch className="w-3 h-3" />
            </div>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="branch (main)"
              className="w-full pl-7 pr-2.5 py-2 rounded-lg bg-[#141722] border border-[#262b3a] text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <button
            onClick={() => handleRunAnalysis(repoUrl, forceDemo)}
            disabled={isAnalyzing}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/50 text-white text-xs font-medium font-mono flex items-center gap-2 transition cursor-pointer shadow-md shadow-indigo-950/40 shrink-0"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Analyzing Architecture...
              </>
            ) : (
              <>
                <Network className="w-3.5 h-3.5" />
                Analyze Repository
              </>
            )}
          </button>
        </div>

        {/* Progress Bar during Analysis */}
        {isAnalyzing && (
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span className="flex items-center gap-1.5 text-indigo-300">
                <RefreshCw className="w-3 h-3 animate-spin" /> {progressStage}
              </span>
              <span>{analysisProgress}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#1b1e2a] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 transition-all duration-300"
                style={{ width: `${analysisProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mt-3 p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-xs text-red-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            {error.includes('rate limit') && onNavigateToSettings && (
              <button
                onClick={onNavigateToSettings}
                className="px-2 py-1 rounded bg-red-900/60 hover:bg-red-800 text-[11px] font-mono font-medium text-white transition cursor-pointer"
              >
                Configure GitHub Token
              </button>
            )}
          </div>
        )}

        {/* Repository Overview Metadata Pill Bar */}
        {analysisResult && (
          <div className="mt-3 pt-3 border-t border-[#1b1f2b] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-zinc-200 font-mono flex items-center gap-1.5">
                <img
                  src={analysisResult.repo.owner.avatar_url || 'https://github.com/github.png'}
                  alt={analysisResult.repo.owner.login}
                  className="w-4 h-4 rounded-full border border-zinc-700"
                />
                {analysisResult.repo.full_name}
              </span>

              <span className="text-zinc-600">•</span>

              <div className="flex items-center gap-1 font-mono text-[11px]">
                {analysisResult.detectedLanguages.slice(0, 3).map((lang, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-[#161a26] text-zinc-300 border border-[#23293c]"
                  >
                    {lang}
                  </span>
                ))}
              </div>

              {analysisResult.frameworks.length > 0 && (
                <>
                  <span className="text-zinc-600">•</span>
                  <div className="flex items-center gap-1 font-mono text-[11px]">
                    {analysisResult.frameworks.slice(0, 4).map((fw, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-indigo-950/40 text-indigo-300 border border-indigo-800/40"
                      >
                        {fw}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-3 text-zinc-400 font-mono text-[11px]">
              <span>
                <strong className="text-zinc-200">{analysisResult.nodes.length}</strong> Nodes
              </span>
              <span>
                <strong className="text-zinc-200">{analysisResult.edges.length}</strong> Connections
              </span>
              <span>
                <strong className="text-emerald-400">{analysisResult.endpoints.length}</strong> Endpoints
              </span>
            </div>
          </div>
        )}
      </header>

      {/* ============================================================
          VIEW MODE TABS & GRAPH TOOLBAR
      ============================================================ */}
      <div className="p-2.5 px-4 md:px-6 bg-[#0c0e16] border-b border-[#1b1f2b] flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
        {/* Three Diagram View Modes */}
        <div className="flex items-center p-0.5 rounded-lg bg-[#141722] border border-[#222736]">
          <button
            onClick={() => setViewMode('system')}
            className={`px-3 py-1.5 rounded-md font-mono text-xs font-medium cursor-pointer transition ${
              viewMode === 'system'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            System Architecture
          </button>
          <button
            onClick={() => setViewMode('api_flow')}
            className={`px-3 py-1.5 rounded-md font-mono text-xs font-medium cursor-pointer transition ${
              viewMode === 'api_flow'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            API Request Flow
          </button>
          <button
            onClick={() => setViewMode('feature_dep')}
            className={`px-3 py-1.5 rounded-md font-mono text-xs font-medium cursor-pointer transition ${
              viewMode === 'feature_dep'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Feature & Dependencies
          </button>
        </div>

        {/* Filter and Search controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Node Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search components or endpoints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1 rounded-md bg-[#141722] border border-[#222736] text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition w-44 md:w-56"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1 rounded-md bg-[#141722] border border-[#222736] text-xs font-mono text-zinc-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="FRONTEND">Frontend (Client, Pages, Components)</option>
            <option value="API">API Routes & Middleware</option>
            <option value="CONTROLLER">Controllers</option>
            <option value="SERVICE">Services & Domain Logic</option>
            <option value="DATABASE">Databases & Models</option>
            <option value="EXTERNAL">External APIs</option>
          </select>

          {/* Trace Endpoint Selector */}
          {analysisResult && analysisResult.endpoints.length > 0 && (
            <select
              value={tracedEndpointNodeId || ''}
              onChange={(e) => setTracedEndpointNodeId(e.target.value || null)}
              className="px-2.5 py-1 rounded-md bg-emerald-950/40 border border-emerald-800/40 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="">Trace Flow: None</option>
              {analysisResult.endpoints.map((ep) => (
                <option key={ep.id} value={ep.nodeId}>
                  Trace: {ep.method} {ep.path}
                </option>
              ))}
            </select>
          )}

          {/* Reset Filters Button */}
          {(searchTerm || categoryFilter !== 'ALL' || tracedEndpointNodeId) && (
            <button
              onClick={handleResetFilters}
              title="Reset search and filters"
              className="p-1.5 rounded-md bg-[#1a1e2b] hover:bg-[#252b3d] text-zinc-400 hover:text-zinc-200 border border-[#292f42] cursor-pointer transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Toggle Endpoint Explorer Panel */}
          <button
            onClick={() => setShowEndpoints((prev) => !prev)}
            className={`px-3 py-1 rounded-md font-mono text-xs flex items-center gap-1.5 border transition cursor-pointer ${
              showEndpoints
                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                : 'bg-[#141722] border-[#222736] text-zinc-300 hover:bg-[#1a1e2c]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Endpoint Explorer
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#1f2434] text-zinc-400">
              {analysisResult?.endpoints.length || 0}
            </span>
          </button>

          {/* Export Actions Menu */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleExportPng}
              title="Export diagram as PNG"
              className="px-2.5 py-1 rounded-md bg-[#141722] hover:bg-[#1d212f] text-zinc-300 border border-[#222736] text-xs font-mono flex items-center gap-1 cursor-pointer transition"
            >
              <Download className="w-3 h-3" /> PNG
            </button>
            <button
              onClick={handleExportSvg}
              title="Export diagram as SVG"
              className="px-2.5 py-1 rounded-md bg-[#141722] hover:bg-[#1d212f] text-zinc-300 border border-[#222736] text-xs font-mono flex items-center gap-1 cursor-pointer transition"
            >
              SVG
            </button>
            <button
              onClick={handleExportJson}
              title="Export graph as JSON"
              className="px-2.5 py-1 rounded-md bg-[#141722] hover:bg-[#1d212f] text-zinc-300 border border-[#222736] text-xs font-mono flex items-center gap-1 cursor-pointer transition"
            >
              JSON
            </button>
            <button
              onClick={handleCopyMarkdownSummary}
              title="Copy markdown architecture summary"
              className="px-2.5 py-1 rounded-md bg-[#141722] hover:bg-[#1d212f] text-zinc-300 border border-[#222736] text-xs font-mono flex items-center gap-1 cursor-pointer transition"
            >
              {copyFeedback ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3" />}
              {copyFeedback ? 'Copied' : 'Report'}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          MAIN WORKSPACE CANVAS WITH GRAPH AND DRAWERS
      ============================================================ */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Collapsible Repository & Module Explorer */}
        {showExplorer && analysisResult && (
          <aside className="w-64 bg-[#0e1017] border-r border-[#1f2330] flex flex-col shrink-0 overflow-hidden text-xs">
            <div className="p-3 border-b border-[#1f2330] flex items-center justify-between font-mono font-semibold text-zinc-300">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> System Architecture
              </span>
              <button
                onClick={() => setShowExplorer(false)}
                className="text-zinc-500 hover:text-zinc-300 p-0.5 cursor-pointer"
                title="Collapse Explorer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* Pattern Badge */}
              <div className="space-y-1">
                <div className="text-[10px] font-mono uppercase text-zinc-500">Pattern Detected</div>
                <div className="p-2 rounded bg-[#141722] border border-[#222736] text-[11px] font-mono text-indigo-300 leading-snug">
                  {analysisResult.systemOverview.primaryArchitecturePattern}
                </div>
              </div>

              {/* High Level Summary */}
              <div className="space-y-1">
                <div className="text-[10px] font-mono uppercase text-zinc-500">Overview</div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {analysisResult.systemOverview.summary}
                </p>
              </div>

              {/* Architectural Strengths */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono uppercase text-emerald-400 font-semibold">
                  Architectural Strengths
                </div>
                <ul className="space-y-1 text-[11px] text-zinc-400">
                  {analysisResult.systemOverview.keyStrengths.map((s, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Potential Risks */}
              {analysisResult.systemOverview.potentialRisks.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono uppercase text-amber-400 font-semibold">
                    Potential Risks & Bottlenecks
                  </div>
                  <ul className="space-y-1 text-[11px] text-zinc-400">
                    {analysisResult.systemOverview.potentialRisks.map((r, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-500 mt-0.5">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Modules Quick List */}
              <div className="space-y-1.5 pt-2 border-t border-[#1f2330]">
                <div className="text-[10px] font-mono uppercase text-zinc-500">Mapped Nodes ({nodes.length})</div>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {nodes.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        setSelectedNodeId(n.id);
                        setSelectedEdgeId(null);
                      }}
                      className={`w-full text-left px-2 py-1 rounded text-[11px] font-mono truncate transition cursor-pointer flex items-center justify-between ${
                        selectedNodeId === n.id
                          ? 'bg-indigo-950 text-indigo-300 font-medium'
                          : 'text-zinc-400 hover:bg-[#151822] hover:text-zinc-200'
                      }`}
                    >
                      <span className="truncate">{n.data.name as string}</span>
                      <span className="text-[9px] text-zinc-500 shrink-0 ml-1">{n.data.layer as string}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Collapsed Explorer Button */}
        {!showExplorer && (
          <button
            onClick={() => setShowExplorer(true)}
            className="absolute left-2 top-3 z-20 px-2 py-1 rounded bg-[#161a26]/90 backdrop-blur border border-[#262c3e] text-xs font-mono text-zinc-400 hover:text-zinc-200 shadow-md cursor-pointer flex items-center gap-1"
          >
            <ChevronRight className="w-3.5 h-3.5" /> Explorer
          </button>
        )}

        {/* Central React Flow Graph Canvas */}
        <div ref={flowContainerRef} className="flex-1 h-full w-full relative bg-[#090b10]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.15 }}
            minZoom={0.2}
            maxZoom={1.8}
            className="w-full h-full"
          >
            <Background color="#1c202d" gap={24} size={1} />
            <Controls className="!bg-[#151824] !border-[#262b3a] !fill-zinc-400 [&>button]:!border-[#262b3a] [&>button]:!text-zinc-300" />
            <MiniMap
              nodeColor={(node) => {
                switch (node.data.nodeType) {
                  case 'client':
                  case 'frontend_page':
                    return '#0284c7';
                  case 'api_endpoint':
                    return '#059669';
                  case 'controller':
                    return '#d97706';
                  case 'service':
                    return '#9333ea';
                  case 'database':
                    return '#2563eb';
                  case 'external_api':
                    return '#db2777';
                  case 'auth_middleware':
                    return '#dc2626';
                  default:
                    return '#475569';
                }
              }}
              maskColor="rgba(10, 12, 18, 0.75)"
              className="!bg-[#11131a] !border-[#212534] !rounded-lg overflow-hidden"
            />
          </ReactFlow>

          {/* Floating Compact Legend */}
          {showLegend && (
            <div className="absolute left-4 bottom-4 z-10 p-3 rounded-xl bg-[#11141c]/90 backdrop-blur-md border border-[#222634] text-[11px] font-mono shadow-2xl max-w-xs space-y-2">
              <div className="flex items-center justify-between text-zinc-300 font-semibold pb-1 border-b border-[#202534]">
                <span>Architecture Legend</span>
                <button
                  onClick={() => setShowLegend(false)}
                  className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Node types colors */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
                  <span>Frontend View</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>API Endpoint</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span>Controller</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                  <span>Domain Service</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                  <span>Database Model</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shrink-0" />
                  <span>External Service</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                  <span>Auth Middleware</span>
                </div>
              </div>

              {/* Line styles */}
              <div className="pt-2 border-t border-[#1f2432] space-y-1 text-[10px] text-zinc-400">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-0.5 bg-indigo-500 shrink-0" />
                  <span>Verified Connection (From Code)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 border-t-2 border-dashed border-slate-400 shrink-0" />
                  <span>Inferred Connection (Static AST)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-0.5 bg-emerald-400 shadow-sm shrink-0" />
                  <span>Traced Request Flow</span>
                </div>
              </div>
            </div>
          )}

          {!showLegend && (
            <button
              onClick={() => setShowLegend(true)}
              className="absolute left-4 bottom-4 z-10 px-2 py-1 rounded bg-[#131622]/90 backdrop-blur border border-[#212636] text-[10px] font-mono text-zinc-400 hover:text-zinc-200 cursor-pointer shadow-md"
            >
              Legend
            </button>
          )}

          {/* Active Trace Banner */}
          {tracedEndpointNodeId && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-full bg-emerald-950/90 backdrop-blur border border-emerald-500/60 shadow-xl flex items-center gap-3 text-xs font-mono text-emerald-200">
              <span className="flex items-center gap-1.5 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Active Request Flow Trace
              </span>
              <button
                onClick={() => setTracedEndpointNodeId(null)}
                className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/80 hover:bg-emerald-800 text-white cursor-pointer"
              >
                Clear Trace
              </button>
            </div>
          )}
        </div>

        {/* Right Drawer: Component & Edge Details Drawer */}
        {(selectedNodeData || selectedEdgeData) && (
          <ComponentDetailsDrawer
            analysisId={analysisResult?.id}
            selectedNode={selectedNodeData}
            selectedEdge={selectedEdgeData}
            upstreamNodes={upstreamNodes}
            downstreamNodes={downstreamNodes}
            onTraceNode={handleTraceEndpoint}
            onSelectNode={(nodeId) => {
              setSelectedNodeId(nodeId);
              setSelectedEdgeId(null);
            }}
            onClose={() => {
              setSelectedNodeId(null);
              setSelectedEdgeId(null);
            }}
          />
        )}
      </div>

      {/* ============================================================
          BOTTOM / COLLAPSIBLE ENDPOINT EXPLORER PANEL
      ============================================================ */}
      {showEndpoints && analysisResult && (
        <div className="h-72 border-t border-[#1f2330] shrink-0">
          <EndpointExplorerPanel
            endpoints={analysisResult.endpoints}
            activeNodeId={selectedNodeId || undefined}
            tracedNodeId={tracedEndpointNodeId || undefined}
            onSelectEndpoint={(ep) => {
              setSelectedNodeId(ep.nodeId);
              setSelectedEdgeId(null);
            }}
            onTraceEndpoint={handleTraceEndpoint}
            onViewSource={(filePath, lineRange) => {
              const matchedNode = analysisResult.nodes.find((n) => n.data.filePath === filePath);
              if (matchedNode) {
                setSelectedNodeId(matchedNode.id);
              }
            }}
            onClose={() => setShowEndpoints(false)}
          />
        </div>
      )}
    </div>
  );
}
