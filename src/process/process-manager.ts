import * as vscode from 'vscode';
import { ProcessKind, processLabels } from '../configuration/configuration-types';
import { getCommandFailedMessage } from '../ui/localization';
import { ManagedProcessSnapshot, ProcessLifecycleError, ProcessManagerDependencies, ProcessState, TerminalHandle } from './process-types';

interface ManagedEntry {
  state: ProcessState;
  terminal?: TerminalHandle;
  workspaceFolder?: vscode.WorkspaceFolder;
  workingDirectory?: vscode.Uri;
  startPromise?: Promise<void>;
}

const kinds: readonly ProcessKind[] = ['backend', 'frontend'];

export class ProcessManager {
  private readonly entries: Record<ProcessKind, ManagedEntry> = {
    backend: { state: 'stopped' },
    frontend: { state: 'stopped' }
  };
  private readonly listeners = new Set<() => void>();

  public constructor(private readonly dependencies: ProcessManagerDependencies) {}

  public onDidChange(listener: () => void): vscode.Disposable {
    this.listeners.add(listener);
    return { dispose: () => this.listeners.delete(listener) };
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }

  public getSnapshot(kind: ProcessKind): ManagedProcessSnapshot {
    const entry = this.entries[kind];
    return { kind, state: entry.state, terminal: entry.terminal, workspaceFolder: entry.workspaceFolder, workingDirectory: entry.workingDirectory };
  }

  public getSnapshots(): readonly ManagedProcessSnapshot[] {
    return kinds.map((kind) => this.getSnapshot(kind));
  }

  public async start(kind: ProcessKind): Promise<void> {
    const entry = this.entries[kind];
    if (entry.state === 'running' && entry.terminal) {
      entry.terminal.show();
      return;
    }
    if (entry.startPromise) {
      return entry.startPromise;
    }
    entry.startPromise = this.startInternal(kind).finally(() => {
      entry.startPromise = undefined;
      this.notify();
    });
    return entry.startPromise;
  }

  private async startInternal(kind: ProcessKind): Promise<void> {
    const entry = this.entries[kind];
    const label = processLabels[kind];
    entry.state = 'starting';
    this.notify();
    let terminal: TerminalHandle | undefined;
    try {
      const folder = await this.dependencies.selectFolder();
      const configuration = this.dependencies.getConfiguration(kind, folder.uri);
      if (configuration.command.trim().length === 0) {
        throw new ProcessLifecycleError('missing-command', `Configure the ${label} command before starting it.`);
      }
      const cwd = await this.dependencies.resolveWorkingDirectory(folder, configuration.workingDirectory);
      const existingTerminal = this.dependencies.terminalFactory.findExisting(label);
      const reuseExisting = existingTerminal && this.dependencies.confirmReuseTerminal
        ? await this.dependencies.confirmReuseTerminal(label)
        : false;
      const selectedTerminal = reuseExisting && existingTerminal
        ? existingTerminal
        : this.dependencies.terminalFactory.create(label, cwd);
      terminal = selectedTerminal;
      if (!terminal) throw new Error('No terminal was selected.');
      terminal.sendText(configuration.command, true);
      entry.terminal = selectedTerminal;
      entry.workspaceFolder = folder;
      entry.workingDirectory = cwd;
      entry.state = 'running';
      terminal.show();
      this.notify();
    } catch (error) {
      terminal?.dispose();
      entry.terminal = undefined;
      entry.workspaceFolder = undefined;
      entry.workingDirectory = undefined;
      entry.state = 'stopped';
      this.notify();
      if (error instanceof ProcessLifecycleError) {
        throw error;
      }
      const detail = error instanceof Error ? ` ${error.message}` : '';
      throw new ProcessLifecycleError('start-failed', `${label} could not be started.${detail}`);
    }
  }

  public show(kind: ProcessKind): void {
    this.entries[kind].terminal?.show();
  }

  public stop(kind: ProcessKind): void {
    const entry = this.entries[kind];
    const terminal = entry.terminal;
    entry.terminal = undefined;
    entry.workspaceFolder = undefined;
    entry.workingDirectory = undefined;
    entry.state = 'stopped';
    terminal?.dispose();
    this.notify();
  }

  public async restart(kind: ProcessKind): Promise<void> {
    this.stop(kind);
    await this.start(kind);
  }

  public handleClosedTerminal(terminal: TerminalHandle): void {
    for (const kind of kinds) {
      const entry = this.entries[kind];
      if (entry.terminal === terminal) {
        entry.terminal = undefined;
        entry.workspaceFolder = undefined;
        entry.workingDirectory = undefined;
        entry.state = 'stopped';
        this.notify();
      }
    }
  }

  public handleShellExecutionEnded(terminal: TerminalHandle, exitCode: number | undefined): void {
    for (const kind of kinds) {
      const entry = this.entries[kind];
      if (entry.terminal !== terminal || entry.state !== 'running') continue;
      this.stop(kind);
      if (exitCode !== undefined && exitCode !== 0) {
        void this.dependencies.reportError(getCommandFailedMessage(kind, this.dependencies.locale ?? 'en'));
      }
    }
  }

  public dispose(): void {
    for (const kind of kinds) {
      this.stop(kind);
    }
  }
}
