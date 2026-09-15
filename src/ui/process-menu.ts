import * as vscode from 'vscode';
import { ConfigurationService } from '../configuration/configuration-service';
import { ProcessKind, processLabels } from '../configuration/configuration-types';
import { ProcessManager } from '../process/process-manager';

interface MenuAction extends vscode.QuickPickItem {
  processKind: ProcessKind;
  action: 'start' | 'stop' | 'restart' | 'show' | 'configure' | 'rename';
}

const actionIcons: Record<MenuAction['action'], string> = {
  start: '$(play)',
  stop: '$(debug-stop)',
  restart: '$(sync)',
  show: '$(terminal)',
  configure: '$(settings-gear)',
  rename: '$(edit)'
};

export class ProcessMenu {
  public constructor(
    private readonly manager: ProcessManager,
    private readonly configuration: ConfigurationService,
    private readonly getResource: () => vscode.ConfigurationScope | undefined,
    private readonly pick: (items: readonly MenuAction[]) => Thenable<MenuAction | undefined>,
    private readonly reportError: (message: string) => Thenable<string | undefined>
  ) {}

  public async show(): Promise<void> {
    const items: MenuAction[] = [];
    for (const kind of ['backend', 'frontend'] as const) {
      const snapshot = this.manager.getSnapshot(kind);
      const label = processLabels[kind];
      if (snapshot.state !== 'running') items.push({ label: `${actionIcons.start}  Start ${label}`, processKind: kind, action: 'start' });
      if (snapshot.state === 'running') {
        items.push({ label: `${actionIcons.stop}  Stop ${label}`, processKind: kind, action: 'stop' });
        items.push({ label: `${actionIcons.restart}  Restart ${label}`, processKind: kind, action: 'restart' });
        items.push({ label: `${actionIcons.show}  Show ${label} terminal`, processKind: kind, action: 'show' });
      }
      items.push({ label: `${actionIcons.configure}  Configure ${label} command`, processKind: kind, action: 'configure' });
      items.push({ label: `${actionIcons.rename}  Rename ${label} button`, processKind: kind, action: 'rename' });
    }
    const selected = await this.pick(items);
    if (!selected) return;
    try {
      if (selected.action === 'start') await this.manager.start(selected.processKind);
      else if (selected.action === 'stop') this.manager.stop(selected.processKind);
      else if (selected.action === 'restart') await this.manager.restart(selected.processKind);
      else if (selected.action === 'show') this.manager.show(selected.processKind);
      else if (selected.action === 'configure') await this.configuration.configureCommand(selected.processKind, this.getResource());
      else await this.configuration.configureLabel(selected.processKind, this.getResource());
    } catch (error) {
      await this.reportError(error instanceof Error ? error.message : 'Process operation failed.');
    }
  }
}

export function createVsCodeProcessMenu(
  manager: ProcessManager,
  configuration: ConfigurationService,
  getResource: () => vscode.ConfigurationScope | undefined
): ProcessMenu {
  return new ProcessMenu(
    manager,
    configuration,
    getResource,
    (items) => vscode.window.showQuickPick(items).then((selected) => selected as MenuAction | undefined),
    (message) => vscode.window.showErrorMessage(message)
  );
}
