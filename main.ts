import { PitStopServer, PitStopServerOptions, VariableSetOptions } from "@enfocussw/pitstop-server-cli";
import * as tmp from "tmp";

async function jobArrived(s: Switch, flowElement: FlowElement, job: Job) {
    if (job.getName(true).toLowerCase().endsWith(".pdf") == false) {
        await job.log(LogLevel.Error, "Job is not a pdf, job sent to the error connection", []);
        await job.sendToData(Connection.Level.Error);
    } else {
        let actionList = await flowElement.getPropertyStringValue("actionList") as string;
        let textToAdd = await flowElement.getPropertyStringValue("textToAdd") as string;
        let reportLanguage = await flowElement.getPropertyStringValue("reportLanguage") as string;
        reportLanguage = languageCode(reportLanguage);
        let jobPath = await job.get(AccessLevel.ReadOnly);
        let jobNameProper = job.getName(false);
        let outputPath = tmp.dirSync().name;

        let psOptions: PitStopServerOptions = {
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

        let ps: PitStopServer;
        try {
            ps = new PitStopServer(psOptions);
            // "Text 1" is the name of the variable used in the action list (available in the script folder)
            await ps.createVariableSet([{ variable: "Text 1", type: "String", value: textToAdd }])
            let result = await ps.run();
            await job.log(LogLevel.Debug, JSON.stringify(result));
            await job.log(LogLevel.Debug, JSON.stringify(ps.debugMessages));
            await job.log(LogLevel.Debug, "Execution time: %1", [ps.executionTime]);
            if (result.exitCode !== 0) {
                await job.log(LogLevel.Error, result.stderr);
                await job.sendToData(Connection.Level.Error);
            } else {
                let newJob = await job.createChild(outputPath); //complete folder
                await newJob.sendToData(Connection.Level.Success, jobNameProper);
                await job.sendToNull();
            }
        } catch (error) {
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
    } else if (reportLanguage == "French") {
        return "frFR";
    } else if (reportLanguage == "Dutch") {
        return "nlNL";
    } else if (reportLanguage == "Italian") {
        return "itIT";
    } else if (reportLanguage == "Spanish") {
        return "esES";
    } else if (reportLanguage == "Polish") {
        return "plPL";
    } else if (reportLanguage == "Portuguese") {
        return "ptBR";
    } else if (reportLanguage == "Chinese") {
        return "zhCN";
    } else if (reportLanguage == "Japanese") {
        return "jaJP";
    } else {
        return "enUS";
    }
}