import * as vscode from 'vscode';
import { ProcessKind } from '../configuration/configuration-types';

export type ProcessState = 'stopped' | 'starting' | 'running';

export interface ManagedProcessSnapshot {
  readonly kind: ProcessKind;
  readonly state: ProcessState;
  readonly terminal?: TerminalHandle;
  readonly workspaceFolder?: vscode.WorkspaceFolder;
  readonly workingDirectory?: vscode.Uri;
}

export interface TerminalHandle {
  readonly name: string;
  sendText(text: string, addNewLine?: boolean): void;
  show(preserveFocus?: boolean): void;
  dispose(): void;
}

export interface TerminalFactory {
  create(name: string, cwd: vscode.Uri): TerminalHandle;
  onDidClose(listener: (terminal: TerminalHandle) => void): vscode.Disposable;
  onDidEndShellExecution(listener: (terminal: TerminalHandle, exitCode: number | undefined) => void): vscode.Disposable;
}

export interface ProcessManagerDependencies {
  readonly getConfiguration: (kind: ProcessKind, resource?: vscode.ConfigurationScope) => { command: string; workingDirectory: string };
  readonly selectFolder: () => Promise<vscode.WorkspaceFolder>;
  readonly resolveWorkingDirectory: (folder: vscode.WorkspaceFolder, cwd: string) => Promise<vscode.Uri>;
  readonly terminalFactory: TerminalFactory;
  readonly reportError: (message: string) => Thenable<string | undefined>;
  readonly locale?: string;
  readonly reportInfo?: (message: string) => Thenable<string | undefined>;
}

export class ProcessLifecycleError extends Error {
  public constructor(
    public readonly code: 'missing-command' | 'start-failed' | 'workspace-failed',
    message: string
  ) {
    super(message);
    this.name = 'ProcessLifecycleError';
  }
}
