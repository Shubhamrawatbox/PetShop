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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModel = void 0;
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const FileHelper_1 = require("./FileHelper");
const helper_1 = require("./helper");
const fdir_1 = require("fdir");
const SassCompileHelper_1 = require("./SassCompileHelper");
const StatusbarUi_1 = require("./StatusbarUi");
const VscodeExtensions_1 = require("./VscodeExtensions");
const autoprefixer_1 = __importDefault(require("autoprefixer"));
const error_1 = __importDefault(require("browserslist/error"));
const fs_1 = __importDefault(require("fs"));
const picomatch_1 = __importDefault(require("picomatch"));
const postcss_1 = __importDefault(require("postcss"));
class AppModel {
    constructor(workplaceState) {
        VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "Constructing app model");
        this.isWatching = helper_1.Helper.getConfigSettings("watchOnLaunch");
        this._logger = new VscodeExtensions_1.ErrorLogger(workplaceState);
        if (this.isWatching) {
            VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Information, "Watching...");
        }
        StatusbarUi_1.StatusBarUi.init(this.isWatching);
        VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "App model constructed");
    }
    StartWatching() {
        return __awaiter(this, void 0, void 0, function* () {
            const compileOnWatch = helper_1.Helper.getConfigSettings("compileOnWatch");
            if (!this.isWatching) {
                this.isWatching = !this.isWatching;
                if (compileOnWatch) {
                    yield this.compileAllFiles();
                }
            }
            this.revertUIToWatchingStatusNow();
        });
    }
    StopWatching() {
        if (this.isWatching) {
            this.isWatching = !this.isWatching;
        }
        this.revertUIToWatchingStatusNow();
    }
    openOutputWindow() {
        VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Critical, null, null, false);
    }
    createIssue() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._logger.InitiateIssueCreator();
        });
    }
    /**
     * Waiting to see if Autoprefixer will add my changes
    async browserslistChecks(): Promise<void> {
        try {
            const autoprefixerTarget = Helper.getConfigSettings<Array<string> | boolean>(
                    "autoprefix"
                ),
                filePath = vscode.window.activeTextEditor.document.fileName;

            if (
                autoprefixerTarget === true &&
                (
                    filePath.endsWith(`${path.sep}package.json`) ||
                    filePath.endsWith(`${path.sep}.browserslistrc`)
                )
            )
                autoprefixer.clearBrowserslistCaches();

        } catch (err) {
            await this._logger.LogIssueWithAlert(
                `Unhandled error while clearing browserslist cache. Error message: ${err.message}`,
                {
                    triggeringFile: vscode.window.activeTextEditor.document.fileName,
                    error: ErrorLogger.PrepErrorForLogging(err),
                }
            );
        }
    }
     */
    //#region Compilation functions
    //#region Public
    /**
     * Compile all files.
     */
    compileAllFiles() {
        return __awaiter(this, void 0, void 0, function* () {
            VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "Starting to compile all files");
            try {
                StatusbarUi_1.StatusBarUi.working();
                yield this.GenerateAllCssAndMap();
            }
            catch (err) {
                let files;
                try {
                    files = yield this.getSassFiles();
                }
                catch (_) {
                    files = "Error lies in getSassFiles()";
                }
                yield this._logger.LogIssueWithAlert(`Unhandled error while compiling all files. Error message: ${err.message}`, {
                    files: files,
                    error: VscodeExtensions_1.ErrorLogger.PrepErrorForLogging(err),
                });
            }
            this.revertUIToWatchingStatusNow();
        });
    }
    /**
     * Compiles the currently active file
     */
    compileCurrentFile() {
        return __awaiter(this, void 0, void 0, function* () {
            VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "Starting to compile current file");
            try {
                if (!vscode.window.activeTextEditor) {
                    StatusbarUi_1.StatusBarUi.customMessage("No file open", "No file is open, ensure a file is open in the editor window", "warning");
                    VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Debug, "No active file", [
                        "There isn't an active editor window to process",
                    ]);
                    this.revertUIToWatchingStatus();
                    return;
                }
                const sassPath = vscode.window.activeTextEditor.document.fileName;
                if (!this.isSassFile(sassPath)) {
                    if (this.isSassFile(sassPath, true)) {
                        VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Debug, "Can't process partial Sass", [
                            "The file currently open in the editor window is a partial sass file, these aren't processed singly",
                        ]);
                        StatusbarUi_1.StatusBarUi.customMessage("Can't process partial Sass", "The file currently open in the editor window is a partial sass file, these aren't processed singly", "warning");
                    }
                    else {
                        VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Debug, "Not a Sass file", [
                            "The file currently open in the editor window isn't a sass file",
                        ]);
                        StatusbarUi_1.StatusBarUi.customMessage("Not a Sass file", "The file currently open in the editor window isn't a sass file", "warning");
                    }
                    this.revertUIToWatchingStatus();
                    return;
                }
                StatusbarUi_1.StatusBarUi.working("Processing single file...");
                VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Debug, "Processing the current file", [
                    `Path: ${sassPath}`,
                ]);
                const formats = helper_1.Helper.getConfigSettings("formats");
                const result = yield Promise.all(formats.map((format, index) => __awaiter(this, void 0, void 0, function* () {
                    VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, `Starting format ${index + 1} of ${formats.length}`, [`Settings: ${JSON.stringify(format)}`]);
                    // Each format
                    const options = this.getCssStyle(format.format), cssMapUri = yield this.generateCssAndMapUri(sassPath, format);
                    return yield this.GenerateCssAndMap(sassPath, cssMapUri.css, cssMapUri.map, options);
                })));
                if (result.indexOf(false) < 0) {
                    StatusbarUi_1.StatusBarUi.compilationSuccess(this.isWatching);
                }
            }
            catch (err) {
                const sassPath = vscode.window.activeTextEditor
                    ? vscode.window.activeTextEditor.document.fileName
                    : "/* NO ACTIVE FILE, PROCESSING SHOULD NOT HAVE OCCURRED */";
                yield this._logger.LogIssueWithAlert(`Unhandled error while compiling the active file. Error message: ${err.message}`, {
                    file: sassPath,
                    error: VscodeExtensions_1.ErrorLogger.PrepErrorForLogging(err),
                });
            }
        });
    }
    /**
     * Compiles the file that has just been saved
     */
    compileOnSave() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const currentFile = vscode.window.activeTextEditor.document.fileName;
                if (!this.isSassFile(currentFile, true)) {
                    return;
                }
                VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "SASS file saved", [
                    "A SASS file has been saved, starting checks",
                ]);
                if (!this.isWatching) {
                    VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "Not watching", [
                        "The file has not been compiled as Live SASS is not watching",
                    ]);
                    return;
                }
                if (yield this.isSassFileExcluded(currentFile)) {
                    VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "File excluded", [
                        "The file has not been compiled as it's excluded by user settings",
                        `Path: ${currentFile}`,
                    ]);
                    return;
                }
                VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Debug, "Change detected - " + new Date().toLocaleString(), [path.basename(currentFile)]);
                if (this.isSassFile(currentFile)) {
                    VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "File is not a partial", [
                        "The file is not a partial so we will compile only this one",
                        `Path: ${currentFile}`,
                    ]);
                    const formats = helper_1.Helper.getConfigSettings("formats");
                    yield Promise.all(formats.map((format, index) => __awaiter(this, void 0, void 0, function* () {
                        VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, `Starting format ${index + 1} of ${formats.length}`, [`Settings: ${JSON.stringify(format)}`]);
                        // Each format
                        const options = this.getCssStyle(format.format), cssMapPath = yield this.generateCssAndMapUri(currentFile, format);
                        yield this.GenerateCssAndMap(currentFile, cssMapPath.css, cssMapPath.map, options);
                    })));
                }
                else {
                    // Partial
                    yield this.GenerateAllCssAndMap();
                }
            }
            catch (err) {
                let files;
                try {
                    files = yield this.getSassFiles();
                }
                catch (_) {
                    files = "Error lies in getSassFiles()";
                }
                yield this._logger.LogIssueWithAlert(`Unhandled error while compiling the saved changes. Error message: ${err.message}`, {
                    triggeringFile: vscode.window.activeTextEditor.document.fileName,
                    allFiles: files,
                    error: VscodeExtensions_1.ErrorLogger.PrepErrorForLogging(err),
                });
            }
            this.revertUIToWatchingStatus();
        });
    }
    //#endregion Public
    //#region Private
    getCssStyle(format = "expanded") {
        return SassCompileHelper_1.SassHelper.targetCssFormat(format);
    }
    /**
     * To Generate one One Css & Map file from Sass/Scss
     * @param sassPath Sass/Scss file URI (string)
     * @param targetCssUri Target CSS file URI (string)
     * @param mapFileUri Target MAP file URI (string)
     * @param options - Object - It includes target CSS style and some more.
     */
    GenerateCssAndMap(sassPath, targetCssUri, mapFileUri, options) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "Starting compilation", [
                "Starting compilation of file",
                `Path: ${sassPath}`,
            ]);
            const generateMap = helper_1.Helper.getConfigSettings("generateMap"), autoprefixerTarget = helper_1.Helper.getConfigSettings("autoprefix"), compileResult = SassCompileHelper_1.SassHelper.instance.compileOne(sassPath, mapFileUri, options), promises = [];
            if (compileResult.errorString !== null) {
                VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Error, "Compilation Error", [compileResult.errorString]);
                StatusbarUi_1.StatusBarUi.compilationError(this.isWatching);
                return false;
            }
            let css = compileResult.result.css.toString(), map = (_a = compileResult.result.map) === null || _a === void 0 ? void 0 : _a.toString();
            if (autoprefixerTarget != false) {
                VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "Autoprefixer isn't false, applying to file", [
                    `Path: ${sassPath}`,
                ]);
                try {
                    const autoprefixerResult = yield this.autoprefix(css, map, sassPath, targetCssUri, autoprefixerTarget);
                    css = autoprefixerResult.css;
                    map = autoprefixerResult.map;
                }
                catch (err) {
                    if (err instanceof error_1.default) {
                        VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Error, "Autoprefix error. Your changes have not been saved", [`Message: ${err.message}`, `Path: ${sassPath}`]);
                        return false;
                    }
                    else {
                        throw err;
                    }
                }
            }
            else if (generateMap) {
                const pMap = JSON.parse(map);
                pMap.file = `${path.basename(targetCssUri)}.map`;
                map = JSON.stringify(pMap);
            }
            if (generateMap) {
                css += `/*# sourceMappingURL=${path.basename(targetCssUri)}.map */`;
                promises.push(FileHelper_1.FileHelper.writeToOneFile(mapFileUri, map));
            }
            promises.push(FileHelper_1.FileHelper.writeToOneFile(targetCssUri, css));
            const fileResolvers = yield Promise.all(promises);
            VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Information, "Generated:", null, false);
            StatusbarUi_1.StatusBarUi.compilationSuccess(this.isWatching);
            fileResolvers.forEach((fileResolver) => {
                if (fileResolver.Exception) {
                    VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Error, "Error:", [
                        fileResolver.Exception.errno.toString(),
                        fileResolver.Exception.path,
                        fileResolver.Exception.message,
                    ]);
                    console.error("error :", fileResolver);
                }
                else {
                    VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Information, null, [fileResolver.FileUri], false);
                }
            });
            VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Information, null, null, true);
            return true;
        });
    }
    /**
     * To compile all Sass/scss files
     */
    GenerateAllCssAndMap() {
        return __awaiter(this, void 0, void 0, function* () {
            const formats = helper_1.Helper.getConfigSettings("formats"), sassPaths = yield this.getSassFiles();
            VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Debug, "Compiling Sass/Scss Files: ", sassPaths);
            yield Promise.all(sassPaths.map((sassPath, pathIndex) => __awaiter(this, void 0, void 0, function* () {
                VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, `Starting file ${pathIndex + 1} of ${sassPaths.length}`, [`Path: ${sassPath}`]);
                yield Promise.all(formats.map((format, formatIndex) => __awaiter(this, void 0, void 0, function* () {
                    VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, `Starting format ${formatIndex + 1} of ${formats.length}`, [`Settings: ${JSON.stringify(format)}`]);
                    // Each format
                    const options = this.getCssStyle(format.format), cssMapUri = yield this.generateCssAndMapUri(sassPath, format);
                    yield this.GenerateCssAndMap(sassPath, cssMapUri.css, cssMapUri.map, options);
                })));
            })));
        });
    }
    /**
     * Generate a full save path for the final css & map files
     * @param filePath The path to the current SASS file
     * @param savePath The path we're going to save to
     * @param _extensionName The file extension we're going to use
     */
    generateCssAndMapUri(filePath, format) {
        return __awaiter(this, void 0, void 0, function* () {
            VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "Calculating file paths", [
                "Calculating the save paths for the css and map output files",
                `Originating path: ${filePath}`,
            ]);
            const extensionName = format.extensionName || ".css", workspaceFolders = vscode.workspace.workspaceFolders;
            let generatedUri = null;
            VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "Searching for workspace", [
                "Need to find a workspace folder that holds the file",
            ]);
            let workspaceRoot;
            if (workspaceFolders) {
                VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "Workspace has folder", [
                    "Searching for the workspace folder where this file is located",
                    `Path: ${filePath}`,
                ]);
                const foundInFolders = (yield Promise.all(workspaceFolders.map((folder, index) => __awaiter(this, void 0, void 0, function* () {
                    VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, `Checking folder ${index + 1} of ${workspaceFolders.length}`, [`Folder: ${folder.name}`], false);
                    if (filePath.startsWith(folder.uri.fsPath)) {
                        VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "MATCH");
                        return folder.uri.fsPath;
                    }
                    else {
                        VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "NO MATCH");
                        return null;
                    }
                })))).filter((x) => x !== null);
                if (foundInFolders.length == 0) {
                    workspaceRoot = workspaceFolders[0].uri.fsPath;
                    VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Warning, "Warning: File is not in workspace", [
                        "The file will be saved relative to the first folder in your workspace",
                        `Path: ${workspaceRoot}`,
                    ]);
                }
                else {
                    workspaceRoot = foundInFolders[0];
                    VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, `Using: ${workspaceRoot}`);
                }
            }
            else {
                workspaceRoot = path.basename(vscode.window.activeTextEditor.document.fileName);
                VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Warning, "Warning: There is no active workspace", [
                    "The file will be saved relative to file being processed",
                    `Path: ${workspaceRoot}`,
                ]);
            }
            // NOTE: If all SavePath settings are `NULL`, CSS Uri will be same location as SASS
            if (format.savePath) {
                VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "Using `savePath` setting", [
                    "This format has a `savePath`, using this (takes precedence if others are present)",
                    `savePath: ${format.savePath}`,
                ]);
                if (format.savePath.startsWith("~")) {
                    VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "Path is relative to current file", [
                        "Path starts with a tilde, so the path is relative to the current path",
                        `Original path: ${filePath}`,
                    ], false);
                    generatedUri = path.join(path.dirname(filePath), format.savePath.substring(1));
                }
                else {
                    VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "Path is relative to workspace folder", [
                        "No tilde so the path is relative to the workspace folder being used",
                        `Original path: ${filePath}`,
                    ], false);
                    generatedUri = path.join(workspaceRoot, format.savePath);
                }
                VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, `New path: ${generatedUri}`);
                FileHelper_1.FileHelper.MakeDirIfNotAvailable(generatedUri);
                filePath = path.join(generatedUri, path.basename(filePath));
            }
            else if (format.savePathSegmentKeys &&
                format.savePathSegmentKeys.length &&
                format.savePathReplaceSegmentsWith) {
                VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "Using segment replacement", [
                    `Keys: [${format.savePathSegmentKeys.join(", ")}] - Replacement: ${format.savePathReplaceSegmentsWith}`,
                    `Original path: ${filePath}`,
                ], false);
                generatedUri = path.join(workspaceRoot, path
                    .dirname(filePath)
                    .substring(workspaceRoot.length + 1)
                    .split(path.sep)
                    .map((folder) => {
                    return format.savePathSegmentKeys.indexOf(folder) >= 0
                        ? format.savePathReplaceSegmentsWith
                        : folder;
                })
                    .join(path.sep));
                VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, `New path: ${generatedUri}`);
                FileHelper_1.FileHelper.MakeDirIfNotAvailable(generatedUri);
                filePath = path.join(generatedUri, path.basename(filePath));
            }
            const cssUri = filePath.substring(0, filePath.lastIndexOf(".")) + extensionName;
            return {
                css: cssUri,
                map: cssUri + ".map",
            };
        });
    }
    /**
     * Autoprefix CSS properties
     *
     * @param css String representation of CSS to transform
     * @param target What browsers to be targeted, as supported by [Browserslist](https://github.com/ai/browserslist)
     */
    autoprefix(css, map, filePath, savePath, browsers) {
        return __awaiter(this, void 0, void 0, function* () {
            VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "Preparing autoprefixer");
            const generateMap = helper_1.Helper.getConfigSettings("generateMap"), prefixer = postcss_1.default(autoprefixer_1.default({
                overrideBrowserslist: browsers === true ? null : browsers,
            }));
            // TODO: REMOVE - when autoprefixer can stop caching the browsers
            const oldBrowserlistCache = process.env.BROWSERSLIST_DISABLE_CACHE;
            process.env.BROWSERSLIST_DISABLE_CACHE = "1";
            VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "Changing BROWSERSLIST_DISABLE_CACHE setting", [
                `Was: ${oldBrowserlistCache !== null && oldBrowserlistCache !== void 0 ? oldBrowserlistCache : "UNDEFINED"}`,
                "Now: 1",
            ]);
            try {
                VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "Starting autoprefixer");
                const result = yield prefixer.process(css, {
                    from: filePath,
                    to: savePath,
                    map: {
                        inline: false,
                        prev: map,
                    },
                });
                result.warnings().forEach((warn) => {
                    var _a;
                    const body = [];
                    if ((_a = warn.node.source) === null || _a === void 0 ? void 0 : _a.input.file) {
                        body.push(warn.node.source.input.file + `:${warn.line}:${warn.column}`);
                    }
                    body.push(warn.text);
                    VscodeExtensions_1.OutputWindow.Show(warn.type === "warning" ? VscodeExtensions_1.OutputLevel.Warning : VscodeExtensions_1.OutputLevel.Error, `Autoprefix ${warn.type || "error"}`, body);
                });
                VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "Completed autoprefixer");
                return {
                    css: result.css,
                    map: generateMap ? result.map.toString() : null,
                };
            }
            finally {
                process.env.BROWSERSLIST_DISABLE_CACHE = oldBrowserlistCache;
                VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, `Restored BROWSERSLIST_DISABLE_CACHE to: ${oldBrowserlistCache !== null && oldBrowserlistCache !== void 0 ? oldBrowserlistCache : "UNDEFINED"}`);
            }
        });
    }
    //#endregion Private
    //#endregion Compilation functions
    //#region UI manipulation functions
    revertUIToWatchingStatus() {
        VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "Registered timeout to revert UI to correct watching status");
        setTimeout(() => {
            this.revertUIToWatchingStatusNow();
        }, 3000);
    }
    revertUIToWatchingStatusNow() {
        VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "Switching UI state");
        if (this.isWatching) {
            StatusbarUi_1.StatusBarUi.watching();
            VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Information, "Watching...");
        }
        else {
            StatusbarUi_1.StatusBarUi.notWatching();
            VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Information, "Not Watching...");
        }
    }
    //#endregion UI manipulation functions
    //#region Fetch & check SASS functions
    //#region Private
    isSassFile(pathUrl, partialSass = false) {
        const filename = path.basename(pathUrl);
        return ((partialSass || !filename.startsWith("_")) &&
            (filename.endsWith("sass") || filename.endsWith("scss")));
    }
    isSassFileExcluded(sassPath) {
        return __awaiter(this, void 0, void 0, function* () {
            VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "Checking SASS path isn't excluded", [
                `Path: ${sassPath}`,
            ]);
            const includeItems = helper_1.Helper.getConfigSettings("includeItems");
            let excludeItems = helper_1.Helper.getConfigSettings("excludeList"), fileList = ["**/*.s[a|c]ss"];
            if (includeItems && includeItems.length) {
                fileList = yield AppModel.stripAnyLeadingSlashes(includeItems.concat("**/_*.s[a|c]ss"));
            }
            excludeItems = yield AppModel.stripAnyLeadingSlashes(excludeItems);
            VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "Checking all workspace folders in project");
            const fileResult = yield Promise.all(vscode.workspace.workspaceFolders.map((folder, index) => __awaiter(this, void 0, void 0, function* () {
                VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, `Checking folder ${index + 1} of ${vscode.workspace.workspaceFolders.length}`, [`Folder: ${folder.name}`]);
                const forceBaseDirectory = helper_1.Helper.getConfigSettings("forceBaseDirectory", folder);
                let basePath = folder.uri.fsPath;
                if (forceBaseDirectory && forceBaseDirectory.length > 1) {
                    VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "`forceBaseDirectory` setting found, checking validity");
                    basePath = path.resolve(basePath, AppModel.stripLeadingSlash(forceBaseDirectory));
                    try {
                        if (!(yield fs_1.default.promises.stat(basePath)).isDirectory()) {
                            VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Critical, "Error with your `forceBaseDirectory` setting", [
                                `Path is not a folder: ${basePath}`,
                                `Setting: "${forceBaseDirectory}"`,
                                `Workspace folder: ${folder.name}`,
                            ]);
                            return null;
                        }
                    }
                    catch (_a) {
                        VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Critical, "Error with your `forceBaseDirectory` setting", [
                            `Can not find path: ${basePath}`,
                            `Setting: "${forceBaseDirectory}"`,
                            `Workspace folder: ${folder.name}`,
                        ]);
                        return null;
                    }
                    VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "No problem with path, changing from workspace folder", [`New folder: ${basePath}`]);
                }
                else {
                    VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "No base folder override found. Keeping workspace folder");
                }
                // @ts-ignore ts2322 => string[] doesn't match string (False negative as string[] is allowed)
                const isMatch = picomatch_1.default(fileList, { ignore: excludeItems, dot: true });
                VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "Searching folder");
                return ((yield new fdir_1.fdir()
                    .crawlWithOptions(basePath, {
                    filters: [
                        (filePath) => filePath.endsWith(".scss") || filePath.endsWith(".sass"),
                        (filePath) => isMatch(path.relative(basePath, filePath)),
                        (filePath) => filePath === sassPath,
                    ],
                    includeBasePath: true,
                    onlyCounts: true,
                    resolvePaths: true,
                    suppressErrors: true,
                })
                    .withPromise()).files > 0);
            })));
            // There was an error so stop processing
            if (fileResult.includes(null)) {
                return true;
            }
            // If doesn't include true then it's not been found
            if (fileResult.includes(true)) {
                VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "File found, not excluded");
                return false;
            }
            else {
                VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "File not found, must be excluded");
                return true;
            }
        });
    }
    getSassFiles(queryPattern = "**/[^_]*.s[a|c]ss", isQueryPatternFixed = false, isDebugging = false) {
        return __awaiter(this, void 0, void 0, function* () {
            VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "Getting SASS files", [
                `Query pattern: ${queryPattern}`,
                `Can be overwritten: ${!isQueryPatternFixed}`,
            ]);
            let excludedItems = isDebugging
                ? ["**/node_modules/**", ".vscode/**"]
                : helper_1.Helper.getConfigSettings("excludeList");
            const includeItems = helper_1.Helper.getConfigSettings("includeItems");
            if (!isQueryPatternFixed && includeItems && includeItems.length) {
                queryPattern = yield AppModel.stripAnyLeadingSlashes(includeItems);
                VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "Query pattern overwritten", [
                    `New pattern(s): "${includeItems.join('" , "')}"`,
                ]);
            }
            excludedItems = yield AppModel.stripAnyLeadingSlashes(excludedItems);
            const fileList = [];
            (yield Promise.all(vscode.workspace.workspaceFolders.map((folder, index) => __awaiter(this, void 0, void 0, function* () {
                VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, `Checking folder ${index + 1} of ${vscode.workspace.workspaceFolders.length}`, [`Folder: ${folder.name}`]);
                const forceBaseDirectory = helper_1.Helper.getConfigSettings("forceBaseDirectory", folder);
                let basePath = folder.uri.fsPath;
                if (forceBaseDirectory && forceBaseDirectory.length > 1) {
                    VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "`forceBaseDirectory` setting found, checking validity");
                    basePath = path.resolve(basePath, AppModel.stripLeadingSlash(forceBaseDirectory));
                    try {
                        if (!(yield fs_1.default.promises.stat(basePath)).isDirectory()) {
                            VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Critical, "Error with your `forceBaseDirectory` setting", [
                                `Path is not a folder: ${basePath}`,
                                `Setting: "${forceBaseDirectory}"`,
                                `Workspace folder: ${folder.name}`,
                            ]);
                            return null;
                        }
                    }
                    catch (_a) {
                        VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Critical, "Error with your `forceBaseDirectory` setting", [
                            `Can not find path: ${basePath}`,
                            `Setting: "${forceBaseDirectory}"`,
                            `Workspace folder: ${folder.name}`,
                        ]);
                        return null;
                    }
                    VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "No problem with path, changing from workspace folder", [`New folder: ${basePath}`]);
                }
                else {
                    VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "No base folder override found. Keeping workspace folder");
                }
                const isMatch = picomatch_1.default(queryPattern, {
                    // @ts-ignore ts2322 => string[] doesn't match string (False negative as string[] is allowed)
                    ignore: excludedItems,
                    dot: true,
                });
                return (yield new fdir_1.fdir()
                    .crawlWithOptions(basePath, {
                    filters: [
                        (filePath) => filePath.endsWith(".scss") || filePath.endsWith(".sass"),
                        (filePath) => isMatch(path.relative(basePath, filePath)),
                        (filePath) => isQueryPatternFixed || this.isSassFile(filePath, false),
                    ],
                    includeBasePath: true,
                    resolvePaths: true,
                    suppressErrors: true,
                })
                    .withPromise());
            })))).forEach((files) => {
                files === null || files === void 0 ? void 0 : files.forEach((file) => {
                    fileList.push(file);
                });
            });
            VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, `Found ${fileList.length} SASS files`);
            return fileList;
        });
    }
    //#endregion Private
    //#endregion Fetch & check SASS functions
    //#region Debugging
    debugInclusion() {
        return __awaiter(this, void 0, void 0, function* () {
            VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Critical, "Checking current file", null, false);
            try {
                if (!vscode.window.activeTextEditor) {
                    VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Critical, "No active file", [
                        "There isn't an active editor window to process",
                        "Click an open file so it can be checked",
                    ]);
                    return;
                }
                const sassPath = vscode.window.activeTextEditor.document.fileName;
                VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Critical, sassPath, null, true);
                if (!this.isSassFile(sassPath, true)) {
                    VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Critical, "Not a Sass file", [
                        "The file currently open in the editor window isn't a sass file",
                    ]);
                }
                else if (yield this.isSassFileExcluded(sassPath)) {
                    VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Critical, "File excluded", [
                        "The file is excluded based on your settings, please check your configuration",
                    ]);
                }
                else {
                    VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Critical, "File should get processed", [
                        "If the file isn't being processed, run `liveSass.command.debugFileList`",
                    ]);
                }
            }
            catch (err) {
                const sassPath = vscode.window.activeTextEditor
                    ? vscode.window.activeTextEditor.document.fileName
                    : "/* NO ACTIVE FILE, MESSAGE SHOULD HAVE BEEN THROWN */";
                yield this._logger.LogIssueWithAlert(`Unhandled error while checking the active file. Error message: ${err.message}`, {
                    file: sassPath,
                    error: VscodeExtensions_1.ErrorLogger.PrepErrorForLogging(err),
                });
            }
        });
    }
    debugFileList() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const outputInfo = [], exclusionList = helper_1.Helper.getConfigSettings("excludeList");
                if (vscode.window.activeTextEditor) {
                    outputInfo.push("--------------------", "Current File", "--------------------", vscode.window.activeTextEditor.document.fileName);
                }
                outputInfo.push("--------------------", "Current Include/Exclude Settings", "--------------------", `Include: [ ${(_b = (_a = helper_1.Helper.getConfigSettings("includeItems")) === null || _a === void 0 ? void 0 : _a.join(", ")) !== null && _b !== void 0 ? _b : "NULL"} ]`, `Exclude: [ ${exclusionList.join(", ")} ]`);
                outputInfo.push("--------------------", "Workspace Folders", "--------------------");
                vscode.workspace.workspaceFolders.map((folder) => {
                    outputInfo.push(`[${folder.index}] ${folder.name}\n${folder.uri.fsPath}`);
                });
                outputInfo.push("--------------------", "Included SASS Files", "--------------------");
                (yield this.getSassFiles()).map((file) => {
                    outputInfo.push(file);
                });
                outputInfo.push("--------------------", "Included Partial SASS Files", "--------------------");
                (yield this.getSassFiles("**/_*.s[a|c]ss", true)).map((file) => {
                    outputInfo.push(file);
                });
                outputInfo.push("--------------------", "Excluded SASS Files", "--------------------");
                if (exclusionList.length > 0) {
                    (yield this.getSassFiles(exclusionList, true, true)).map((file) => {
                        outputInfo.push(file);
                    });
                }
                else {
                    outputInfo.push("NONE");
                }
                VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Critical, "Extension Info", outputInfo);
            }
            catch (err) {
                const sassPath = vscode.window.activeTextEditor
                    ? vscode.window.activeTextEditor.document.fileName
                    : "/* NO ACTIVE FILE, DETAILS BELOW */";
                yield this._logger.LogIssueWithAlert(`Unhandled error while checking the active file. Error message: ${err.message}`, {
                    file: sassPath,
                    error: VscodeExtensions_1.ErrorLogger.PrepErrorForLogging(err),
                });
            }
        });
    }
    //#endregion Debugging
    static stripLeadingSlash(partialPath) {
        return ["\\", "/"].indexOf(partialPath.substr(0, 1)) >= 0
            ? partialPath.substr(1)
            : partialPath;
    }
    static stripAnyLeadingSlashes(stringArray) {
        return Promise.all(stringArray.map((file) => __awaiter(this, void 0, void 0, function* () {
            return AppModel.stripLeadingSlash(file);
        })));
    }
    dispose() {
        VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "Disposing app model");
        StatusbarUi_1.StatusBarUi.dispose();
        VscodeExtensions_1.OutputWindow.dispose();
        VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "App model disposed");
    }
}
exports.AppModel = AppModel;
//# sourceMappingURL=appModel.js.map