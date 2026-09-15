import * as assert from 'node:assert/strict';
import { ConfigurationService } from '../configuration/configuration-service';
import { getCommandFailedMessage, getUiStrings } from '../ui/localization';
import { ConfigurationServiceDependencies, ProcessKind } from '../configuration/configuration-types';

export async function runPhase2ContractTests(): Promise<void> {
  const values: Record<string, unknown> = { backendCommand: ' npm run backend ', backendCwd: 'server' };
  const updates: Array<{ key: string; value: unknown }> = [];
  const dependencyFactory = (): ConfigurationServiceDependencies => ({
    getConfiguration: () => ({
      get: <T>(key: string, defaultValue: T): T => (values[key] as T | undefined) ?? defaultValue,
      update: async (key: string, value: unknown): Promise<void> => {
        updates.push({ key, value });
      }
    }),
    input: { showInputBox: async () => undefined },
    quickPick: { showQuickPick: async () => undefined },
    inform: async () => undefined
  });
  const service = new ConfigurationService(dependencyFactory());
  assert.equal(service.getCommand('backend'), ' npm run backend ');
  assert.equal(service.hasCommand('backend'), true);
  assert.equal(service.getWorkingDirectory('backend'), 'server');
  assert.equal(service.hasCommand('frontend'), false);
  assert.equal(await service.configureCommand('backend'), false);
  assert.deepEqual(updates, []);
  const kind: ProcessKind = 'backend';
  assert.equal(kind, 'backend');
  assert.equal(getUiStrings('es-ES').start, 'Iniciar');
  assert.equal(getUiStrings('fr').start, 'Start');
  assert.equal(getCommandFailedMessage('backend', 'es-ES'), 'El comando Backend ha fallado.');
  assert.equal(getCommandFailedMessage('frontend', 'en-US'), 'The Frontend command failed.');
}
