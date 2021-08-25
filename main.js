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
const pitstop_server_cli_1 = require("@enfocussw/pitstop-server-cli");
const tmp = __importStar(require("tmp"));
async function jobArrived(s, flowElement, job) {
    if (job.getName(true).toLowerCase().endsWith(".pdf") == false) {
        await job.log(LogLevel.Error, "Job is not a pdf, job sent to the error connection", []);
        await job.sendToData(Connection.Level.Error);
    }
    else {
        let actionList = await flowElement.getPropertyStringValue("actionList");
        let textToAdd = await flowElement.getPropertyStringValue("textToAdd");
        let reportLanguage = await flowElement.getPropertyStringValue("reportLanguage");
        reportLanguage = languageCode(reportLanguage);
        let jobPath = await job.get(AccessLevel.ReadOnly);
        let jobNameProper = job.getName(false);
        let outputPath = tmp.dirSync().name;
        let psOptions = {
            inputPDF: jobPath,
            actionLists: [actionList],
            //preflightProfile: "/path/to/My Preflight Profile.ppp",
            outputFolder: outputPath,
            outputPDFName: jobNameProper + "_output.pdf",
            xmlReport: true,
            xmlReportName: jobNameProper + "_report.xml",
            pdfReport: true,
            pdfReportName: jobNameProper + "_report.pdf",
            taskReport: false,
            language: reportLanguage
        };
        let ps;
        try {
            ps = new pitstop_server_cli_1.PitStopServer(psOptions);
            // "Text 1" is the name of the variable used in the action list (available in the script folder)
            await ps.createVariableSet([{ variable: "Text 1", type: "String", value: textToAdd }]);
            let result = await ps.run();
            await job.log(LogLevel.Debug, JSON.stringify(result));
            await job.log(LogLevel.Debug, JSON.stringify(ps.debugMessages));
            await job.log(LogLevel.Debug, "Execution time: %1", [ps.executionTime]);
            if (result.exitCode !== 0) {
                await job.log(LogLevel.Error, result.stderr);
                await job.sendToData(Connection.Level.Error);
            }
            else {
                let newJob = await job.createChild(outputPath); //complete folder
                await newJob.sendToData(Connection.Level.Success, jobNameProper);
                await job.sendToNull();
            }
        }
        catch (error) {
            await job.log(LogLevel.Debug, JSON.stringify(ps.debugMessages));
            await job.log(LogLevel.Debug, error.message);
            await job.sendToData(Connection.Level.Error);
        }
        await ps.cleanup();
    }
}
function languageCode(reportLanguage) {
    if (reportLanguage == "German") {
        return "deDE";
    }
    else if (reportLanguage == "French") {
        return "frFR";
    }
    else if (reportLanguage == "Dutch") {
        return "nlNL";
    }
    else if (reportLanguage == "Italian") {
        return "itIT";
    }
    else if (reportLanguage == "Spanish") {
        return "esES";
    }
    else if (reportLanguage == "Polish") {
        return "plPL";
    }
    else if (reportLanguage == "Portuguese") {
        return "ptBR";
    }
    else if (reportLanguage == "Chinese") {
        return "zhCN";
    }
    else if (reportLanguage == "Japanese") {
        return "jaJP";
    }
    else {
        return "enUS";
    }
}
//# sourceMappingURL=main.js.map