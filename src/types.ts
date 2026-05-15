export interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
}

export interface SessionInfo {
  id: string;
  code: string;
  files: FileInfo[];
  expiresAt: number;
}
