export type CmdResponse = {
  stdout: string;
  stderr: string;
};

export type ContainerInfo = {
  Command: string;
  CreatedAt: string;
  ID: string;
  Image: string;
  Labels: string;
  LocalVolumes: string;
  Mounts: string;
  Names: string;
  Networks: string;
  Ports: string;
  RunningFor: string;
  Size: string;
  State: string;
  Status: string;
};

export type Violation = {
  rule: string;
  package: string;
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


