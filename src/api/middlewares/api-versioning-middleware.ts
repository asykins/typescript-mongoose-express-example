import { Request, Response } from "express";

/**
 * Parameters sent to the middleware.
 * @param versionValidationRegex 
 * Regex used to validate that the version in the path of the requested url. 
 * /api/v.1.0.0/documents and /^v[0-9]+\.[0-9]+\.[0-9]+$/ will match.
 * @param apiTemplate
 * Serves as the template to look at the version in the path.
 * /api/{version} will look where {version} is declared to find the version.
 * @param acceptedVersionHeaders
 * Array defining the accepted versions headers to look for the version.
 * ["accept-version"] will look if the header is present to determine the version.
 * @param supportedVersions
 * Array defining the supported versions of the api.
 * ["1.0.0"] if any other version is supplied, a 400 response will be sent with supported versions.
 * @example
 * {
 *  versionTemplateRegex: /^v[0-9]+\.[0-9]+\.[0-9]+$/,
 *  apiTemplate: "/api/{version}",
 *  acceptedVersionHeaders: ["accept-version", "X-Version"],
 *  supportedVersion: ["1.0.0"]
 * }
 */
export interface VersionMiddlewareParams {
    versionValidationRegex: RegExp,
    apiTemplate: string,
    acceptedVersionHeaders: Array<string>,
    defaultVersion: string;
    supportedVersions: Array<string>
}

interface HasVersionResults {
    hasVersionHeader: boolean,
    hasVersionPath: boolean,
    versionHeader: string,
    versionPath: string
}

/**
 * @param params @see VersionMiddlewareParams
 * 
 * MiddleWare used append the version to the url if it is specified in the 
 * accepted headers or in the path. If none is found, a default version is supplied
 * @note path version is always the prefered choice over the default's and the header's.
 * @example
 * {
 *  versionTemplateRegex: /^v[0-9]+\.[0-9]+\.[0-9]+$/,
 *  apiTemplate: "/api/{version}",
 *  acceptedVersionHeaders: ["accept-version", "X-Version"],
 *  supportedVersion: ["1.0.0"]
 * }
 * 
 * "/api/document" (no headers) -> "/api/v1.0.0/document"
 * "/api/v1.0.0/document" (no headers) -> "/api/v1.0.0/document"
 * "/api/document" (accept-version: 1.0.0) -> "/api/v1.0.0/document"
 * "/api/v1.0.0/document" (accept-version: 2.0.0) -> "api/v1.0.0/document" 
 * "/api/1.0.0/document/" (no headers) -> 404 not found
 * "/api/1.0.0/document" (accept-header: 1.0.0) -> 404 not found
 * "/api/v2.0.0/document" (no headers)-> 400 with VersionMiddlewareParams
 * "/api/v2.0.0/document" (accept-header: 1.0.0)-> 400 with VersionMiddlewareParams 
 */
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
                    message: "The version provided isn't supported. Please verify the url schema and headers",
                    apiTemplate: params.apiTemplate,
                    versionFormat: params.versionValidationRegex.toString(),
                    supportedHeaders: params.acceptedVersionHeaders,
                    supportedVersions: params.supportedVersions,
                    defaultVersion: params.defaultVersion 
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

    if (params.apiTemplate.indexOf("/") != 0) {
        params.apiTemplate = `/${params.apiTemplate}`;
    }
    let templateFirstIndex = params.apiTemplate.indexOf("{");
    let templateSecondeIndex = req.url.indexOf("/", templateFirstIndex);
    let versionPath = req.url.substring(templateFirstIndex, templateSecondeIndex);
    let hasVersionPath = (Boolean)(versionPath.match(params.versionValidationRegex));

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

    var versionTemplateIndex = params.apiTemplate.split('/').length - 1;
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
