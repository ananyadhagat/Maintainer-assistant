import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Layers,
  HelpCircle,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { NodeCategory, CategoryVisibility, VisibilityMode } from './types';
import { CATEGORIES_CONFIG, CATEGORY_ICONS } from './categories';

interface LegendProps {
  visibility: CategoryVisibility;
  onToggleCategory: (category: NodeCategory) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onInvert: () => void;
  onIsolateCategory: (category: NodeCategory) => void;
  nodeCounts: Record<NodeCategory, number>;
  totalNodes: number;
  visibleNodesCount: number;
  visibilityMode: VisibilityMode;
  onChangeVisibilityMode: (mode: VisibilityMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  className?: string;
}

export function Legend({
  visibility,
  onToggleCategory,
  onSelectAll,
  onDeselectAll,
  onInvert,
  onIsolateCategory,
  nodeCounts,
  totalNodes,
  visibleNodesCount,
  visibilityMode,
  onChangeVisibilityMode,
  searchQuery,
  onSearchChange,
  className = '',
}: LegendProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const categories = Object.keys(CATEGORIES_CONFIG) as NodeCategory[];
  const activeCount = categories.filter((c) => visibility[c]).length;
  const allActive = activeCount === categories.length;
  const noneActive = activeCount === 0;

  return (
    <div
      className={`bg-[#12151d]/95 backdrop-blur-md border border-[#232736] rounded-xl shadow-2xl transition-all duration-200 select-none z-10 ${
        isCollapsed ? 'w-auto' : 'w-80 md:w-84'
      } ${className}`}
    >
      {/* Header bar */}
      <div className="p-3 border-b border-[#202433] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#1a1e2b] border border-[#2a3043] flex items-center justify-center text-indigo-400">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-zinc-100 tracking-tight">
                Architecture Legend
              </span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                  allActive
                    ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/40'
                    : noneActive
                    ? 'bg-rose-950/50 text-rose-300 border-rose-800/40'
                    : 'bg-amber-950/50 text-amber-300 border-amber-800/40'
                }`}
              >
                {visibleNodesCount}/{totalNodes} Nodes
              </span>
            </div>
            {!isCollapsed && (
              <p className="text-[10px] text-zinc-400">Toggle node categories to filter graph</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="p-1 text-zinc-400 hover:text-zinc-200 rounded hover:bg-[#1a1e29] transition"
            title="Legend tips"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-zinc-400 hover:text-zinc-200 rounded hover:bg-[#1a1e29] transition"
            title={isCollapsed ? 'Expand Legend' : 'Collapse Legend'}
          >
            {isCollapsed ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {!isCollapsed && (
        <div className="p-3 space-y-3">
          {/* Help Tooltip Box */}
          {showHelp && (
            <div className="p-2.5 rounded-lg bg-[#181d29] border border-[#2b3347] text-[11px] text-zinc-300 space-y-1">
              <div className="font-semibold text-zinc-100 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>Legend Shortcuts & Actions</span>
              </div>
              <p className="text-zinc-400 text-[10px] leading-relaxed">
                Click any category row to toggle on/off. Click <strong>Only</strong> to isolate a single layer (e.g. view only Databases or APIs). Switch between <strong>Hide</strong> and <strong>Dim</strong> to preserve graph layout.
              </p>
            </div>
          )}

          {/* Search within graph */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search nodes by title or tech..."
              className="w-full bg-[#0d0f15] border border-[#242938] focus:border-indigo-500 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-400 outline-none transition focus:ring-1 focus:ring-indigo-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 text-xs px-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Bulk Actions & Mode Selector */}
          <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-[#1e222e]">
            {/* Quick Presets */}
            <div className="flex items-center gap-1">
              <button
                onClick={onSelectAll}
                className="px-2 py-0.8 rounded text-[10px] font-medium bg-[#191d28] hover:bg-[#23293a] text-zinc-300 border border-[#282f42] transition cursor-pointer"
                title="Show all categories"
              >
                All
              </button>
              <button
                onClick={onDeselectAll}
                className="px-2 py-0.8 rounded text-[10px] font-medium bg-[#191d28] hover:bg-[#23293a] text-zinc-300 border border-[#282f42] transition cursor-pointer"
                title="Hide all categories"
              >
                None
              </button>
              <button
                onClick={onInvert}
                className="px-2 py-0.8 rounded text-[10px] font-medium bg-[#191d28] hover:bg-[#23293a] text-zinc-300 border border-[#282f42] transition cursor-pointer"
                title="Invert category selection"
              >
                Invert
              </button>
            </div>

            {/* Visibility Mode Toggle: Hide vs Dim */}
            <div className="flex items-center bg-[#0d0f15] p-0.5 rounded-md border border-[#222736]">
              <button
                onClick={() => onChangeVisibilityMode('hide')}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                  visibilityMode === 'hide'
                    ? 'bg-[#212635] text-zinc-100 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Completely remove toggled-off nodes and edges from the view"
              >
                Hide
              </button>
              <button
                onClick={() => onChangeVisibilityMode('dim')}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                  visibilityMode === 'dim'
                    ? 'bg-[#212635] text-zinc-100 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Keep nodes in position but fade them out"
              >
                Dim
              </button>
            </div>
          </div>

          {/* Interactive Category List */}
          <div className="space-y-1 pt-1">
            {categories.map((catKey) => {
              const meta = CATEGORIES_CONFIG[catKey];
              const Icon = CATEGORY_ICONS[catKey];
              const isVisible = visibility[catKey];
              const count = nodeCounts[catKey] || 0;

              return (
                <div
                  key={catKey}
                  className={`group flex items-center justify-between p-2 rounded-lg border transition-all ${
                    isVisible
                      ? 'bg-[#161a24] hover:bg-[#1b202c] border-[#252b3a]'
                      : 'bg-[#10121a]/60 hover:bg-[#141720] border-[#1b1e2a] opacity-60'
                  }`}
                >
                  {/* Left: Checkbox & Category Label */}
                  <div
                    onClick={() => onToggleCategory(catKey)}
                    className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                  >
                    {/* Toggle Icon Indicator */}
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center transition-colors"
                      style={{
                        backgroundColor: isVisible ? meta.bgColor : 'rgba(255,255,255,0.03)',
                        borderColor: isVisible ? meta.borderColor : '#282d3c',
                        borderWidth: 1,
                      }}
                    >
                      <Icon
                        className="w-3 h-3"
                        style={{ color: isVisible ? meta.color : '#64748b' }}
                      />
                    </div>

                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-medium truncate ${
                            isVisible ? 'text-zinc-200' : 'text-zinc-400 line-through'
                          }`}
                        >
                          {meta.label}
                        </span>
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: isVisible ? meta.color : '#475569',
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-zinc-400 truncate max-w-[140px]">
                        {meta.description}
                      </p>
                    </div>
                  </div>

