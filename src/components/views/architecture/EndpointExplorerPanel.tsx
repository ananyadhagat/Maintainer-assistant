import React, { useState, useMemo } from 'react';
import {
  Terminal,
  Search,
  Filter,
  Lock,
  Unlock,
  ExternalLink,
  GitCommit,
  Server,
  Database,
  ArrowRight,
  Eye,
  CheckCircle2,
  X,
} from 'lucide-react';
import { DiscoveredEndpoint } from '../../../types';

interface EndpointExplorerPanelProps {
  endpoints: DiscoveredEndpoint[];
  activeNodeId?: string;
  tracedNodeId?: string;
  onSelectEndpoint: (endpoint: DiscoveredEndpoint) => void;
  onTraceEndpoint: (nodeId: string) => void;
  onViewSource: (filePath: string, lineRange?: [number, number]) => void;
  onClose?: () => void;
}

function getMethodBadge(method: string) {
  switch (method.toUpperCase()) {
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

export function EndpointExplorerPanel({
  endpoints,
  activeNodeId,
  tracedNodeId,
  onSelectEndpoint,
  onTraceEndpoint,
  onViewSource,
  onClose,
}: EndpointExplorerPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('ALL');
  const [authFilter, setAuthFilter] = useState<'ALL' | 'AUTH' | 'PUBLIC'>('ALL');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');

  // Available modules/controllers
  const modules = useMemo(() => {
    const set = new Set<string>();
    endpoints.forEach((ep) => {
      if (ep.controllerName) set.add(ep.controllerName);
      else if (ep.filePath) {
        const parts = ep.filePath.split('/');
        set.add(parts[parts.length - 1].replace(/\.[^.]+$/, ''));
      }
    });
    return Array.from(set).sort();
  }, [endpoints]);

  // Filtered endpoints
  const filtered = useMemo(() => {
    return endpoints.filter((ep) => {
      const matchSearch =
        searchTerm === '' ||
        ep.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ep.handlerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ep.filePath.toLowerCase().includes(searchTerm.toLowerCase());

      const matchMethod = selectedMethod === 'ALL' || ep.method.toUpperCase() === selectedMethod;
      const matchAuth =
        authFilter === 'ALL' || (authFilter === 'AUTH' && ep.authRequired) || (authFilter === 'PUBLIC' && !ep.authRequired);

      const mod = ep.controllerName || ep.filePath.split('/').pop()?.replace(/\.[^.]+$/, '') || '';
      const matchModule = selectedModule === 'ALL' || mod === selectedModule;

      return matchSearch && matchMethod && matchAuth && matchModule;
    });
  }, [endpoints, searchTerm, selectedMethod, authFilter, selectedModule]);

  return (
    <div className="flex flex-col h-full bg-[#11131a] border-t md:border-t-0 md:border-l border-[#21242f]">
      {/* Top Header */}
      <div className="p-4 border-b border-[#21242f] flex items-center justify-between bg-[#141722]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              Endpoint Explorer
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#1c202d] text-zinc-400 font-mono border border-[#2b3142]">
                {filtered.length} / {endpoints.length}
              </span>
            </h3>
            <p className="text-[11px] text-zinc-400">
              Discovered HTTP routes, security middleware, and downstream services
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-[#1f2330] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 border-b border-[#21242f] bg-[#0e1017] space-y-2.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search route path, handler, or source file..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#151822] border border-[#262a38] text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-mono transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {/* Method Pills */}
          <div className="flex items-center rounded-lg bg-[#151822] p-0.5 border border-[#242836] font-mono text-[11px]">
            {['ALL', 'GET', 'POST', 'PUT', 'DELETE'].map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMethod(m)}
                className={`px-2 py-0.5 rounded cursor-pointer transition ${
                  selectedMethod === m
                    ? 'bg-indigo-600 text-white font-medium shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Auth Selector */}
          <div className="flex items-center rounded-lg bg-[#151822] p-0.5 border border-[#242836] text-[11px]">
            <button
              onClick={() => setAuthFilter('ALL')}
              className={`px-2 py-0.5 rounded cursor-pointer transition ${
                authFilter === 'ALL' ? 'bg-[#252a38] text-zinc-200' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setAuthFilter('AUTH')}
              className={`px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition ${
                authFilter === 'AUTH'
                  ? 'bg-amber-950 text-amber-200 border border-amber-800/60'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Lock className="w-2.5 h-2.5" /> Auth
            </button>
            <button
              onClick={() => setAuthFilter('PUBLIC')}
              className={`px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition ${
                authFilter === 'PUBLIC'
                  ? 'bg-slate-800 text-zinc-200'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Unlock className="w-2.5 h-2.5" /> Public
            </button>
          </div>

          {/* Module dropdown */}
          {modules.length > 0 && (
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="px-2 py-1 rounded-lg bg-[#151822] border border-[#242836] text-[11px] text-zinc-300 font-mono focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Modules</option>
              {modules.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Endpoints List Table */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#1e222d] p-2 space-y-1.5">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs">
            No API endpoints match the selected filters.
          </div>
        ) : (
          filtered.map((ep) => {
            const isSelected = activeNodeId === ep.nodeId;
            const isTraced = tracedNodeId === ep.nodeId;

            return (
              <div
                key={ep.id}
                onClick={() => onSelectEndpoint(ep)}
                className={`p-3 rounded-lg border transition cursor-pointer ${
                  isTraced
                    ? 'bg-emerald-950/20 border-emerald-500/50 shadow-md shadow-emerald-950/20'
                    : isSelected
                    ? 'bg-indigo-950/30 border-indigo-500/60 shadow-md shadow-indigo-950/30'
                    : 'bg-[#151822] border-[#222634] hover:border-[#32384a] hover:bg-[#191d29]'
                }`}
              >
                {/* Method & Route Line */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${getMethodBadge(
                        ep.method
                      )}`}
                    >
                      {ep.method}
                    </span>
                    <span
                      className="text-xs font-mono font-semibold text-zinc-100 truncate hover:text-indigo-300 transition"
                      title={ep.path}
                    >
                      {ep.path}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {ep.authRequired ? (
                      <span
                        title={ep.authMiddleware ? `Protected by ${ep.authMiddleware}` : 'Protected route'}
                        className="px-1.5 py-0.5 text-[10px] rounded bg-amber-950/70 border border-amber-800/50 text-amber-300 flex items-center gap-1 font-mono"
                      >
                        <Lock className="w-2.5 h-2.5" />
                        {ep.authMiddleware ? ep.authMiddleware.split('(')[0] : 'Auth'}
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 text-[10px] rounded bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 font-mono flex items-center gap-1">
                        <Unlock className="w-2.5 h-2.5" /> Public
                      </span>
                    )}
                  </div>
                </div>

                {/* Handler, Controller, and Source File */}
                <div className="text-[11px] text-zinc-400 font-mono flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
                  <span className="flex items-center gap-1 text-zinc-300">
                    <span className="text-zinc-500">handler:</span>
                    <span className="text-indigo-300 font-medium">{ep.handlerName}()</span>
                  </span>

                  {ep.controllerName && (
                    <span className="flex items-center gap-1 text-zinc-400">
                      <span className="text-zinc-500">ctrl:</span>
                      <span>{ep.controllerName}</span>
                    </span>
                  )}

                  <span className="text-zinc-500 truncate" title={ep.filePath}>
                    {ep.filePath}
                    {ep.lineRange && `:${ep.lineRange[0]}-${ep.lineRange[1]}`}
                  </span>
                </div>

                {/* Downstream services and models */}
                {(ep.servicesCalled.length > 0 || ep.modelsAccessed.length > 0 || ep.callersFrontend.length > 0) && (
                  <div className="flex flex-wrap gap-1.5 text-[10px] font-mono mt-2 pt-2 border-t border-[#1f2330]">
                    {ep.callersFrontend.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-800/40 flex items-center gap-1">
                        Called by {ep.callersFrontend.join(', ')}
                      </span>
                    )}

                    {ep.servicesCalled.map((svc, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40 flex items-center gap-1"
                      >
                        <Server className="w-2.5 h-2.5" /> {svc.split('.')[0]}
                      </span>
                    ))}

                    {ep.modelsAccessed.map((m, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/40 flex items-center gap-1"
                      >
                        <Database className="w-2.5 h-2.5" /> {m}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Buttons: Trace & View Source */}
                <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-[#1e222e]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTraceEndpoint(ep.nodeId);
                    }}
                    className={`px-2 py-1 rounded text-[10px] font-mono font-medium flex items-center gap-1 cursor-pointer transition ${
                      isTraced
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#1e2332] text-emerald-300 hover:bg-emerald-950/60 border border-emerald-800/40'
                    }`}
                  >
                    <ArrowRight className="w-3 h-3" />
                    {isTraced ? 'Traced Flow' : 'Trace Flow'}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewSource(ep.filePath, ep.lineRange);
                    }}
                    className="px-2 py-1 rounded text-[10px] font-mono text-zinc-300 bg-[#1c202d] hover:bg-[#252a3b] border border-[#2c3244] flex items-center gap-1 cursor-pointer transition"
                  >
                    <Eye className="w-3 h-3" /> View Source
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
