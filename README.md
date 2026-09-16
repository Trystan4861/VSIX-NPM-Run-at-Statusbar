# NPM Run at Statusbar

Visual Studio Code extension for launching and managing Backend and Frontend development processes in integrated terminals.

## Features

- Shows configurable Backend and Frontend controls in the status bar.
- Starts, stops, restarts and shows one managed terminal per process type.
- Runs Backend and Frontend simultaneously in terminals named `Backend` and `Frontend`.
- Prevents duplicate managed terminals when a process is started repeatedly.
- Provides a contextual **Manage Processes** QuickPick.
- Suggests scripts from the workspace root `package.json` when configuring a command.
- Supports custom commands when no package script is suitable.
- Supports single-folder and multi-root workspaces.
- Allows a workspace-relative working directory for each process.
- Tracks terminals closed manually and updates the process state.
- Detects non-zero command exit codes through VS Code shell integration and reports failed commands.
- Presents management actions vertically in a styled contextual tooltip.
- Localizes contextual actions and command errors to English or Spanish, with English fallback.

## Requirements

- Visual Studio Code `1.85.0` or newer.
- An open workspace folder to configure or start processes.

## Installation

### From the Visual Studio Code Marketplace

The extension is published under the publisher **trystan4861**. To install it:

1. Open Visual Studio Code.
2. Open the **Extensions** view.
3. Search for **NPM Run at Statusbar**.
4. Select the extension published by **trystan4861** and click **Install**.

No repository clone, dependency installation or terminal command is required for the Marketplace installation.

### From a VSIX downloaded from the repository

If you download a `.vsix` package from the [GitHub repository](https://github.com/Trystan4861/VSIX-NPM-Run-at-Statusbar), install it directly from Visual Studio Code:

1. Open the **Extensions** view.
2. Select **Views and More Actions** (`...`).
3. Choose **Install from VSIX...**.
4. Select the downloaded `.vsix` file.

### For development

1. Clone or open this project in Visual Studio Code.
2. Run `npm install`.
3. Run `npm run compile`.
4. Press `F5` to launch an Extension Development Host.

## Configuration

Configuration is stored at workspace scope, so each project can define its own commands.

| Setting | Default | Description |
| --- | --- | --- |
| `vsixTerminalLauncher.backendCommand` | `""` | Command used to start the Backend process. |
| `vsixTerminalLauncher.frontendCommand` | `""` | Command used to start the Frontend process. |
| `vsixTerminalLauncher.backendCwd` | `""` | Optional Backend working directory, relative to the selected workspace folder. |
| `vsixTerminalLauncher.frontendCwd` | `""` | Optional Frontend working directory, relative to the selected workspace folder. |
| `vsixTerminalLauncher.showStatusBarItems` | `true` | Shows or hides the status-bar controls. |
| `vsixTerminalLauncher.backendLabel` | `Backend` | Custom Backend status-bar label, up to 10 characters. |
| `vsixTerminalLauncher.frontendLabel` | `Frontend` | Custom Frontend status-bar label, up to 10 characters. |

Use the **Configure Backend Command** or **Configure Frontend Command** commands to update a process command. If the workspace contains a root `package.json` with scripts, those scripts are offered first; a custom command can also be entered manually. Cancelling keeps the existing value, while an empty value clears it.

Working directories must exist, be directories, and remain inside the selected workspace folder. In a multi-root workspace, the folder is selected when starting a process. Without an open workspace, the extension does not create a terminal and reports `No workspace folder is open.`

## Usage

After opening a workspace:

1. Configure a Backend and/or Frontend command from the Command Palette, or click an unconfigured status-bar control.
2. Click the corresponding status-bar control to start the process.
3. When a process is running, click its status-bar control to show the corresponding managed terminal.
4. Use the status-bar tooltip or **Manage Processes** to stop, restart, configure, rename, or show a process terminal.

The status-bar control uses:

- `$(gear)` when no command is configured.
- `$(play)` when the configured process is stopped.
- `$(terminal)` when the configured process is running.

While a process is running, its hover menu exposes **Show terminal**, **Restart**, and **Stop** actions; the main button only shows the managed terminal. Actions are displayed vertically with icons and clearer labels in a compact, Copilot-inspired contextual menu.

The default labels are `Backend` and `Frontend`; they can be changed with the rename actions or the `backendLabel` and `frontendLabel` settings. The controls are hidden when there is no workspace or when `showStatusBarItems` is disabled.

When starting a process, if an integrated terminal with the same process name already exists, the extension asks whether to reuse it. Choosing to create a new terminal preserves the previous behavior.

## Commands

- `VSIX Terminal Launcher: Start Backend`
- `VSIX Terminal Launcher: Stop Backend`
- `VSIX Terminal Launcher: Restart Backend`
- `VSIX Terminal Launcher: Configure Backend Command`
- `VSIX Terminal Launcher: Show Backend Terminal`
- `VSIX Terminal Launcher: Rename Backend Button`
- `VSIX Terminal Launcher: Start Frontend`
- `VSIX Terminal Launcher: Stop Frontend`
- `VSIX Terminal Launcher: Restart Frontend`
- `VSIX Terminal Launcher: Configure Frontend Command`
- `VSIX Terminal Launcher: Show Frontend Terminal`
- `VSIX Terminal Launcher: Rename Frontend Button`
- `VSIX Terminal Launcher: Manage Processes`

## Workspace and terminal behavior

Commands are sent to VS Code's integrated shell using the shell syntax configured by the user. The extension does not use `child_process` and does not attempt to kill descendant processes directly.

Stopping or disposing a managed terminal cannot guarantee termination of every descendant process across operating systems and shells. Closing a managed terminal manually marks its process as stopped. Reloading the extension resets in-memory ownership and does not adopt terminals created before the reload. Processes are not started automatically on activation or reload.

Do not store secrets in configured commands or commit workspace settings containing credentials. Complete command text is not included in error messages.

## Development commands

```bash
npm install
npm run compile
npm run lint
npm test
npm run validate
npm run package
```

`npm test` runs the contract and process-manager tests. `npm run validate` runs compilation, linting and tests. `npm run package` generates a `.vsix` package for manual installation or distribution.

## License

MIT
