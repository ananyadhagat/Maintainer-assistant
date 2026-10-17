import React, { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { ArchitectureNodeData } from './types';
import { CATEGORIES_CONFIG, CATEGORY_ICONS } from './categories';
import { Activity, ShieldCheck, AlertTriangle } from 'lucide-react';

export type ArchitectureNodeType = Node<
  ArchitectureNodeData & {
    isDimmed?: boolean;
    isHighlighted?: boolean;
  }
>;

export const ArchitectureNode = memo(function ArchitectureNode({
  data,
  selected,
}: NodeProps<ArchitectureNodeType>) {
  const meta = CATEGORIES_CONFIG[data.category] || CATEGORIES_CONFIG.controller;
  const Icon = CATEGORY_ICONS[data.category] || Activity;
  const isDimmed = Boolean(data.isDimmed);
  const isHighlighted = Boolean(data.isHighlighted);

  const statusColor =
    data.status === 'healthy'
      ? 'bg-emerald-400'
      : data.status === 'warning'
      ? 'bg-amber-400'
      : 'bg-rose-500';

  return (
    <div
      className={`relative min-w-[220px] max-w-[280px] rounded-xl border bg-[#131620] shadow-xl transition-all duration-200 select-none ${
        isDimmed ? 'opacity-25 grayscale-[70%]' : 'opacity-100'
      } ${
        selected
          ? 'border-indigo-400 ring-2 ring-indigo-500/40 shadow-indigo-500/20'
          : isHighlighted
          ? 'border-amber-400 ring-2 ring-amber-500/40'
          : 'border-[#24293a] hover:border-[#384058]'
      }`}
      style={{
        boxShadow: selected
          ? `0 0 20px ${meta.bgColor}`
          : '0 8px 24px -4px rgba(0, 0, 0, 0.45)',
      }}
    >
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-[#3a4257] !border-2 !border-[#131620] hover:!bg-indigo-400 transition"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-[#3a4257] !border-2 !border-[#131620] hover:!bg-indigo-400 transition"
      />

      {/* Node Top Header */}
      <div
        className="px-3 py-2 border-b border-[#1f2434] flex items-center justify-between rounded-t-xl"
        style={{
          background: `linear-gradient(90deg, ${meta.bgColor} 0%, rgba(19, 22, 32, 0.6) 100%)`,
        }}
      >
        <div className="flex items-center gap-1.5">
          <div
            className="w-5 h-5 rounded flex items-center justify-center shrink-0 border"
            style={{
              borderColor: meta.borderColor,
              backgroundColor: meta.bgColor,
            }}
          >
            <Icon className="w-3 h-3" style={{ color: meta.color }} />
          </div>
          <span
            className="text-[10px] uppercase font-mono font-bold tracking-wider"
            style={{ color: meta.textColor }}
          >
            {meta.label}
          </span>
        </div>

        {/* Health status dot */}
        <div className="flex items-center gap-1.5" title={`Status: ${data.status}`}>
          <span className={`w-2 h-2 rounded-full ${statusColor} animate-pulse`} />
        </div>
      </div>

      {/* Main Node Body */}
      <div className="p-3 space-y-2">
        <div>
          <h4 className="text-xs font-semibold text-zinc-100 tracking-tight leading-snug">
            {data.title}
          </h4>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1c2130] text-zinc-300 border border-[#2b3348]">
              {data.tech}
            </span>
            {data.endpoint && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#181a24] text-zinc-400 border border-[#262938]">
                {data.endpoint}
              </span>
            )}
          </div>
        </div>

        {data.description && (
          <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
            {data.description}
          </p>
        )}

        {/* Metrics Row */}
        {data.metrics && (
          <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-[#1f2434] text-[10px] font-mono text-zinc-400">
            {data.metrics.latency && (
              <div className="flex items-center justify-between bg-[#0e1017] px-2 py-1 rounded border border-[#1b1f2c]">
                <span className="text-zinc-400">lat:</span>
                <span className="text-zinc-200">{data.metrics.latency}</span>
              </div>
            )}
            {data.metrics.rps && (
              <div className="flex items-center justify-between bg-[#0e1017] px-2 py-1 rounded border border-[#1b1f2c]">
                <span className="text-zinc-400">rps:</span>
                <span className="text-zinc-200">{data.metrics.rps}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Outgoing Handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-[#3a4257] !border-2 !border-[#131620] hover:!bg-indigo-400 transition"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-[#3a4257] !border-2 !border-[#131620] hover:!bg-indigo-400 transition"
      />
    </div>
  );
});
