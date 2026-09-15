import * as vscode from 'vscode';

export class WorkspaceResolutionError extends Error {
  public constructor(public readonly code: 'no-workspace' | 'selection-cancelled' | 'invalid-cwd' | 'missing-directory' | 'not-directory', message: string) {
    super(message);
    this.name = 'WorkspaceResolutionError';
  }
}

export interface WorkspaceSelectionService {
  chooseFolder(folders: readonly vscode.WorkspaceFolder[]): Thenable<vscode.WorkspaceFolder | undefined>;
}

export interface WorkspaceFileSystem {
  stat(uri: vscode.Uri): Thenable<vscode.FileStat>;
}
