import * as vscode from 'vscode';
import {
  ConfigurationServiceDependencies,
  ProcessConfiguration,
  ProcessKind,
  processLabels,
  settingKeys
} from './configuration-types';

export class ConfigurationService {
  public constructor(private readonly dependencies: ConfigurationServiceDependencies) {}

  public getCommand(kind: ProcessKind, resource?: vscode.ConfigurationScope): string {
    const key = settingKeys[kind].command;
    return this.dependencies.getConfiguration(resource).get<string>(key, '');
  }

  public getWorkingDirectory(kind: ProcessKind, resource?: vscode.ConfigurationScope): string {
    const key = settingKeys[kind].cwd;
    return this.dependencies.getConfiguration(resource).get<string>(key, '');
  }

  public getConfiguration(kind: ProcessKind, resource?: vscode.ConfigurationScope): ProcessConfiguration {
    return {
      kind,
      command: this.getCommand(kind, resource),
      workingDirectory: this.getWorkingDirectory(kind, resource)
    };
  }

  public hasCommand(kind: ProcessKind, resource?: vscode.ConfigurationScope): boolean {
    return this.getCommand(kind, resource).trim().length > 0;
  }

  public getLabel(kind: ProcessKind, resource?: vscode.ConfigurationScope): string {
    const configured = this.dependencies.getConfiguration(resource).get<string>(settingKeys[kind].label, '');
    return configured.trim() || processLabels[kind];
  }

  public async configureLabel(kind: ProcessKind, resource?: vscode.ConfigurationScope): Promise<boolean> {
    const label = processLabels[kind];
    const current = this.getLabel(kind, resource);
    const value = await this.dependencies.input.showInputBox({
      prompt: `Label for ${label}`,
      value: current,
      placeHolder: `Enter up to 10 characters for ${label}`,
      validateInput: (input) => {
        const normalized = input.trim();
        if (normalized.length === 0) return 'The label cannot be empty.';
        if (normalized.length > 10) return 'The label must be 10 characters or fewer.';
        return undefined;
      }
    });
    if (value === undefined) return false;
    const normalized = value.trim();
    await this.dependencies.getConfiguration(resource).update(
      settingKeys[kind].label,
      normalized === label ? undefined : normalized,
      vscode.ConfigurationTarget.Workspace
    );
    await this.dependencies.inform(`${label} label updated.`);
    return true;
  }

  public async configureCommand(kind: ProcessKind, resource?: vscode.ConfigurationScope): Promise<boolean> {
    const label = processLabels[kind];
    const current = this.getCommand(kind, resource);
    const root = resource instanceof vscode.Uri ? resource : undefined;
    const scripts = root ? await this.readPackageScripts(root) : [];
    const choices: Array<vscode.QuickPickItem & { command?: string }> = [
      ...scripts.map((script) => ({ label: script, description: `npm run ${script}`, command: `npm run ${script}` })),
      { label: 'Write a custom command', description: 'Enter a command manually' }
    ];
    const selected = choices.length > 1
      ? await this.dependencies.quickPick.showQuickPick(choices, { placeHolder: `Select a ${label} command or write a custom one` })
      : undefined;
    const value = selected?.command ?? await this.dependencies.input.showInputBox({
      prompt: `Command to start ${label}`,
      value: selected ? '' : current,
      valueSelection: [0, selected ? 0 : current.length],
      placeHolder: `Enter the ${label} command, or leave empty to clear it`
    });

    if (value === undefined) return false;

    const normalized = value.trim();
    await this.dependencies
      .getConfiguration(resource)
      .update(settingKeys[kind].command, normalized.length === 0 ? undefined : value, vscode.ConfigurationTarget.Workspace);
    await this.dependencies.inform(`${label} command configuration updated.`);
    return true;
  }

  private async readPackageScripts(root: vscode.Uri): Promise<string[]> {
    try {
      const bytes = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(root, 'package.json'));
      const packageJson = JSON.parse(new TextDecoder().decode(bytes)) as { scripts?: Record<string, unknown> };
      return Object.keys(packageJson.scripts ?? {}).sort();
    } catch {
      return [];
    }
  }
}