                  {/* Right: Badge count + Solo Isolate button + Eye Toggle */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                        isVisible
                          ? meta.badgeBg
                          : 'bg-[#161922] text-zinc-400 border-[#242938]'
                      }`}
                      title={`${count} node${count === 1 ? '' : 's'} in category`}
                    >
                      {count}
                    </span>

                    {/* Solo Button on Hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onIsolateCategory(catKey);
                      }}
                      className="opacity-0 group-hover:opacity-100 px-1.5 py-0.5 rounded text-[9px] font-mono text-zinc-400 hover:text-zinc-100 hover:bg-[#232838] transition border border-transparent hover:border-[#353d52] cursor-pointer"
                      title={`Isolate only ${meta.label} nodes`}
                    >
                      Only
                    </button>

                    {/* Eye Visibility Toggle */}
                    <button
                      onClick={() => onToggleCategory(catKey)}
                      className={`p-1 rounded transition cursor-pointer ${
                        isVisible
                          ? 'text-zinc-300 hover:text-zinc-100 hover:bg-[#222838]'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1d28]'
                      }`}
                      title={isVisible ? `Hide ${meta.label}` : `Show ${meta.label}`}
                    >
                      {isVisible ? (
                        <Eye className="w-3.5 h-3.5 text-indigo-400" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Status summary */}
          <div className="pt-2 border-t border-[#1e222e] flex items-center justify-between text-[10px] text-zinc-400">
            <span>
              {activeCount === categories.length
                ? 'All categories visible'
                : `${activeCount} of ${categories.length} categories visible`}
            </span>
            {activeCount !== categories.length && (
              <button
                onClick={onSelectAll}
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-medium"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
