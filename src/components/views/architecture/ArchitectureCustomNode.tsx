import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  Globe,
  Layers,
  Terminal,
  Server,
  Database,
  ExternalLink,
  ShieldCheck,
  Cpu,
  FileCode,
  Box,
  Lock,
} from 'lucide-react';
import { ArchitectureNodeData, ArchitectureNodeType } from '../../../types';

function getNodeTypeStyles(type: ArchitectureNodeType): {
  border: string;
  badgeBg: string;
  badgeText: string;
  iconBg: string;
  Icon: React.ComponentType<{ className?: string }>;
  typeName: string;
} {
  switch (type) {
    case 'client':
      return {
        border: 'border-cyan-500/50 hover:border-cyan-400',
        badgeBg: 'bg-cyan-950/60 border-cyan-800/60',
        badgeText: 'text-cyan-300',
        iconBg: 'bg-cyan-500/10 text-cyan-400',
        Icon: Globe,
        typeName: 'Client / User',
      };
    case 'frontend_page':
      return {
        border: 'border-sky-500/50 hover:border-sky-400',
        badgeBg: 'bg-sky-950/60 border-sky-800/60',
        badgeText: 'text-sky-300',
        iconBg: 'bg-sky-500/10 text-sky-400',
        Icon: Layers,
        typeName: 'Page View',
      };
    case 'frontend_component':
      return {
        border: 'border-teal-500/50 hover:border-teal-400',
        badgeBg: 'bg-teal-950/60 border-teal-800/60',
        badgeText: 'text-teal-300',
        iconBg: 'bg-teal-500/10 text-teal-400',
        Icon: Box,
        typeName: 'UI Component',
      };
    case 'api_endpoint':
      return {
        border: 'border-emerald-500/50 hover:border-emerald-400',
        badgeBg: 'bg-emerald-950/60 border-emerald-800/60',
        badgeText: 'text-emerald-300',
        iconBg: 'bg-emerald-500/10 text-emerald-400',
        Icon: Terminal,
        typeName: 'API Endpoint',
      };
    case 'controller':
      return {
        border: 'border-amber-500/50 hover:border-amber-400',
        badgeBg: 'bg-amber-950/60 border-amber-800/60',
        badgeText: 'text-amber-300',
        iconBg: 'bg-amber-500/10 text-amber-400',
        Icon: Cpu,
        typeName: 'Controller',
      };
    case 'service':
      return {
        border: 'border-purple-500/50 hover:border-purple-400',
        badgeBg: 'bg-purple-950/60 border-purple-800/60',
        badgeText: 'text-purple-300',
        iconBg: 'bg-purple-500/10 text-purple-400',
        Icon: Server,
        typeName: 'Domain Service',
      };
    case 'database':
      return {
        border: 'border-blue-500/50 hover:border-blue-400',
        badgeBg: 'bg-blue-950/60 border-blue-800/60',
        badgeText: 'text-blue-300',
        iconBg: 'bg-blue-500/10 text-blue-400',
        Icon: Database,
        typeName: 'Database Model',
      };
    case 'external_api':
      return {
        border: 'border-pink-500/50 hover:border-pink-400',
        badgeBg: 'bg-pink-950/60 border-pink-800/60',
        badgeText: 'text-pink-300',
        iconBg: 'bg-pink-500/10 text-pink-400',
        Icon: ExternalLink,
        typeName: 'External API',
      };
    case 'auth_middleware':
      return {
        border: 'border-red-500/50 hover:border-red-400',
        badgeBg: 'bg-red-950/60 border-red-800/60',
        badgeText: 'text-red-300',
        iconBg: 'bg-red-500/10 text-red-400',
        Icon: ShieldCheck,
        typeName: 'Auth Guard',
      };
    case 'config':
    case 'utility':
    default:
      return {
        border: 'border-slate-500/50 hover:border-slate-400',
        badgeBg: 'bg-slate-900 border-slate-700',
        badgeText: 'text-slate-300',
        iconBg: 'bg-slate-800 text-slate-400',
        Icon: FileCode,
        typeName: 'Module',
      };
  }
}

