import React from 'react';
import {
  X,
  ExternalLink,
  Activity,
  Server,
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Zap,
} from 'lucide-react';
import { Node, Edge } from '@xyflow/react';
import { ArchitectureNodeData } from './types';
import { CATEGORIES_CONFIG, CATEGORY_ICONS } from './categories';

interface NodeDetailsDrawerProps {
  selectedNode: Node<ArchitectureNodeData> | null;
  onClose: () => void;
  allNodes: Node<ArchitectureNodeData>[];
  allEdges: Edge[];
  onSelectNodeById: (id: string) => void;
}

export function NodeDetailsDrawer({
  selectedNode,
  onClose,
  allNodes,
  allEdges,
  onSelectNodeById,
}: NodeDetailsDrawerProps) {
  if (!selectedNode) return null;

  const data = selectedNode.data;
  const meta = CATEGORIES_CONFIG[data.category] || CATEGORIES_CONFIG.controller;
  const Icon = CATEGORY_ICONS[data.category] || Activity;

  // Find incoming and outgoing edges
  const incomingEdges = allEdges.filter((e) => e.target === selectedNode.id);
  const outgoingEdges = allEdges.filter((e) => e.source === selectedNode.id);

  const incomingNodes = incomingEdges
    .map((e) => allNodes.find((n) => n.id === e.source))
    .filter(Boolean) as Node<ArchitectureNodeData>[];

  const outgoingNodes = outgoingEdges
    .map((e) => allNodes.find((n) => n.id === e.target))
    .filter(Boolean) as Node<ArchitectureNodeData>[];

  return (
    <div className="absolute right-4 top-4 bottom-4 w-84 md:w-96 bg-[#12151e]/95 backdrop-blur-md border border-[#232838] rounded-2xl shadow-2xl z-20 flex flex-col overflow-hidden text-zinc-100 animate-in fade-in slide-in-from-right duration-200">
      {/* Top Header */}
      <div
        className="p-4 border-b border-[#212636] flex items-center justify-between"
        style={{
          background: `linear-gradient(90deg, ${meta.bgColor} 0%, rgba(18, 21, 30, 0.4) 100%)`,
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center border"
            style={{
              backgroundColor: meta.bgColor,
              borderColor: meta.borderColor,
            }}
          >
            <Icon className="w-4 h-4" style={{ color: meta.color }} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span
                className="text-[10px] font-mono font-bold uppercase tracking-wider"
                style={{ color: meta.textColor }}
              >
                {meta.label} Component
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
            <h3 className="text-sm font-bold text-zinc-100 tracking-tight leading-tight">
              {data.title}
            </h3>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-[#1b202c] transition"
          title="Close details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Quick Specs Grid */}
        <div className="grid grid-cols-2 gap-2 bg-[#0e1017] p-2.5 rounded-xl border border-[#1e2332]">
          <div>
            <span className="text-[10px] uppercase font-mono text-zinc-400">Technology</span>
            <div className="text-xs font-semibold text-zinc-200 mt-0.5 truncate">{data.tech}</div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-zinc-400">Endpoint / Port</span>
            <div className="text-xs font-mono text-indigo-300 mt-0.5 truncate">
              {data.endpoint || 'Internal'}
            </div>
          </div>
        </div>

        {/* Description */}
        {data.description && (
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">
              Role & Responsibility
            </span>
            <p className="text-xs text-zinc-300 leading-relaxed bg-[#161a25] p-3 rounded-xl border border-[#23293a]">
              {data.description}
            </p>
          </div>
        )}

        {/* Live Metrics */}
        {data.metrics && (
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">
              Operational Metrics
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-[#141822] border border-[#202534] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Latency</span>
                </div>
                <span className="text-xs font-mono font-semibold text-zinc-100">
                  {data.metrics.latency || 'N/A'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#141822] border border-[#202534] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Throughput</span>
                </div>
                <span className="text-xs font-mono font-semibold text-zinc-100">
                  {data.metrics.rps || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Upstream / Incoming Connections */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 flex items-center gap-1">
              <ArrowLeft className="w-3 h-3 text-sky-400" />
              <span>Upstream Sources ({incomingNodes.length})</span>
            </span>
          </div>

          {incomingNodes.length === 0 ? (
            <div className="text-[11px] text-zinc-400 italic bg-[#10121a] p-2.5 rounded-lg border border-[#1b1f2b]">
              No upstream callers (Entrypoint / Root component)
            </div>
          ) : (
            <div className="space-y-1">
              {incomingNodes.map((node) => {
                const nodeMeta = CATEGORIES_CONFIG[node.data.category];
                return (
                  <button
                    key={node.id}
                    onClick={() => onSelectNodeById(node.id)}
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-[#141822] hover:bg-[#1a202d] border border-[#202534] transition text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: nodeMeta?.color || '#94a3b8' }}
                      />
                      <span className="text-xs text-zinc-200 group-hover:text-white truncate">
                        {node.data.title}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#1c2130] text-zinc-400 border border-[#2a3246]">
                      {nodeMeta?.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Downstream / Outgoing Connections */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 flex items-center gap-1">
              <ArrowRight className="w-3 h-3 text-emerald-400" />
              <span>Downstream Targets ({outgoingNodes.length})</span>
            </span>
          </div>

          {outgoingNodes.length === 0 ? (
            <div className="text-[11px] text-zinc-400 italic bg-[#10121a] p-2.5 rounded-lg border border-[#1b1f2b]">
              No downstream dependencies (Leaf sink / datastore)
            </div>
          ) : (
            <div className="space-y-1">
              {outgoingNodes.map((node) => {
                const nodeMeta = CATEGORIES_CONFIG[node.data.category];
                return (
                  <button
                    key={node.id}
                    onClick={() => onSelectNodeById(node.id)}
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-[#141822] hover:bg-[#1a202d] border border-[#202534] transition text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: nodeMeta?.color || '#94a3b8' }}
                      />
                      <span className="text-xs text-zinc-200 group-hover:text-white truncate">
                        {node.data.title}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#1c2130] text-zinc-400 border border-[#2a3246]">
                      {nodeMeta?.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
