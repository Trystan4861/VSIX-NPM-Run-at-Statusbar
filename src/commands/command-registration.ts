import * as vscode from 'vscode';
import { ConfigurationService } from '../configuration/configuration-service';
import { ProcessKind } from '../configuration/configuration-types';
import { ProcessManager } from '../process/process-manager';
import { ProcessMenu } from '../ui/process-menu';

export interface CommandRegistrationDependencies {
  readonly configuration: ConfigurationService;
  readonly processManager: ProcessManager;
  readonly processMenu?: ProcessMenu;
  readonly getResource?: () => vscode.ConfigurationScope | undefined;
}

const configurationCommands: Readonly<Record<string, ProcessKind>> = {
  'vsixTerminalLauncher.configureBackend': 'backend',
  'vsixTerminalLauncher.configureFrontend': 'frontend',
  'vsixTerminalLauncher.renameBackend': 'backend',
  'vsixTerminalLauncher.renameFrontend': 'frontend'
};

const lifecycleCommands: Readonly<Record<string, { kind: ProcessKind; action: 'start' | 'stop' | 'restart' | 'show' }>> = {
  'vsixTerminalLauncher.startBackend': { kind: 'backend', action: 'start' },
  'vsixTerminalLauncher.stopBackend': { kind: 'backend', action: 'stop' },
  'vsixTerminalLauncher.restartBackend': { kind: 'backend', action: 'restart' },
  'vsixTerminalLauncher.showBackend': { kind: 'backend', action: 'show' },
  'vsixTerminalLauncher.startFrontend': { kind: 'frontend', action: 'start' },
  'vsixTerminalLauncher.stopFrontend': { kind: 'frontend', action: 'stop' },
  'vsixTerminalLauncher.restartFrontend': { kind: 'frontend', action: 'restart' },
  'vsixTerminalLauncher.showFrontend': { kind: 'frontend', action: 'show' }
};

export function registerCommands(
  context: vscode.ExtensionContext,
  dependencies: CommandRegistrationDependencies
): void {
  for (const [commandId, kind] of Object.entries(configurationCommands)) {
    context.subscriptions.push(
      vscode.commands.registerCommand(commandId, () =>
        commandId.includes('rename')
          ? dependencies.configuration.configureLabel(kind, dependencies.getResource?.())
          : dependencies.configuration.configureCommand(kind, dependencies.getResource?.())
      )
    );
  }

  for (const [commandId, registration] of Object.entries(lifecycleCommands)) {
    context.subscriptions.push(
      vscode.commands.registerCommand(commandId, async () => {
        try {
          if (registration.action === 'start') {
            await dependencies.processManager.start(registration.kind);
          } else if (registration.action === 'stop') {
            dependencies.processManager.stop(registration.kind);
          } else if (registration.action === 'restart') {
            await dependencies.processManager.restart(registration.kind);
          } else {
            dependencies.processManager.show(registration.kind);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : `${registration.kind} operation failed.`;
          await vscode.window.showErrorMessage(message);
        }
      })
    );
  }

  context.subscriptions.push(
    vscode.commands.registerCommand('vsixTerminalLauncher.manage', () =>
      dependencies.processMenu?.show() ?? vscode.window.showInformationMessage('Process management is unavailable.')
    )
  );
}
