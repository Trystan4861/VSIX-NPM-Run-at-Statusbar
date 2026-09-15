import * as vscode from 'vscode';
import { ProcessKind } from '../configuration/configuration-types';
import { ProcessState } from '../process/process-types';

export interface UiProcessSnapshot {
  readonly kind: ProcessKind;
  readonly label: string;
  readonly state: ProcessState;
  readonly configured: boolean;
  readonly hasTerminal: boolean;
}

export interface StatusBarItemLike {
  text: string;
  tooltip: string | vscode.MarkdownString | undefined;
  command?: string | vscode.Command;
  priority?: number;
  alignment: vscode.StatusBarAlignment;
  show(): void;
  hide(): void;
  dispose(): void;
}

export interface StatusBarFactory {
  create(alignment: vscode.StatusBarAlignment, priority: number): StatusBarItemLike;
}
