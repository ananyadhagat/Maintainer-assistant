import React from 'react';

export type NodeCategory =
  | 'database'
  | 'api'
  | 'controller'
  | 'service'
  | 'queue'
  | 'client';

export interface CategoryMeta {
  id: NodeCategory;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  badgeBg: string;
  iconName: string;
}

export interface ArchitectureNodeData {
  title: string;
  category: NodeCategory;
  tech: string;
  endpoint?: string;
  description?: string;
  status: 'healthy' | 'warning' | 'degraded';
  metrics?: {
    latency?: string;
    rps?: string;
    uptime?: string;
    connections?: number;
  };
  tags?: string[];
  [key: string]: unknown;
}

export type CategoryVisibility = Record<NodeCategory, boolean>;

export type VisibilityMode = 'hide' | 'dim';

export interface ArchitecturePreset {
  id: string;
  name: string;
  description: string;
  nodeCount: number;
}