function getMethodBadgeColor(method?: string) {
  switch (method?.toUpperCase()) {
    case 'GET':
      return 'bg-blue-950/80 text-blue-300 border-blue-800/60';
    case 'POST':
      return 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60';
    case 'PUT':
    case 'PATCH':
      return 'bg-amber-950/80 text-amber-300 border-amber-800/60';
    case 'DELETE':
      return 'bg-red-950/80 text-red-300 border-red-800/60';
    default:
      return 'bg-zinc-800 text-zinc-300 border-zinc-700';
  }
}

export const ArchitectureCustomNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as ArchitectureNodeData;
  const { border, badgeBg, badgeText, iconBg, Icon, typeName } = getNodeTypeStyles(nodeData.nodeType);

  const isTraced = Boolean(nodeData.isTraced);
  const isDimmed = Boolean(nodeData.isDimmed);
  const isHighlighted = Boolean(nodeData.isHighlighted || selected);

  return (
    <div
      className={`relative min-w-[240px] max-w-[280px] rounded-xl p-3.5 bg-[#141720]/95 backdrop-blur-md border transition-all duration-200 select-none shadow-xl ${
        isTraced
          ? 'border-emerald-400 ring-2 ring-emerald-500/40 shadow-emerald-950/50 scale-[1.02]'
          : isHighlighted
          ? 'border-indigo-400 ring-2 ring-indigo-500/40 shadow-indigo-950/50'
          : border
      } ${isDimmed ? 'opacity-25 grayscale-[60%]' : 'opacity-100'}`}
    >
      {/* Input Handle (Left) */}
      {nodeData.nodeType !== 'client' && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !-left-1.5 !bg-indigo-400 !border-2 !border-[#0f1117] hover:!scale-125 transition-transform"
        />
      )}

      {/* Header: Icon, Type Badge, and Optional Auth lock */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span
            className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${badgeBg} ${badgeText}`}
          >
            {typeName}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {nodeData.authRequired && (
            <span
              title="Protected with authentication"
              className="p-1 rounded bg-amber-950/60 border border-amber-800/40 text-amber-300"
            >
              <Lock className="w-2.5 h-2.5" />
            </span>
          )}
          {nodeData.httpMethod && (
            <span
              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${getMethodBadgeColor(
                nodeData.httpMethod
              )}`}
            >
              {nodeData.httpMethod}
            </span>
          )}
        </div>
      </div>

      {/* Main Label / Name */}
      <div className="mb-1.5">
        <h4 className="text-xs font-semibold text-zinc-100 truncate font-mono tracking-tight" title={nodeData.name}>
          {nodeData.name}
        </h4>
        {nodeData.filePath && (
          <p className="text-[10px] text-zinc-400 font-mono truncate hover:text-zinc-300" title={nodeData.filePath}>
            {nodeData.filePath}
          </p>
        )}
      </div>

      {/* Summary / Tech tag row */}
      {nodeData.technologies && nodeData.technologies.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-[#232733]">
          {nodeData.technologies.slice(0, 2).map((tech, idx) => (
            <span
              key={idx}
              className="text-[9px] px-1.5 py-0.5 rounded bg-[#1c202b] text-zinc-400 font-mono border border-[#2b3140]"
            >
              {tech}
            </span>
          ))}
          {nodeData.technologies.length > 2 && (
            <span className="text-[9px] px-1 py-0.5 text-zinc-500 font-mono">
              +{nodeData.technologies.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Output Handle (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !-right-1.5 !bg-indigo-400 !border-2 !border-[#0f1117] hover:!scale-125 transition-transform"
      />
    </div>
  );
});

ArchitectureCustomNode.displayName = 'ArchitectureCustomNode';
