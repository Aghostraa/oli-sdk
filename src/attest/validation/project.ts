import type { ProjectRecord } from '../types';
import { levenshteinDistance } from './levenshtein';

const PROJECTS_URL = 'https://api.growthepie.com/v1/labels/projects.json';

let projectsCache: ProjectRecord[] = [];
let pendingProjectsFetch: Promise<ProjectRecord[]> | null = null;

function transformProjectData(data: unknown): ProjectRecord[] {
  if (
    !data ||
    typeof data !== 'object' ||
    !('data' in data) ||
    typeof (data as Record<string, unknown>).data !== 'object' ||
    (data as { data?: { data?: unknown[]; types?: string[] } }).data?.data === undefined
  ) {
    return [];
  }

  const typed = data as { data?: { data?: unknown[]; types?: string[] } };
  const rows = typed.data?.data;
  const types = typed.data?.types;

  if (!Array.isArray(rows) || !Array.isArray(types)) {
    return [];
  }

  return rows
    .filter((row): row is unknown[] => Array.isArray(row))
    .map((row) => {
      const record: Record<string, unknown> = {};
      types.forEach((type, index) => {
        if (row[index] !== null && row[index] !== undefined) {
          record[type] = row[index];
        }
      });
      return record as ProjectRecord;
    });
}

export function resetProjectsCache(): void {
  projectsCache = [];
  pendingProjectsFetch = null;
}

export async function fetchProjects(fetcher: typeof fetch = fetch): Promise<ProjectRecord[]> {
  if (projectsCache.length > 0) {
    return projectsCache;
  }

  if (pendingProjectsFetch) {
    return pendingProjectsFetch;
  }

  pendingProjectsFetch = fetcher(PROJECTS_URL)
    .then((response) => response.json())
    .then((data) => {
      projectsCache = transformProjectData(data);
      pendingProjectsFetch = null;
      return projectsCache;
    })
    .catch(() => {
      pendingProjectsFetch = null;
      return [];
    });

  return pendingProjectsFetch;
}

function normalizeUrlCandidate(url: string): string {
  try {
    const normalized = url.startsWith('http') ? url : `https://${url}`;
    const hostname = new URL(normalized).hostname;
    return hostname.replace(/^www\./, '');
  } catch {
    return url.toLowerCase().replace(/^www\./, '');
  }
}

function isSimilarValue(value1: string, value2: string, fieldType: string): boolean {
  const v1 = value1.toLowerCase().trim();
  const v2 = value2.toLowerCase().trim();
  if (!v1 || !v2) return false;
  if (v1 === v2) return true;

  if (fieldType === 'website' || fieldType === 'github') {
    const d1 = normalizeUrlCandidate(v1);
    const d2 = normalizeUrlCandidate(v2);
    if (d1 === d2) return true;

    const t1 = d1.split('.').slice(0, -1).join('.');
    const t2 = d2.split('.').slice(0, -1).join('.');
    if (t1 && t2 && t1 === t2) return true;
  }

  if (fieldType === 'name' || fieldType === 'display_name') {
    if (v1.includes(v2) || v2.includes(v1)) {
      const ratio = Math.min(v1.length, v2.length) / Math.max(v1.length, v2.length);
      if (ratio > 0.8) {
        return true;
      }
    }

    const tokenize = (value: string) => value.split(/[^a-z0-9]+/).filter((token) => token.length > 0);
    const tokens1 = tokenize(v1);
    const tokens2 = tokenize(v2);
    const common = tokens1.filter((token) => tokens2.includes(token));
    if (common.length > 0 && common.length >= Math.min(tokens1.length, tokens2.length) * 0.7) {
      return true;
    }
  }

  return false;
}

function suggestSimilarProjects(value: string, projects: ProjectRecord[]): ProjectRecord[] {
  const normalized = value.toLowerCase().trim();
  if (!normalized) return [];

  return projects
    .filter((project) => {
      const owner = typeof project.owner_project === 'string' ? project.owner_project : '';
      const display = typeof project.display_name === 'string' ? project.display_name : '';
      return isSimilarValue(owner, normalized, 'name') || isSimilarValue(display, normalized, 'display_name');
    })
    .slice(0, 3);
}

export function getSmartProjectSuggestions(value: string, projects: ProjectRecord[]): string[] {
  if (!value || projects.length === 0) {
    return [];
  }

  const normalized = value.toLowerCase().trim();
  const suggestions: { project: string; score: number }[] = [];

  projects.forEach((project) => {
    if (!project.owner_project || typeof project.owner_project !== 'string') {
      return;
    }

    const owner = project.owner_project.toLowerCase();
    const display = typeof project.display_name === 'string' ? project.display_name.toLowerCase() : '';
    let score = 0;

    if (owner === normalized || display === normalized) {
      score = 100;
    } else if (owner.includes(normalized) || normalized.includes(owner)) {
      const ratio = Math.min(owner.length, normalized.length) / Math.max(owner.length, normalized.length);
      if (ratio > 0.5) {
        score = 80 + ratio * 20;
      }
    } else if (display && (display.includes(normalized) || normalized.includes(display))) {
      const ratio = Math.min(display.length, normalized.length) / Math.max(display.length, normalized.length);
      if (ratio > 0.5) {
        score = 70 + ratio * 20;
      }
    } else {
      const ownerDistance = levenshteinDistance(normalized, owner);
      const ownerSimilarity = 1 - ownerDistance / Math.max(normalized.length, owner.length);
      if (ownerSimilarity > 0.6) {
        score = ownerSimilarity * 80;
      }

      if (display) {
        const displayDistance = levenshteinDistance(normalized, display);
        const displaySimilarity = 1 - displayDistance / Math.max(normalized.length, display.length);
        if (displaySimilarity > 0.6) {
          score = Math.max(score, displaySimilarity * 70);
        }
      }
    }

    if (score > 40) {
      suggestions.push({ project: project.owner_project, score });
    }
  });

  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((entry) => entry.project);
}

export function getProjectValidation(value: string, projects: ProjectRecord[]): {
  valid: boolean;
  suggestions: string[];
  similarProjects: string[];
} {
  if (!value) {
    return { valid: true, suggestions: [], similarProjects: [] };
  }

  const validIds = new Set(projects.map((project) => project.owner_project).filter(Boolean));
  if (validIds.has(value)) {
    return { valid: true, suggestions: [], similarProjects: [] };
  }

  const smartSuggestions = getSmartProjectSuggestions(value, projects);
  if (smartSuggestions.length > 0) {
    const suggestionsSet = new Set(smartSuggestions);
    const similarProjects = projects
      .filter((project) => project.owner_project && suggestionsSet.has(project.owner_project))
      .map((project) => project.display_name || project.owner_project)
      .filter((name): name is string => typeof name === 'string');

    return {
      valid: false,
      suggestions: smartSuggestions,
      similarProjects
    };
  }

  const similar = suggestSimilarProjects(value, projects);
  return {
    valid: false,
    suggestions: similar
      .map((project) => project.owner_project)
      .filter((project): project is string => typeof project === 'string'),
    similarProjects: similar
      .map((project) => project.display_name || project.owner_project)
      .filter((name): name is string => typeof name === 'string')
  };
}

export async function resolveProjectsList(options: {
  projects?: ProjectRecord[];
  fetchProjects?: () => Promise<ProjectRecord[]>;
} = {}): Promise<ProjectRecord[]> {
  if (Array.isArray(options.projects)) {
    return options.projects;
  }

  if (typeof options.fetchProjects === 'function') {
    try {
      return await options.fetchProjects();
    } catch {
      return [];
    }
  }

  return fetchProjects();
}
