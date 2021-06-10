import { PitStopServer } from "pitstop-server-cli";
import * as tmp from "tmp";

async function jobArrived(s: Switch, flowElement: FlowElement, job: Job) {
    let actionList = await flowElement.getPropertyStringValue("actionList") as string;
    let textToAdd = await flowElement.getPropertyStringValue("textToAdd") as string;
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

    let ps: PitStopServer;
    try {
        ps = new PitStopServer(psOptions);
        // "Text 1" is the name of the variable used in the action list (available in the script folder)
        await ps.createVariableSet([{ variable: "Text 1", type: "String", value: textToAdd }])
        let result = await ps.run();
        await job.log(LogLevel.Debug, JSON.stringify(result));
        await job.log(LogLevel.Debug, JSON.stringify(ps.debugMessages));

        let newJob = await job.createChild(outputPath); //complete folder
        await newJob.sendToData(Connection.Level.Success);
        await job.sendToNull();
    } catch (error) {
        await job.log(LogLevel.Debug, JSON.stringify(ps.debugMessages));
        await job.log(LogLevel.Debug, error.message);
        await job.sendToData(Connection.Level.Error);
    }
    await ps.cleanup();
}
