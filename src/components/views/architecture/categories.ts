import {
  Database,
  Globe,
  Sliders,
  Cpu,
  Layers,
  Monitor,
  LucideIcon,
} from 'lucide-react';
import { CategoryMeta, NodeCategory } from './types';

export const CATEGORIES_CONFIG: Record<NodeCategory, CategoryMeta> = {
  database: {
    id: 'database',
    label: 'Database',
    description: 'Persistent relational, document, and vector datastores',
    color: '#10b981', // emerald-500
    bgColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    textColor: '#34d399',
    badgeBg: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50',
    iconName: 'Database',
  },
  api: {
    id: 'api',
    label: 'API',
    description: 'REST gateways, GraphQL endpoints, and external webhook routers',
    color: '#f59e0b', // amber-500
    bgColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    textColor: '#fbbf24',
    badgeBg: 'bg-amber-950/60 text-amber-300 border-amber-800/50',
    iconName: 'Globe',
  },
  controller: {
    id: 'controller',
    label: 'Controller',
    description: 'Business logic orchestrators, auth handlers, and triage dispatchers',
    color: '#6366f1', // indigo-500
    bgColor: 'rgba(99, 102, 241, 0.1)',
    borderColor: 'rgba(99, 102, 241, 0.4)',
    textColor: '#818cf8',
    badgeBg: 'bg-indigo-950/60 text-indigo-300 border-indigo-800/50',
    iconName: 'Sliders',
  },
  service: {
    id: 'service',
    label: 'Service',
    description: 'Background workers, Gemini LLM agents, and code analysis engines',
    color: '#a855f7', // purple-500
    bgColor: 'rgba(168, 85, 247, 0.1)',
    borderColor: 'rgba(168, 85, 247, 0.4)',
    textColor: '#c084fc',
    badgeBg: 'bg-purple-950/60 text-purple-300 border-purple-800/50',
    iconName: 'Cpu',
  },
  queue: {
    id: 'queue',
    label: 'Queue / Cache',
    description: 'In-memory pub/sub queues, rate limiters, and fast key-value caches',
    color: '#f43f5e', // rose-500
    bgColor: 'rgba(244, 63, 94, 0.1)',
    borderColor: 'rgba(244, 63, 94, 0.4)',
    textColor: '#fb7185',
    badgeBg: 'bg-rose-950/60 text-rose-300 border-rose-800/50',
    iconName: 'Layers',
  },
  client: {
    id: 'client',
    label: 'Client',
    description: 'User-facing browser dashboards, GitHub Action runners, and CLIs',
    color: '#38bdf8', // sky-400
    bgColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: 'rgba(56, 189, 248, 0.4)',
    textColor: '#38bdf8',
    badgeBg: 'bg-sky-950/60 text-sky-300 border-sky-800/50',
    iconName: 'Monitor',
  },
};

export const CATEGORY_ICONS: Record<NodeCategory, LucideIcon> = {
  database: Database,
  api: Globe,
  controller: Sliders,
  service: Cpu,
  queue: Layers,
  client: Monitor,
};

export const DEFAULT_CATEGORY_VISIBILITY: Record<NodeCategory, boolean> = {
  database: true,
  api: true,
  controller: true,
  service: true,
  queue: true,
  client: true,
};
