export type CmdResponse = {
  status: number | null;
  stdout: string;
  stderr: string;
};
export type Violation = {
  rule: string;
  packageName: string;
  license: string;
  licenseSource: string;
  severity: string;
  message: string;
};

export type TaskStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Failed';

export type Task = {
  id: number;
  name: string;
  status: TaskStatus;
};

export type ScanLog = {
  messages: Task[];
  violations: Violation[];
};

export type ScanProjectOptions = {
  projectPath: string;
  projectConfigPath: string;
  projectResultsPath?: string;
};

export type ScanGitProjectOptions = {
  projectUrl: string;
  projectConfigUrl: string;
  projectBranch?: string;
  projectConfigBranch?: string;
  projectConfigFolder?: string;
  projectResultsPath?: string;
  enableLongPath?: boolean;
};

export type ScanPackageOptions = {
  packageName: string;
  packageVersion: string;
  ortConfigRepoUrl: string;
};

export const isScanPackageOptions = (options: any): options is ScanPackageOptions => {
  return options.packageName && options.packageVersion && options.ortConfigRepoUrl;
};

export const isScanProjectOptions = (options: any): options is ScanProjectOptions => {
  return options.projectPath && options.projectConfigPath;
};
