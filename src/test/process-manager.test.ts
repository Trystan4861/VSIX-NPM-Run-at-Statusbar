import * as assert from 'node:assert/strict';
import * as vscode from 'vscode';
import { ProcessManager } from '../process/process-manager';
import { ProcessKind } from '../configuration/configuration-types';
import { TerminalFactory, TerminalHandle } from '../process/process-types';

class FakeTerminal implements TerminalHandle {
  public readonly sent: string[] = [];
  public shown = 0;
  public disposed = 0;
  public constructor(public readonly name: string) {}
  public sendText(text: string): void { this.sent.push(text); }
  public show(): void { this.shown += 1; }
  public dispose(): void { this.disposed += 1; }
}

class FakeFactory implements TerminalFactory {
  public readonly terminals: FakeTerminal[] = [];
  public existing?: FakeTerminal;
  private closeListener?: (terminal: TerminalHandle) => void;
  private executionListener?: (terminal: TerminalHandle, exitCode: number | undefined) => void;
  public create(name: string): TerminalHandle {
    const terminal = new FakeTerminal(name);
    this.terminals.push(terminal);
    return terminal;
  }
  public findExisting(name: string): TerminalHandle | undefined {
    return this.existing?.name === name ? this.existing : undefined;
  }
  public onDidClose(listener: (terminal: TerminalHandle) => void): vscode.Disposable {
    this.closeListener = listener;
    return { dispose: () => { this.closeListener = undefined; } };
  }
  public onDidEndShellExecution(listener: (terminal: TerminalHandle, exitCode: number | undefined) => void): vscode.Disposable {
    this.executionListener = listener;
    return { dispose: () => { this.executionListener = undefined; } };
  }
  public close(terminal: TerminalHandle): void { this.closeListener?.(terminal); }
  public endExecution(terminal: TerminalHandle, exitCode: number): void { this.executionListener?.(terminal, exitCode); }
}

function folder(): vscode.WorkspaceFolder {
  return { name: 'workspace', index: 0, uri: vscode.Uri.file('C:/workspace') };
}

export async function runProcessManagerTests(): Promise<void> {
  const factory = new FakeFactory();
  const values: Record<ProcessKind, { command: string; workingDirectory: string }> = {
    backend: { command: 'npm run backend', workingDirectory: '' },
    frontend: { command: 'npm run frontend', workingDirectory: '' }
  };
  const errors: string[] = [];
  const manager = new ProcessManager({
    getConfiguration: (kind) => values[kind],
    selectFolder: async () => folder(),
    resolveWorkingDirectory: async (_folder, cwd) => vscode.Uri.file(`C:/workspace/${cwd || '.'}`),
    terminalFactory: factory,
    reportError: async (message) => { errors.push(message); return undefined; },
    locale: 'es-ES'
  });
  await Promise.all([manager.start('backend'), manager.start('backend')]);
  await manager.start('frontend');
  factory.endExecution(factory.terminals[1], 1);
  assert.equal(manager.getSnapshot('frontend').state, 'stopped');
  assert.deepEqual(errors, ['El comando Frontend ha fallado.']);
  assert.deepEqual(factory.terminals.map((terminal) => terminal.name), ['Backend', 'Frontend']);
  assert.deepEqual(factory.terminals.map((terminal) => terminal.sent), [['npm run backend'], ['npm run frontend']]);
  manager.stop('backend');
  assert.equal(manager.getSnapshot('backend').state, 'stopped');
  assert.equal(factory.terminals[0].disposed, 1);
  await manager.restart('backend');
  assert.equal(factory.terminals.length, 3);
  factory.close(factory.terminals[1]);
  assert.equal(manager.getSnapshot('frontend').state, 'stopped');
  values.frontend.command = '   ';
  await assert.rejects(() => manager.start('frontend'), /Configure the Frontend command/);

  const existingFactory = new FakeFactory();
  existingFactory.existing = new FakeTerminal('Backend');
  const reuseManager = new ProcessManager({
    getConfiguration: (kind) => values[kind],
    selectFolder: async () => folder(),
    resolveWorkingDirectory: async (_folder, cwd) => vscode.Uri.file(`C:/workspace/${cwd || '.'}`),
    terminalFactory: existingFactory,
    reportError: async () => undefined,
    confirmReuseTerminal: async () => true
  });
  await reuseManager.start('backend');
  assert.equal(existingFactory.terminals.length, 0);
  assert.deepEqual(existingFactory.existing.sent, ['npm run backend']);
}
