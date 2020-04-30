import { Request, Response } from "express";

export interface VersionMiddlewareParams {
    regex: RegExp,
    template: string,
    acceptedVersionHeaders: Array<string>,
    defaultVersion: string;
    supportedVersions: Array<string>
}

export interface HasVersionResults {
    hasVersionHeader: boolean,
    hasVersionPath: boolean,
    versionHeader: string,
    versionPath: string
}

export let apiVersioningMiddleware = (params: VersionMiddlewareParams) => {
    return (req: Request, rep: Response, next: any): any => {
        let hasVersionResults: HasVersionResults = hasVersion(req, params);
        if(hasVersionResults.hasVersionPath || hasVersionResults.hasVersionHeader){
            let version = hasVersionResults.hasVersionPath 
                          ? hasVersionResults.versionPath
                          : req.header(hasVersionResults.versionHeader);
            let isVersionValid = version === undefined ? false: isVersionSupported(version, params.supportedVersions);
            if(!isVersionValid){
                rep.status(400).json({ 
                    message: "The version provided isn't supported yet.",
                    supportedVersions: params.supportedVersions 
                });
            } else if(hasVersionResults.versionHeader && !hasVersionResults.hasVersionPath){
                req.url =  AppendVersion(req.url, version, params);
            }
        } else {
            req.url = AppendVersion(req.url, params.defaultVersion, params);
        }
        next();
    }
}
    
const hasVersion = (req: Request, params: VersionMiddlewareParams): HasVersionResults =>{
    let hasVersionHeader: boolean = false;
    let versionHeader: string = "";
    if(params.acceptedVersionHeaders && params.acceptedVersionHeaders.length){
        params.acceptedVersionHeaders.forEach(header => {
            if(req.header(header)) {
                hasVersionHeader = true;
                versionHeader = header;
            }
        });
    }

    if (params.template.indexOf("/") != 0) {
        params.template = `/${params.template}`;
    }
    let templateFirstIndex = params.template.indexOf("{");
    let templateSecondeIndex = req.url.indexOf("/", templateFirstIndex);
    let versionPath = req.url.substring(templateFirstIndex, templateSecondeIndex);
    let hasVersionPath = (Boolean)(versionPath.match(params.regex));

    return {
        hasVersionHeader: hasVersionHeader,
        hasVersionPath: hasVersionPath,
        versionPath: versionPath,
        versionHeader: versionHeader
    };
} 

const AppendVersion = (url: string, version: string | undefined, params: VersionMiddlewareParams): string => {

    if(version === undefined) {
        throw new Error("Version is undefined, please verify the parameters passed to the middleware");
    }

    version = version.replace("v", '');

    var versionTemplateIndex = params.template.split('/').length - 1;
    var splittedRoute = url.split("/");
    splittedRoute.splice(versionTemplateIndex, 0, `v${version}`);
    return splittedRoute.join("/");
}

const isVersionSupported = (version: string, supportedVersions: Array<string>): Boolean => {
    let vLessVersion = version.replace("v", "");
    if(!supportedVersions.some(x => x === vLessVersion)){
        return false;
    }
    return true;
}
