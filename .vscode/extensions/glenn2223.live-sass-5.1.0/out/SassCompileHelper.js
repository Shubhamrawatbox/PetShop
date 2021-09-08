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
exports.SassHelper = void 0;
//import { WindowPopout, OutputWindow } from "./VscodeExtensions";
const helper_1 = require("./helper");
const compiler = __importStar(require("sass"));
class SassHelper {
    static get instance() {
        return new SassHelper();
    }
    static targetCssFormat(format) {
        return {
            outputStyle: format,
        };
    }
    compileOne(SassPath, mapFileUri, options) {
        const generateMap = helper_1.Helper.getConfigSettings("generateMap"), data = {};
        Object.assign(data, options);
        data.file = SassPath;
        data.omitSourceMapUrl = true;
        /*data.logger = {
            warning: (warning: compiler.SassFlag) => {
                OutputWindow.Show(OutputLevel.Warning, "Warning:", warning.formatted.split("\n"));
                WindowPopout.Warn("Live Sass Compiler\n *Warning:* \n" + warning.formatted);
            },
            debug: (debug: compiler.SassFlag) => {
                OutputWindow.Show(OutputLevel.Debug, "Debug info:", debug.formatted.split("\n"));
            },
        };*/
        data.sourceMap = mapFileUri;
        if (!generateMap)
            data.omitSourceMapUrl = true;
        try {
            return { result: compiler.renderSync(data), errorString: null };
        }
        catch (err) {
            return { result: null, errorString: err.formatted };
        }
    }
}
exports.SassHelper = SassHelper;
//# sourceMappingURL=SassCompileHelper.js.map