import React, { useEffect, useRef } from 'react';
import {
  CheckCircle2,
  Loader2,
  Circle,
  AlertTriangle,
  Terminal,
  Clock,
  X,
  Sparkles,
} from 'lucide-react';
import { StreamStage, StreamStageId, StreamLog } from '../../types';

interface StreamProgressModalProps {
  isOpen: boolean;
  repoSlug: string;
  percent: number;
  stages: StreamStage[];
  logs: StreamLog[];
  elapsedSeconds: number;
  onCancel: () => void;
  error?: string | null;
}

export function StreamProgressModal({
  isOpen,
  repoSlug,
  percent,
  stages,
  logs,
  elapsedSeconds,
  onCancel,
  error,
}: StreamProgressModalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  if (!isOpen) return null;

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-indigo-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="text-[11px] font-mono text-indigo-300 uppercase tracking-wider font-semibold">
                Live SSE Stream
              </div>
              <h3 className="text-sm font-bold text-white">
                Analyzing <span className="text-indigo-400 font-mono">{repoSlug}</span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatElapsed(elapsedSeconds)}</span>
            </div>

            <button
              onClick={onCancel}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Cancel Analysis"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-1.5">
            <span className="font-medium">Live Pipeline Progress</span>
            <span className="font-bold text-indigo-400">{percent}%</span>
          </div>
          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Stage Checklist */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {stages.map((stage) => {
            const isCompleted = stage.status === 'completed';
            const isInProgress = stage.status === 'in_progress';
            const isFailed = stage.status === 'failed';

            return (
              <div
                key={stage.id}
                className={`p-2.5 rounded-xl border text-xs flex items-center gap-2.5 transition ${
                  isInProgress
                    ? 'bg-indigo-950/40 border-indigo-500/50 text-white shadow-sm'
                    : isCompleted
                    ? 'bg-slate-950/40 border-slate-800 text-slate-200'
                    : isFailed
                    ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                    : 'bg-slate-950/20 border-slate-800/40 text-slate-400'
                }`}
              >
                <div className="shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isInProgress ? (
                    <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                  ) : isFailed ? (
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-400" />
                  )}
                </div>

                <div className="truncate">
                  <div className="font-medium truncate">{stage.label}</div>
                  {stage.detail && (
                    <div className="text-[10px] text-slate-400 font-mono truncate">{stage.detail}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Terminal Log Stream */}
        <div className="px-6 pb-6 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Real-Time Event Stream</span>
            </span>
            <span className="text-[10px] text-slate-400 lowercase">{logs.length} events</span>
          </div>

          <div
            ref={terminalRef}
            className="h-36 bg-slate-950 border border-slate-800 rounded-xl p-3 overflow-y-auto font-mono text-xs space-y-1.5 select-text"
          >
            {logs.length === 0 ? (
              <div className="text-slate-400 italic">Connecting to stream...</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-slate-400 shrink-0 text-[10px]">{log.timestamp}</span>
                  <span
                    className={`px-1 py-0.2 rounded text-[10px] font-semibold uppercase shrink-0 ${
                      log.type === 'success'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : log.type === 'error'
                        ? 'bg-rose-500/20 text-rose-300'
                        : log.type === 'warn'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-indigo-500/20 text-indigo-300'
                    }`}
                  >
                    {log.type}
                  </span>
                  <span className="text-slate-300 break-words flex-1 text-[11px]">{log.text}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {error && (
          <div className="mx-6 mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={onCancel}
              className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-medium cursor-pointer"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
