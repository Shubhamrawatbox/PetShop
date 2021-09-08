"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusBarUi = void 0;
const vscode = __importStar(require("vscode"));
const VscodeExtensions_1 = require("./VscodeExtensions");
class StatusBarUi {
    static get statusBarItem() {
        if (!StatusBarUi._statusBarItem) {
            StatusBarUi._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 200);
            this.statusBarItem.show();
        }
        return StatusBarUi._statusBarItem;
    }
    static init(watchOnLaunch) {
        StatusBarUi.customMessage("Starting...", "Initializing... switching state in 1 second");
        setTimeout(function () {
            watchOnLaunch ? StatusBarUi.watching() : StatusBarUi.notWatching();
        }, 1000);
    }
    static watching() {
        VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "Changing status bar to: Watching");
        StatusBarUi.statusBarItem.text = `$(telescope) Watching...`;
        StatusBarUi.statusBarItem.color = "inherit";
        StatusBarUi.statusBarItem.command = "liveSass.command.donotWatchMySass";
        StatusBarUi.statusBarItem.tooltip = "Stop live compilation of SASS or SCSS to CSS";
    }
    static notWatching() {
        VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "Changing status bar to: Not watching (or Watch SASS)");
        StatusBarUi.statusBarItem.text = `$(eye) Watch Sass`;
        StatusBarUi.statusBarItem.color = "inherit";
        StatusBarUi.statusBarItem.command = "liveSass.command.watchMySass";
        StatusBarUi.statusBarItem.tooltip = "live compilation of SASS or SCSS to CSS";
    }
    static working(workingMsg = "Working on it...") {
        this.customMessage(workingMsg, "In case it takes a long time, show output window and report.");
    }
    static customMessage(text, tooltip, iconName = "pulse", command = null) {
        VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, `Changing status bar to: "${text}"`);
        let icon = "";
        if (iconName)
            icon = `$(${iconName}) `;
        StatusBarUi.statusBarItem.text = `${icon}${text}`;
        StatusBarUi.statusBarItem.tooltip = tooltip;
        StatusBarUi.statusBarItem.command = command;
    }
    // Quick status bar messages after compile success or error
    static compilationSuccess(isWatching) {
        VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "Changing status bar to: Success", [
            "Registered timeout to switch state back",
        ]);
        StatusBarUi.statusBarItem.text = `$(check) Success`;
        StatusBarUi.statusBarItem.color = "#33ff00";
        StatusBarUi.statusBarItem.command = "liveSass.command.openOutputWindow";
        setTimeout(function () {
            VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "Firing timeout function to switch back");
            StatusBarUi.statusBarItem.color = "inherit";
            if (isWatching) {
                StatusBarUi.watching();
            }
            else {
                StatusBarUi.notWatching();
            }
        }, 4500);
    }
    static compilationError(isWatching) {
        VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "Changing status bar to: Error", null, false);
        StatusBarUi.statusBarItem.text = `$(x) Error`;
        StatusBarUi.statusBarItem.color = "#ff0033";
        StatusBarUi.statusBarItem.command = "liveSass.command.openOutputWindow";
        if (isWatching) {
            VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "Registered timeout to switch state back", null, false);
            setTimeout(function () {
                VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "Firing timeout function to switch back");
                StatusBarUi.statusBarItem.color = "inherit";
                StatusBarUi.watching();
            }, 4500);
        }
        else {
            StatusBarUi.notWatching();
        }
        VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, null);
    }
    static dispose() {
        StatusBarUi.statusBarItem.dispose();
        VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "Disposing Live SASS status bar item");
    }
}
exports.StatusBarUi = StatusBarUi;
//# sourceMappingURL=StatusbarUi.js.map