import React, { useState, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  BackgroundVariant,
  NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { ArchitectureNode, ArchitectureNodeType } from './ArchitectureNode';
import { Legend } from './Legend';
import { NodeDetailsDrawer } from './NodeDetailsDrawer';
import {
  NodeCategory,
  CategoryVisibility,
  VisibilityMode,
  ArchitectureNodeData,
} from './types';
import {
  CATEGORIES_CONFIG,
  DEFAULT_CATEGORY_VISIBILITY,
  CATEGORY_ICONS,
} from './categories';
import { ARCHITECTURE_PRESETS, ArchitecturePresetData } from './mockArchitectures';
import {
  Network,
  RotateCcw,
  Sparkles,
  Maximize2,
  Sliders,
  Database,
  Layers,
  Info,
  Check,
  Eye,
} from 'lucide-react';

const nodeTypes = {
  architectureNode: ArchitectureNode,
};

export function ArchitectureVisualizerView() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('maintainer-copilot');
  const [visibility, setVisibility] = useState<CategoryVisibility>(DEFAULT_CATEGORY_VISIBILITY);
  const [visibilityMode, setVisibilityMode] = useState<VisibilityMode>('hide');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Active preset
  const activePreset = useMemo(
    () => ARCHITECTURE_PRESETS.find((p) => p.id === selectedPresetId) || ARCHITECTURE_PRESETS[0],
    [selectedPresetId]
  );

  // Raw nodes & edges from preset
  const [rawNodes, setNodes, onNodesChange] = useNodesState(activePreset.nodes);
  const [rawEdges, setEdges, onEdgesChange] = useEdgesState(activePreset.edges);

  // When preset changes, update raw nodes and edges
  React.useEffect(() => {
    setNodes(activePreset.nodes);
    setEdges(activePreset.edges);
    setSelectedNodeId(null);
  }, [activePreset, setNodes, setEdges]);

  // Compute category counts for current preset
  const nodeCounts = useMemo(() => {
    const counts: Record<NodeCategory, number> = {
      database: 0,
      api: 0,
      controller: 0,
      service: 0,
      queue: 0,
      client: 0,
    };
    rawNodes.forEach((node) => {
      const cat = node.data.category as NodeCategory;
      if (counts[cat] !== undefined) {
        counts[cat] += 1;
      }
    });
    return counts;
  }, [rawNodes]);

  // Toggle single category
  const handleToggleCategory = useCallback((category: NodeCategory) => {
    setVisibility((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  }, []);

  // Show all
  const handleSelectAll = useCallback(() => {
    setVisibility({
      database: true,
      api: true,
      controller: true,
      service: true,
      queue: true,
      client: true,
    });
  }, []);

  // Hide all
  const handleDeselectAll = useCallback(() => {
    setVisibility({
      database: false,
      api: false,
      controller: false,
      service: false,
      queue: false,
      client: false,
    });
  }, []);

  // Invert
  const handleInvert = useCallback(() => {
    setVisibility((prev) => ({
      database: !prev.database,
      api: !prev.api,
      controller: !prev.controller,
      service: !prev.service,
      queue: !prev.queue,
      client: !prev.client,
    }));
  }, []);

  // Isolate a single category
  const handleIsolateCategory = useCallback((category: NodeCategory) => {
    setVisibility({
      database: category === 'database',
      api: category === 'api',
      controller: category === 'controller',
      service: category === 'service',
      queue: category === 'queue',
      client: category === 'client',
    });
  }, []);

  // Filtered / Decorated Nodes based on visibility and search
  const visibleNodes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return rawNodes
      .map((node) => {
        const cat = node.data.category as NodeCategory;
        const isCategoryVisible = visibility[cat] ?? true;
        const matchesSearch =
          !query ||
          node.data.title.toLowerCase().includes(query) ||
          node.data.tech.toLowerCase().includes(query) ||
          (node.data.description && node.data.description.toLowerCase().includes(query)) ||
          (node.data.endpoint && node.data.endpoint.toLowerCase().includes(query));

        // When in 'dim' mode, keep the node but set isDimmed
        if (visibilityMode === 'dim') {
          return {
            ...node,
            data: {
              ...node.data,
              isDimmed: !isCategoryVisible || (!matchesSearch && query.length > 0),
              isHighlighted: Boolean(query && matchesSearch),
            },
          };
        }

        // When in 'hide' mode, completely filter out if category is disabled
        if (!isCategoryVisible) {
          return null;
        }

        return {
          ...node,
          data: {
            ...node.data,
            isDimmed: Boolean(query && !matchesSearch),
            isHighlighted: Boolean(query && matchesSearch),
          },
        };
      })
      .filter(Boolean) as Node<ArchitectureNodeData>[];
  }, [rawNodes, visibility, visibilityMode, searchQuery]);

  // Set of visible node IDs to ensure no dangling edges
  const visibleNodeIds = useMemo(() => {
    return new Set(visibleNodes.filter((n) => !n.data?.isDimmed).map((n) => n.id));
  }, [visibleNodes]);

  const allVisibleNodeIds = useMemo(() => {
    return new Set(visibleNodes.map((n) => n.id));
  }, [visibleNodes]);

  // Filtered / Decorated Edges
  const visibleEdges = useMemo(() => {
    if (visibilityMode === 'hide') {
      return rawEdges.filter(
        (edge) => allVisibleNodeIds.has(edge.source) && allVisibleNodeIds.has(edge.target)
      );
    }

    // In 'dim' mode, dim edges connected to dimmed nodes
    return rawEdges.map((edge) => {
      const sourceActive = visibleNodeIds.has(edge.source);
      const targetActive = visibleNodeIds.has(edge.target);
      const isDimmed = !sourceActive || !targetActive;

      return {
        ...edge,
        animated: !isDimmed && Boolean(edge.animated),
        style: {
          ...edge.style,
          opacity: isDimmed ? 0.12 : 1,
        },
      };
    });
  }, [rawEdges, allVisibleNodeIds, visibleNodeIds, visibilityMode]);

  // Selected node object
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return rawNodes.find((n) => n.id === selectedNodeId) || null;
  }, [selectedNodeId, rawNodes]);

  // Node click handler
  const handleNodeClick: NodeMouseHandler = useCallback((_, node) => {
    setSelectedNodeId(node.id);
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // Reset layout to default preset coordinates
  const handleResetLayout = useCallback(() => {
    setNodes(activePreset.nodes);
    setEdges(activePreset.edges);
  }, [activePreset, setNodes, setEdges]);

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] w-full bg-[#0d0f15] rounded-2xl border border-[#212431] overflow-hidden shadow-2xl relative">
      {/* Top Visualizer Control Bar */}
      <div className="px-5 py-3 border-b border-[#202433] bg-[#12151e] flex flex-wrap items-center justify-between gap-3 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-zinc-100 tracking-tight">
                Architecture Visualizer
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1c202d] text-zinc-300 border border-[#2b3245]">
                React Flow Interactive
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">{activePreset.tagline}</p>
          </div>
        </div>

        {/* Preset Selector & Quick Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Preset dropdown */}
          <div className="flex items-center gap-1.5 bg-[#0e1017] px-2.5 py-1.5 rounded-lg border border-[#242938]">
            <span className="text-[10px] uppercase font-mono text-zinc-400">Architecture:</span>
            <select
              value={selectedPresetId}
              onChange={(e) => setSelectedPresetId(e.target.value)}
              className="bg-transparent text-xs font-medium text-zinc-200 outline-none cursor-pointer"
            >
              {ARCHITECTURE_PRESETS.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#141722] text-zinc-200">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Layout */}
          <button
            onClick={handleResetLayout}
            className="px-3 py-1.5 rounded-lg bg-[#181c26] hover:bg-[#202534] text-zinc-300 text-xs font-medium border border-[#282f42] flex items-center gap-1.5 transition cursor-pointer"
            title="Reset node coordinates to default blueprint"
          >
            <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Reset Layout</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 w-full h-full relative">
        <ReactFlow
          nodes={visibleNodes}
          edges={visibleEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={1.8}
          proOptions={{ hideAttribution: true }}
          className="bg-[#0b0d13]"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1.5}
            color="#22283a"
          />

          <Controls
            className="!bg-[#141722] !border-[#262c3e] !rounded-xl !shadow-xl !overflow-hidden [&>button]:!bg-[#141722] [&>button]:!border-b [&>button]:!border-[#262c3e] [&>button]:!text-zinc-300 hover:[&>button]:!bg-[#1e2334]"
          />

          <MiniMap
            zoomable
            pannable
            nodeColor={(n) => {
              const cat = (n.data as ArchitectureNodeData)?.category;
              return CATEGORIES_CONFIG[cat]?.color || '#6366f1';
            }}
            maskColor="rgba(11, 13, 19, 0.75)"
            className="!bg-[#12151e] !border !border-[#252a3b] !rounded-xl !overflow-hidden !bottom-4 !left-4"
          />

          {/* Interactive Legend in React Flow Panel */}
          <Panel position="top-right" className="!m-4">
            <Legend
              visibility={visibility}
              onToggleCategory={handleToggleCategory}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onInvert={handleInvert}
              onIsolateCategory={handleIsolateCategory}
              nodeCounts={nodeCounts}
              totalNodes={rawNodes.length}
              visibleNodesCount={
                visibilityMode === 'hide'
                  ? visibleNodes.length
                  : visibleNodes.filter((n) => !n.data?.isDimmed).length
              }
              visibilityMode={visibilityMode}
              onChangeVisibilityMode={setVisibilityMode}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </Panel>
        </ReactFlow>

        {/* Selected Node Inspector Drawer */}
        <NodeDetailsDrawer
          selectedNode={selectedNode}
          onClose={() => setSelectedNodeId(null)}
          allNodes={rawNodes}
          allEdges={rawEdges}
          onSelectNodeById={(id) => setSelectedNodeId(id)}
        />
      </div>
    </div>
  );
}
