import * as vscode from 'vscode';
import { TerminalFactory, TerminalHandle } from './process-types';

class VsCodeTerminalHandle implements TerminalHandle {
  public constructor(private readonly terminal: vscode.Terminal) {}

  public get name(): string {
    return this.terminal.name;
  }

  public sendText(text: string, addNewLine = true): void {
    this.terminal.sendText(text, addNewLine);
  }

  public show(preserveFocus = false): void {
    this.terminal.show(preserveFocus);
  }

  public dispose(): void {
    this.terminal.dispose();
  }

  public matches(terminal: vscode.Terminal): boolean {
    return this.terminal === terminal;
  }
}

export class VsCodeTerminalFactory implements TerminalFactory {
  private readonly handles = new Set<VsCodeTerminalHandle>();

  public create(name: string, cwd: vscode.Uri): TerminalHandle {
    const handle = new VsCodeTerminalHandle(vscode.window.createTerminal({ name, cwd }));
    this.handles.add(handle);
    return handle;
  }

  public findExisting(name: string): TerminalHandle | undefined {
    const terminal = vscode.window.terminals.find((candidate) => candidate.name === name);
    if (!terminal) return undefined;
    const existingHandle = [...this.handles].find((handle) => handle.matches(terminal));
    if (existingHandle) return existingHandle;
    const handle = new VsCodeTerminalHandle(terminal);
    this.handles.add(handle);
    return handle;
  }

  public onDidClose(listener: (terminal: TerminalHandle) => void): vscode.Disposable {
    return vscode.window.onDidCloseTerminal((terminal) => {
      for (const handle of this.handles) {
        if (handle.matches(terminal)) {
          listener(handle);
          this.handles.delete(handle);
          break;
        }
      }
    });
  }

  public onDidEndShellExecution(listener: (terminal: TerminalHandle, exitCode: number | undefined) => void): vscode.Disposable {
    return vscode.window.onDidEndTerminalShellExecution((event) => {
      for (const handle of this.handles) {
        if (handle.matches(event.terminal)) {
          listener(handle, event.exitCode);
          break;
        }
      }
    });
  }
}
