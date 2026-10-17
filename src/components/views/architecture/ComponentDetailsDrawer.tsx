import React, { useState, useEffect } from 'react';
import {
  X,
  FileCode,
  ArrowRight,
  ShieldCheck,
  Server,
  Database,
  ExternalLink,
  Lock,
  Copy,
  Check,
  Code2,
  Terminal,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ArchitectureNodeData, ArchitectureEdgeData } from '../../../types';
import { api } from '../../../api';

interface ComponentDetailsDrawerProps {
  analysisId?: string;
  selectedNode: ArchitectureNodeData | null;
  selectedEdge: ArchitectureEdgeData | null;
  upstreamNodes?: ArchitectureNodeData[];
  downstreamNodes?: ArchitectureNodeData[];
  onTraceNode?: (nodeId: string) => void;
  onSelectNode?: (nodeId: string) => void;
  onClose: () => void;
}

export function ComponentDetailsDrawer({
  analysisId,
  selectedNode,
  selectedEdge,
  upstreamNodes = [],
  downstreamNodes = [],
  onTraceNode,
  onSelectNode,
  onClose,
}: ComponentDetailsDrawerProps) {
  const [sourceCode, setSourceCode] = useState<string | null>(null);
  const [isLoadingSource, setIsLoadingSource] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Fetch source code when selectedNode changes
  useEffect(() => {
    let isCancelled = false;
    if (selectedNode?.filePath && analysisId) {
      setIsLoadingSource(true);
      setSourceCode(null);
      api
        .getSourceSnippet(
          analysisId,
          selectedNode.filePath,
          selectedNode.lineRange?.[0],
          selectedNode.lineRange?.[1]
        )
        .then((res) => {
          if (!isCancelled) {
            setSourceCode(res.content);
            setIsLoadingSource(false);
          }
        })
        .catch(() => {
          if (!isCancelled) {
            setSourceCode(`// Failed to fetch source code for ${selectedNode.filePath}`);
            setIsLoadingSource(false);
          }
        });
    } else {
      setSourceCode(null);
    }
    return () => {
      isCancelled = true;
    };
  }, [selectedNode, analysisId]);

  const handleCopyCode = () => {
    if (sourceCode) {
      navigator.clipboard.writeText(sourceCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  if (!selectedNode && !selectedEdge) return null;

  return (
    <div className="w-80 md:w-96 bg-[#131620] border-l border-[#222634] flex flex-col h-full shadow-2xl z-30 select-text overflow-hidden shrink-0">
      {/* Drawer Header */}
      <div className="p-4 border-b border-[#222634] flex items-center justify-between bg-[#161a26]">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            {selectedNode ? <Layers className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </div>
          <div className="truncate">
            <h3 className="text-xs font-semibold text-zinc-100 truncate font-mono">
              {selectedNode ? selectedNode.name : `${selectedEdge?.relationshipType.toUpperCase()} Edge`}
            </h3>
            <p className="text-[10px] text-zinc-400 font-mono">
              {selectedNode ? selectedNode.nodeType.replace(/_/g, ' ') : selectedEdge?.confidence}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-[#202534] transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ============================================================
            Node Details Mode
        ============================================================ */}
        {selectedNode && (
          <>
            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/70 border border-indigo-800/60 text-indigo-300">
                Layer: {selectedNode.layer}
              </span>

              {selectedNode.httpMethod && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/60 text-emerald-300">
                  {selectedNode.httpMethod}
                </span>
              )}

              {selectedNode.authRequired && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/70 border border-amber-800/60 text-amber-300 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Protected
                </span>
              )}
            </div>

            {/* Summary */}
            {selectedNode.summary && (
              <div className="p-3 rounded-lg bg-[#181c28] border border-[#252a3a] text-xs text-zinc-300 leading-relaxed">
                {selectedNode.summary}
              </div>
            )}

            {/* Trace Button */}
            {onTraceNode && (
              <button
                onClick={() => onTraceNode(selectedNode.id)}
                className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium font-mono flex items-center justify-center gap-2 transition shadow-md shadow-emerald-950/40 cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" /> Trace End-to-End Flow
              </button>
            )}

            {/* File Path & Line Range */}
            {selectedNode.filePath && (
              <div className="p-3 rounded-lg bg-[#181c28] border border-[#252a3a] space-y-1">
                <div className="text-[10px] font-mono uppercase text-zinc-500">Source File</div>
                <div className="text-xs font-mono text-zinc-200 truncate" title={selectedNode.filePath}>
                  {selectedNode.filePath}
                </div>
                {selectedNode.lineRange && (
                  <div className="text-[11px] font-mono text-zinc-400">
                    Lines {selectedNode.lineRange[0]} - {selectedNode.lineRange[1]}
                  </div>
                )}
              </div>
            )}

            {/* Connected Upstream Nodes */}
            {upstreamNodes.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono uppercase text-zinc-500 flex items-center justify-between">
                  <span>Called / Rendered By ({upstreamNodes.length})</span>
                </div>
                <div className="space-y-1">
                  {upstreamNodes.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => onSelectNode?.(u.id)}
                      className="p-2 rounded bg-[#161a26] border border-[#232838] hover:border-indigo-500/50 text-xs font-mono text-zinc-300 flex items-center justify-between cursor-pointer transition"
                    >
                      <span className="truncate">{u.name}</span>
                      <span className="text-[10px] text-zinc-500">{u.nodeType}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Connected Downstream Nodes */}
            {downstreamNodes.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono uppercase text-zinc-500 flex items-center justify-between">
                  <span>Delegates / Queries ({downstreamNodes.length})</span>
                </div>
                <div className="space-y-1">
                  {downstreamNodes.map((d) => (
                    <div
                      key={d.id}
                      onClick={() => onSelectNode?.(d.id)}
                      className="p-2 rounded bg-[#161a26] border border-[#232838] hover:border-indigo-500/50 text-xs font-mono text-zinc-300 flex items-center justify-between cursor-pointer transition"
                    >
                      <span className="truncate">{d.name}</span>
                      <span className="text-[10px] text-zinc-500">{d.nodeType}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technologies */}
            {selectedNode.technologies && selectedNode.technologies.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono uppercase text-zinc-500">Technologies & Tools</div>
                <div className="flex flex-wrap gap-1">
                  {selectedNode.technologies.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 text-xs rounded bg-[#1a1f2e] text-zinc-300 font-mono border border-[#293044]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Source Code Viewer */}
            {selectedNode.filePath && (
              <div className="space-y-1.5 pt-2 border-t border-[#222634]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-zinc-400 flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-indigo-400" /> Source Snippet
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1f2434] text-zinc-400 hover:text-zinc-200 border border-[#2a3044] flex items-center gap-1 cursor-pointer transition"
                  >
                    {copiedCode ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                    {copiedCode ? 'Copied' : 'Copy'}
                  </button>
                </div>

                <div className="p-3 rounded-lg bg-[#0b0d13] border border-[#1f2330] font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-64 leading-relaxed">
                  {isLoadingSource ? (
                    <div className="text-zinc-500 italic py-4 text-center">Loading source excerpt...</div>
                  ) : sourceCode ? (
                    <pre className="whitespace-pre">{sourceCode}</pre>
                  ) : (
                    <div className="text-zinc-500 italic">No source excerpt available.</div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* ============================================================
            Edge Details Mode
        ============================================================ */}
        {selectedEdge && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-[#181c28] border border-[#252a3a] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-zinc-500">Relationship Type</span>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-indigo-950/70 border border-indigo-800/60 text-indigo-300">
                  {selectedEdge.relationshipType}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-zinc-500">Confidence</span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-mono font-semibold border ${
                    selectedEdge.confidence === 'verified'
                      ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60'
                      : 'bg-amber-950/70 text-amber-300 border-amber-800/60'
                  }`}
                >
                  {selectedEdge.confidence === 'verified' ? 'Verified in Code' : 'Inferred by Static AST'}
                </span>
              </div>

              {selectedEdge.routePath && (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-zinc-500">Route Path</span>
                  <span className="text-xs font-mono text-zinc-200">
                    {selectedEdge.httpMethod} {selectedEdge.routePath}
                  </span>
                </div>
              )}
            </div>

            {/* Evidence Quote */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono uppercase text-zinc-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Supporting Code Evidence
              </div>
              <div className="p-3 rounded-lg bg-[#0e1017] border border-[#222634] text-xs font-mono text-zinc-300 leading-relaxed italic">
                "{selectedEdge.evidence}"
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#161a26] border border-[#242938] text-[11px] text-zinc-400 space-y-1">
              <div>
                <span className="text-zinc-500">Source Node:</span> {selectedEdge.source}
              </div>
              <div>
                <span className="text-zinc-500">Target Node:</span> {selectedEdge.target}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
