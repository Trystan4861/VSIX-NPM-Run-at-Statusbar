import * as path from 'node:path';
import * as vscode from 'vscode';
import { WorkspaceFileSystem, WorkspaceResolutionError, WorkspaceSelectionService } from './workspace-types';

export class WorkspaceResolver {
  public constructor(
    private readonly getFolders: () => readonly vscode.WorkspaceFolder[] | undefined,
    private readonly selection: WorkspaceSelectionService,
    private readonly fileSystem: WorkspaceFileSystem
  ) {}

  public async selectFolder(): Promise<vscode.WorkspaceFolder> {
    const folders = this.getFolders() ?? [];
    if (folders.length === 0) {
      throw new WorkspaceResolutionError('no-workspace', 'No workspace folder is open.');
    }
    if (folders.length === 1) {
      return folders[0];
    }
    const selected = await this.selection.chooseFolder(folders);
    if (!selected) {
      throw new WorkspaceResolutionError('selection-cancelled', 'Workspace folder selection was cancelled.');
    }
    return selected;
  }

  public async resolveWorkingDirectory(folder: vscode.WorkspaceFolder, configuredCwd: string): Promise<vscode.Uri> {
    const rootPath = path.resolve(folder.uri.fsPath);
    const relativeCwd = configuredCwd.trim();
    const candidate = path.resolve(rootPath, relativeCwd || '.');
    const relative = path.relative(rootPath, candidate);
    const outsideRoot = relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative);
    if (outsideRoot || path.isAbsolute(relativeCwd)) {
      throw new WorkspaceResolutionError('invalid-cwd', `The configured working directory is outside the workspace: ${configuredCwd}`);
    }

    const uri = vscode.Uri.file(candidate);
    let stat: vscode.FileStat;
    try {
      stat = await this.fileSystem.stat(uri);
    } catch {
      throw new WorkspaceResolutionError('missing-directory', `The configured working directory does not exist: ${candidate}`);
    }
    if ((stat.type & vscode.FileType.Directory) === 0) {
      throw new WorkspaceResolutionError('not-directory', `The configured working directory is not a directory: ${candidate}`);
    }
    return uri;
  }
}
