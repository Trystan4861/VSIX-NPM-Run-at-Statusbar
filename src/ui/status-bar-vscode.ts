import * as vscode from 'vscode';
import { StatusBarFactory, StatusBarItemLike } from './ui-types';

export class VsCodeStatusBarFactory implements StatusBarFactory {
  public create(alignment: vscode.StatusBarAlignment, priority: number): StatusBarItemLike {
    return vscode.window.createStatusBarItem(alignment, priority);
  }
}
