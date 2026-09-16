import * as vscode from 'vscode';
import { ConfigurationService } from './configuration/configuration-service';
import { registerCommands } from './commands/command-registration';
import { ProcessManager } from './process/process-manager';
import { VsCodeTerminalFactory } from './process/terminal-adapter';
import { WorkspaceResolver } from './workspace/workspace-resolver';
import { ProcessMenu, createVsCodeProcessMenu } from './ui/process-menu';
import { StatusBarController } from './ui/status-bar-controller';
import { VsCodeStatusBarFactory } from './ui/status-bar-vscode';

export function activate(context: vscode.ExtensionContext): void {
  const configuration = new ConfigurationService({
    getConfiguration: (resource) => vscode.workspace.getConfiguration('vsixTerminalLauncher', resource),
    input: vscode.window,
    quickPick: vscode.window,
    inform: (message) => vscode.window.showInformationMessage(message)
  });
  const resolver = new WorkspaceResolver(
    () => vscode.workspace.workspaceFolders,
    {
      chooseFolder: async (folders) => {
        const selected = await vscode.window.showQuickPick(
          folders.map((folder) => ({ label: folder.name, description: folder.uri.fsPath, folder }))
        );
        return selected?.folder;
      }
    },
    vscode.workspace.fs
  );
  const terminalFactory = new VsCodeTerminalFactory();
  const manager = new ProcessManager({
    getConfiguration: (kind, resource) => configuration.getConfiguration(kind, resource),
    selectFolder: () => resolver.selectFolder(),
    resolveWorkingDirectory: (folder, cwd) => resolver.resolveWorkingDirectory(folder, cwd),
    terminalFactory,
    reportError: (message) => vscode.window.showErrorMessage(message),
    locale: vscode.env.language,
    confirmReuseTerminal: (name) => vscode.window.showInformationMessage(
      `A ${name} terminal already exists. Reuse it?`,
      'Reuse terminal',
      'Create new terminal'
    ).then((choice) => choice === 'Reuse terminal')
  });
  context.subscriptions.push(terminalFactory.onDidClose((terminal) => manager.handleClosedTerminal(terminal)));
  context.subscriptions.push(terminalFactory.onDidEndShellExecution((terminal, exitCode) => manager.handleShellExecutionEnded(terminal, exitCode)));
  const statusBar = new StatusBarController(
    new VsCodeStatusBarFactory(),
    manager,
    configuration,
    () => vscode.workspace.workspaceFolders?.[0]?.uri,
    () => vscode.workspace.getConfiguration('vsixTerminalLauncher', vscode.workspace.workspaceFolders?.[0]?.uri).get<boolean>('showStatusBarItems', true)
  );
  const processMenu: ProcessMenu = createVsCodeProcessMenu(manager, configuration, () => vscode.workspace.workspaceFolders?.[0]?.uri);
  context.subscriptions.push(statusBar, manager.onDidChange(() => statusBar.refresh()));
  context.subscriptions.push(vscode.commands.registerCommand('vsixTerminalLauncher.refreshStatusBar', () => statusBar.refresh()));
  context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration('vsixTerminalLauncher')) statusBar.refresh();
  }));
  context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(() => statusBar.refresh()));
  registerCommands(context, {
    configuration,
    processManager: manager,
    processMenu,
    getResource: () => vscode.workspace.workspaceFolders?.[0]?.uri
  });
}

export function deactivate(): void {
}
