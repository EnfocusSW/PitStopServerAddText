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
const pitstop_server_cli_1 = require("pitstop-server-cli");
const tmp = __importStar(require("tmp"));
async function jobArrived(s, flowElement, job) {
    let actionList = await flowElement.getPropertyStringValue("actionList");
    let textToAdd = await flowElement.getPropertyStringValue("textToAdd");
    let jobPath = await job.get(AccessLevel.ReadOnly);
    let outputPath = tmp.dirSync().name;
    let psOptions = {
        inputPDF: jobPath,
        actionLists: [actionList],
        //preflightProfile: "/path/to/My Preflight Profile.ppp",
        outputFolder: outputPath,
        xmlReport: true,
        pdfReport: true,
        taskReport: false,
    };
    let ps;
    try {
        ps = new pitstop_server_cli_1.PitStopServer(psOptions);
        await ps.createVariableSet([{ variable: "Text 1", type: "String", value: textToAdd }]);
        let result = await ps.run();
        await job.log(LogLevel.Debug, JSON.stringify(result));
        await job.log(LogLevel.Debug, JSON.stringify(ps.debugMessages));
        let newJob = await job.createChild(outputPath); //complete folder
        await newJob.sendToData(Connection.Level.Success);
        await job.sendToNull();
    }
    catch (error) {
        await job.log(LogLevel.Debug, JSON.stringify(ps.debugMessages));
        await job.log(LogLevel.Debug, error.message);
        await job.sendToData(Connection.Level.Error);
    }
    await ps.cleanup();
}
//# sourceMappingURL=main.js.map