"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutputLevel = exports.WindowPopout = exports.OutputWindow = exports.ErrorLogger = void 0;
const vscode_1 = require("vscode");
const helper_1 = require("./helper");
const _errorLogPath = "liveSassCompiler.ErrorInfo";
class ErrorLogger {
    constructor(workplaceState) {
        this._workplaceState = null;
        this.logs = [];
        OutputWindow.Show(OutputLevel.Trace, "Constructing error logger");
        this._workplaceState = workplaceState;
        OutputWindow.Show(OutputLevel.Trace, "Clearing any old log data");
        this.ClearLogs();
    }
    LogIssueWithAlert(Message, DetailedLogInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            OutputWindow.Show(OutputLevel.Trace, "Logging issue", [`Message: ${Message}`]);
            WindowPopout.Alert(`Live Sass Compiler: ${Message}`);
            this.logs.push(new LogEvent(DetailedLogInfo));
            yield this.SaveLogs();
        });
    }
    SaveLogs() {
        return __awaiter(this, void 0, void 0, function* () {
            OutputWindow.Show(OutputLevel.Trace, "Saving logs to storage");
            yield this._workplaceState.update(_errorLogPath, this.logs);
        });
    }
    InitiateIssueCreator() {
        return __awaiter(this, void 0, void 0, function* () {
            OutputWindow.Show(OutputLevel.Trace, "Issue creation started", [
                "Preparing last error for output",
            ]);
            let lastError = null;
            if (this.logs.length > 0) {
                OutputWindow.Show(OutputLevel.Trace, "Error log has been found");
                lastError = this.logs[this.logs.length - 1];
            }
            else {
                OutputWindow.Show(OutputLevel.Trace, "No error log could be found");
            }
            yield vscode_1.env.clipboard.writeText([
                "### UNEXPECTED ERROR\n",
                "**Machine & Versions**",
                "| Item | Value |",
                "|----------------------:|:-----------------------|",
                `| VS Code | v${vscode_1.version} |`,
                `| Platform | ${process.platform} ${process.arch} |`,
                `| Node | ${process.versions.node} (${process.versions.modules}) |`,
                `| Live Sass | ${vscode_1.extensions.getExtension("glenn2223.live-sass").packageJSON.version} |`,
                `<details><summary>Installed Extensions</summary><div>`,
                vscode_1.extensions.all
                    .filter((ext) => ext.isActive)
                    .map((ext) => `- ${ext.id} (${ext.packageJSON.version})`)
                    .join("<br/>"),
                "</div></details>",
                "",
                `**LOG**: ${lastError === null ? "" : lastError.createdAt.toISOString().replace("T", " ")}`,
                "```JSON",
                lastError === null
                    ? '{\n"NO LOG": "PLEASE SPECIFY YOUR ISSUE BELOW"\n}'
                    : JSON.stringify(lastError, null, 4),
                "```",
                "=======================",
                "<!-- You can add any supporting information below here -->\n",
            ].join("\n"));
            OutputWindow.Show(OutputLevel.Trace, "Ready to create issue", [
                "The data has been saved to the clipboard",
                "Attempting to open new issue URL on GitHub",
            ]);
            yield vscode_1.env.openExternal(vscode_1.Uri.parse("https://github.com/glenn2223/vscode-live-sass-compiler/issues/new?title=Unexpected+Error%3A+SUMMARY+HERE&body=%3C%21--+Highlight+this+line+and+then+paste+(Ctrl+%2B+V+%7C+Command+%2B+V)+--%3E"));
            OutputWindow.Show(OutputLevel.Critical, 'Opened your browser for creating an "Unexpected Error" issue', [
            // TODO: If required - setup command for outputting all logs
            //'Not the right error message? Run `outputAllLogs` to see all recorded errors'
            ]);
        });
    }
    ClearLogs() {
        return __awaiter(this, void 0, void 0, function* () {
            OutputWindow.Show(OutputLevel.Trace, "Error logs cleared");
            return this._workplaceState.update(_errorLogPath, {});
        });
    }
    static PrepErrorForLogging(Err) {
        OutputWindow.Show(OutputLevel.Trace, "Converting error to a usable object");
        return JSON.parse(JSON.stringify(Err, Object.getOwnPropertyNames(Err)));
    }
}
exports.ErrorLogger = ErrorLogger;
class LogEvent {
    constructor(event) {
        this.createdAt = new Date();
        this.event = event;
    }
}
class OutputWindow {
    static get MsgChannel() {
        if (!OutputWindow._msgChannel) {
            OutputWindow._msgChannel = vscode_1.window.createOutputChannel("Live Sass Compile");
        }
        return OutputWindow._msgChannel;
    }
    static Show(outputLevel, msgHeadline, msgBody, addEndLine = true) {
        const userLogLevel = helper_1.Helper.getOutputLogLevel();
        if (outputLevel >= userLogLevel || outputLevel === OutputLevel.Critical) {
            OutputWindow.MsgChannel.show(true);
            if (msgHeadline) {
                OutputWindow.MsgChannel.appendLine(msgHeadline);
            }
            if (msgBody) {
                msgBody.forEach((msg) => {
                    OutputWindow.MsgChannel.appendLine(msg);
                });
            }
            if (addEndLine) {
                OutputWindow.MsgChannel.appendLine("--------------------");
            }
        }
    }
    static dispose() {
        this.MsgChannel.dispose();
    }
}
exports.OutputWindow = OutputWindow;
class WindowPopout {
    static Inform(message) {
        vscode_1.window.showInformationMessage(message);
    }
    static Warn(message) {
        vscode_1.window.showWarningMessage(message);
    }
    static Alert(message) {
        vscode_1.window.showErrorMessage(message);
    }
}
exports.WindowPopout = WindowPopout;
var OutputLevel;
(function (OutputLevel) {
    OutputLevel[OutputLevel["Trace"] = 1] = "Trace";
    OutputLevel[OutputLevel["Debug"] = 2] = "Debug";
    OutputLevel[OutputLevel["Information"] = 3] = "Information";
    OutputLevel[OutputLevel["Warning"] = 4] = "Warning";
    OutputLevel[OutputLevel["Error"] = 5] = "Error";
    OutputLevel[OutputLevel["Critical"] = 6] = "Critical";
})(OutputLevel = exports.OutputLevel || (exports.OutputLevel = {}));
//# sourceMappingURL=VscodeExtensions.js.map