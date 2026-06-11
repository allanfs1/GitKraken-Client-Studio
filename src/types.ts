export interface Commit {
  sha: string;
  parents: string[];
  message: string;
  author: string;
  email: string;
  date: string;
  branch: string; // The branch where this commit resides
  isMerge?: boolean;
  avatarUrl?: string;
  pushed?: boolean; // Indicates if the commit has been pushed to remote
  // Files changed and their diffs
  changes?: {
    filepath: string;
    status: "modified" | "added" | "deleted";
    diff: string;
  }[];
}

export interface FileState {
  filepath: string;
  status: "modified" | "added" | "deleted" | "conflict";
  content: string; // Current content in workspace
  originalContent: string; // Previous head content
  diff: string; // Precalculated unified diff
  // If in conflict state:
  conflict?: {
    ours: string;
    theirs: string;
    resolved: boolean;
    result?: string;
  };
}

export interface Stash {
  id: string;
  message: string;
  files: {
    filepath: string;
    content: string;
    status: "modified" | "added" | "deleted";
  }[];
}

export interface GitRepository {
  id: string;
  name: string;
  description: string;
  activeBranch: string;
  branches: string[];
  tags: { name: string; sha: string }[];
  commits: Commit[];
  unstagedFiles: FileState[];
  stagedFiles: FileState[];
  stashes: Stash[];
}

export interface AppState {
  hasOAuthKeys: boolean;
  connected: boolean;
  user: {
    login: string;
    id: number;
    avatar_url: string;
    html_url: string;
    name: string;
  } | null;
  connectedRepo: {
    id: number;
    name: string;
    full_name: string;
    html_url: string;
    description: string;
    language: string;
    stars: number;
    branch: string;
  } | null;
  deployments: any[];
  webhooks: any[];
  redirectUri: string;
}
