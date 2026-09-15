import * as vscode from 'vscode';

export type ProcessKind = 'backend' | 'frontend';

export const processLabels: Record<ProcessKind, string> = {
  backend: 'Backend',
  frontend: 'Frontend'
};

export const settingKeys: Record<ProcessKind, { command: string; cwd: string; label: string }> = {
  backend: {
    command: 'backendCommand',
    cwd: 'backendCwd',
    label: 'backendLabel'
  },
  frontend: {
    command: 'frontendCommand',
    cwd: 'frontendCwd',
    label: 'frontendLabel'
  }
};

export interface ProcessConfiguration {
  readonly kind: ProcessKind;
  readonly command: string;
  readonly workingDirectory: string;
}

export interface ConfigurationReader {
  get<T>(key: string, defaultValue: T): T;
}

export interface ConfigurationWriter {
  update(key: string, value: unknown, target: vscode.ConfigurationTarget): Thenable<void>;
}

export interface InputBoxService {
  showInputBox(options: vscode.InputBoxOptions): Thenable<string | undefined>;
}

export interface QuickPickService {
  showQuickPick<T extends vscode.QuickPickItem>(items: readonly T[], options?: vscode.QuickPickOptions): Thenable<T | undefined>;
}

export interface ConfigurationServiceDependencies {
  readonly getConfiguration: (resource?: vscode.ConfigurationScope) => ConfigurationReader & ConfigurationWriter;
  readonly input: InputBoxService;
  readonly quickPick: QuickPickService;
  readonly inform: (message: string) => Thenable<string | undefined>;
}
