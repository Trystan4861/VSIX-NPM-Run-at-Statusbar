import * as vscode from 'vscode';
import { ConfigurationService } from '../configuration/configuration-service';
import { ProcessKind } from '../configuration/configuration-types';
import { ProcessManager } from '../process/process-manager';
import { getUiStrings } from './localization';
import { StatusBarFactory, StatusBarItemLike, UiProcessSnapshot } from './ui-types';

const kinds: readonly ProcessKind[] = ['backend', 'frontend'];
const startCommandIds: Record<ProcessKind, string> = {
  backend: 'vsixTerminalLauncher.startBackend',
  frontend: 'vsixTerminalLauncher.startFrontend'
};

const showCommandIds: Record<ProcessKind, string> = {
  backend: 'vsixTerminalLauncher.showBackend',
  frontend: 'vsixTerminalLauncher.showFrontend'
};

const configureCommandIds: Record<ProcessKind, string> = {
  backend: 'vsixTerminalLauncher.configureBackend',
  frontend: 'vsixTerminalLauncher.configureFrontend'
};

export class StatusBarController implements vscode.Disposable {
  private readonly items: Record<ProcessKind, StatusBarItemLike>;
  private disposed = false;

  public constructor(
    private readonly factory: StatusBarFactory,
    private readonly manager: ProcessManager,
    private readonly configuration: ConfigurationService,
    private readonly getResource: () => vscode.ConfigurationScope | undefined,
    private readonly showItems: () => boolean
  ) {
    this.items = {
      backend: factory.create(vscode.StatusBarAlignment.Left, 100),
      frontend: factory.create(vscode.StatusBarAlignment.Left, 99)
    };
    this.refresh();
  }

  public refresh(): void {
    if (this.disposed) return;
    for (const kind of kinds) {
      const snapshot = this.manager.getSnapshot(kind);
      const item = this.items[kind];
      const resource = this.getResource();
      const configured = resource !== undefined && this.configuration.hasCommand(kind, resource);
      const label = this.configuration.getLabel(kind, resource);
      const running = snapshot.state === 'running';
      const icon = configured ? (running ? '$(terminal)' : '$(play)') : '$(gear)';
      item.text = `${icon} ${label}`;
      item.command = configured ? (running ? showCommandIds[kind] : startCommandIds[kind]) : configureCommandIds[kind];
      const ui = getUiStrings(vscode.env.language);
      const tooltip = new vscode.MarkdownString();
      tooltip.isTrusted = true;
      tooltip.supportThemeIcons = true;
      tooltip.appendMarkdown(`**${label}**\n\n---\n\n`);
      if (configured && running) {
        tooltip.appendMarkdown(`$(sync) [${ui.restart}](command:${kind === 'backend' ? 'vsixTerminalLauncher.restartBackend' : 'vsixTerminalLauncher.restartFrontend'})  \n`);
      } else {
        tooltip.appendMarkdown(`$(play) [${ui.start}](command:${startCommandIds[kind]})  \n`);
      }
      tooltip.appendMarkdown(`$(settings-gear) [${ui.configure}](command:${configureCommandIds[kind]})  \n`);
      tooltip.appendMarkdown(`$(edit) [${ui.rename}](command:${kind === 'backend' ? 'vsixTerminalLauncher.renameBackend' : 'vsixTerminalLauncher.renameFrontend'})`);
      item.tooltip = tooltip;
      if (this.showItems() && resource !== undefined) item.show();
      else item.hide();
    }
  }

  public getItems(): readonly StatusBarItemLike[] {
    return kinds.map((kind) => this.items[kind]);
  }

  public getSnapshots(): readonly UiProcessSnapshot[] {
    return kinds.map((kind) => {
      const snapshot = this.manager.getSnapshot(kind);
      return {
        kind,
        label: this.configuration.getLabel(kind, this.getResource()),
        state: snapshot.state,
        configured: this.getResource() !== undefined && this.configuration.hasCommand(kind, this.getResource()),
        hasTerminal: snapshot.terminal !== undefined
      };
    });
  }

  public dispose(): void {
    this.disposed = true;
    for (const kind of kinds) this.items[kind].dispose();
  }
}

export class VsCodeStatusBarFactory implements StatusBarFactory {
  public create(alignment: vscode.StatusBarAlignment, priority: number): StatusBarItemLike {
    return vscode.window.createStatusBarItem(alignment, priority);
  }
}
