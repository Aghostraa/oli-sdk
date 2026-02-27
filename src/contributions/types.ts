export const DEFAULT_PROJECT_VERSION = 7;

export const PROJECT_URL_FIELDS = [
  'websites',
  'github',
  'npm',
  'crates',
  'pypi',
  'go',
  'open_collective',
  'defillama'
] as const;

export type ProjectUrlField = (typeof PROJECT_URL_FIELDS)[number];

export interface ProjectUrlEntry {
  url: string;
  [key: string]: unknown;
}

export interface ProjectSocialProfile {
  farcaster?: ProjectUrlEntry[];
  medium?: ProjectUrlEntry[];
  mirror?: ProjectUrlEntry[];
  telegram?: ProjectUrlEntry[];
  twitter?: ProjectUrlEntry[];
  discord?: ProjectUrlEntry[];
  [platform: string]: ProjectUrlEntry[] | undefined;
}

export interface ProjectYamlPayload {
  version: number;
  name: string;
  display_name: string;
  description?: string;
  websites?: ProjectUrlEntry[];
  social?: ProjectSocialProfile;
  github?: ProjectUrlEntry[];
  npm?: ProjectUrlEntry[];
  crates?: ProjectUrlEntry[];
  pypi?: ProjectUrlEntry[];
  go?: ProjectUrlEntry[];
  open_collective?: ProjectUrlEntry[];
  blockchain?: Array<Record<string, unknown>>;
  defillama?: ProjectUrlEntry[];
  comments?: string[];
  [key: string]: unknown;
}

export interface ProjectDraftInput {
  version?: number;
  name: string;
  displayName: string;
  description?: string;
  websites?: string[];
  social?: Record<string, string[]>;
  github?: string[];
  npm?: string[];
  crates?: string[];
  pypi?: string[];
  go?: string[];
  openCollective?: string | string[];
  blockchain?: Array<Record<string, unknown>>;
  defillama?: string[];
  comments?: string | string[];
  extra?: Record<string, unknown>;
}

export interface ProjectPatchInput {
  version?: number | null;
  displayName?: string | null;
  description?: string | null;
  websites?: string[] | null;
  social?: Record<string, string[]> | null;
  github?: string[] | null;
  npm?: string[] | null;
  crates?: string[] | null;
  pypi?: string[] | null;
  go?: string[] | null;
  openCollective?: string | string[] | null;
  blockchain?: Array<Record<string, unknown>> | null;
  defillama?: string[] | null;
  comments?: string | string[] | null;
  extra?: Record<string, unknown>;
}

export type ProjectValidationIssueCode =
  | 'required'
  | 'type'
  | 'format'
  | 'value'
  | 'duplicate';

export interface ProjectValidationIssue {
  code: ProjectValidationIssueCode;
  path: string;
  message: string;
}

export interface ProjectValidationResult {
  valid: boolean;
  issues: ProjectValidationIssue[];
}

export interface ValidateProjectPayloadOptions {
  enforceVersion?: number;
  enforceSlugPattern?: boolean;
  existingProjects?: ProjectYamlPayload[];
  currentProjectName?: string;
}

export interface GitHubTokenConfig {
  token?: string;
  getToken?: () => Promise<string>;
  userAgent?: string;
}

export interface GitHubRepositoryRef {
  owner: string;
  repo: string;
  baseBranch?: string;
}

export interface GitHubFileChangeRequest {
  upstream: GitHubRepositoryRef;
  targetOwner?: string;
  autoCreateFork?: boolean;
  branchPrefix?: string;
  sourceBaseBranch?: string;
  filePath: string;
  fileContent: string | Uint8Array;
  fileContentEncoding?: 'utf8' | 'base64';
  commitMessage: string;
  pullRequestTitle: string;
  pullRequestBody: string;
}

export interface GitHubPullRequestResult {
  pullRequestUrl: string;
  pullRequestNumber: number | null;
  branchName: string;
  filePath: string;
  head: string;
  base: string;
  targetOwner: string;
  upstreamOwner: string;
  upstreamRepo: string;
  commitSha: string | null;
}

export interface PullRequestClient {
  createOrUpdatePullRequest(
    request: GitHubFileChangeRequest
  ): Promise<GitHubPullRequestResult>;
}

export type ProjectContributionMode = 'add' | 'edit';

export interface ProjectYamlContribution {
  mode: ProjectContributionMode;
  payload: ProjectYamlPayload;
  existingProjectName?: string;
  filePath?: string;
  commitMessage?: string;
  pullRequestTitle?: string;
  pullRequestBody?: string;
}

export interface ProjectLogoContribution {
  mode?: ProjectContributionMode;
  slug?: string;
  fileBytes: Uint8Array | ArrayBuffer;
  fileName?: string;
  mimeType?: string;
  filePath?: string;
  commitMessage?: string;
  pullRequestTitle?: string;
  pullRequestBody?: string;
}

export interface ProjectContributionRepositories {
  projects: GitHubRepositoryRef;
  logos: GitHubRepositoryRef;
}

/**
 * Input for `submitProjectContribution`. Describes all parameters needed to
 * open a GitHub pull request that adds or updates an OSS Directory project entry.
 */
export interface SubmitProjectContributionInput {
  /** GitHub authentication config (personal-access token or token factory). */
  auth: GitHubTokenConfig;
  /** YAML project payload to submit (add or edit mode). */
  yaml: ProjectYamlContribution;
  /** Optional project logo to submit alongside the YAML. */
  logo?: ProjectLogoContribution;
  /**
   * Override the default target repositories.
   * Defaults to `opensource-observer/oss-directory` (YAML) and
   * `growthepie/gtp-dna` (logos).
   */
  repositories?: Partial<ProjectContributionRepositories>;
  /**
   * GitHub username/org to open the PR from (fork owner).
   * When omitted, the authenticated user's own account is used.
   */
  targetOwner?: string;
  /**
   * When `true`, automatically fork the upstream repository if the
   * authenticated user does not already have a fork.
   */
  autoCreateFork?: boolean;
  /** Branch name prefix. Defaults to `'oli-sdk/'`. */
  branchPrefix?: string;
  /**
   * When `false`, skip YAML payload validation before submission.
   * Defaults to `true`.
   */
  validateYaml?: boolean;
  /** Human-readable label included in the default PR body. */
  actorLabel?: string;
  /**
   * Existing project list used for duplicate-name validation.
   * Pass the result of `fetchProjects()` for accurate deduplication.
   */
  existingProjects?: ProjectYamlPayload[];
}

export interface SubmittedProjectYamlResult {
  filePath: string;
  yamlText: string;
  validation: ProjectValidationResult | null;
  pullRequest: GitHubPullRequestResult;
}

export interface SubmittedProjectLogoResult {
  filePath: string;
  extension: string;
  pullRequest: GitHubPullRequestResult;
}

export interface SubmitProjectContributionResult {
  yaml: SubmittedProjectYamlResult;
  logo: SubmittedProjectLogoResult | null;
}
