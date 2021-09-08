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
exports.FileHelper = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const VscodeExtensions_1 = require("./VscodeExtensions");
class FileHelper {
    static writeToOneFile(targetFileUri, data) {
        VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, `Saving file`, [
            "Saving a file to the system",
            `Target: ${targetFileUri}`,
        ]);
        return new Promise((resolve) => {
            fs.writeFile(targetFileUri, data, "utf8", (err) => {
                resolve({
                    FileUri: targetFileUri,
                    Exception: err,
                });
            });
        });
    }
    static writeToMultipleFile(targetFileUris, data) {
        return new Promise((resolve) => {
            const promises = [];
            for (let i = 0; i < targetFileUris.length; i++) {
                promises.push(this.writeToOneFile(targetFileUris[i], data[i]));
            }
            Promise.all(promises).then((errList) => resolve(errList));
        });
    }
    static MakeDirIfNotAvailable(dir) {
        VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "Checking directory exists", [
            `Directory: ${dir}`,
        ], false);
        if (fs.existsSync(dir)) {
            VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "Directory exists, no action required");
            return;
        }
        if (!fs.existsSync(path.dirname(dir))) {
            VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "NO PARENT DIRECTORY", [
                "Parent directory doesn't exist, we must create it",
            ]);
            this.MakeDirIfNotAvailable(path.dirname(dir));
        }
        VscodeExtensions_1.OutputWindow.Show(VscodeExtensions_1.OutputLevel.Trace, "Directory doesn't exist, creating it");
        fs.mkdirSync(dir);
    }
}
exports.FileHelper = FileHelper;
//# sourceMappingURL=FileHelper.js.map