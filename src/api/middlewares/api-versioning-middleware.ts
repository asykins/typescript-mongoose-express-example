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
  versionValidationRegex: RegExp;
  apiTemplate: string;
  acceptedVersionHeaders: Array<string>;
  defaultVersion: string;
  supportedVersions: Array<string>;
}

interface HasVersionResults {
  hasVersionHeader: boolean;
  hasVersionPath: boolean;
  versionHeader: string;
  versionPath: string;
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
  return (req: Request, res: Response, next: any): any => {
    const hasVersionResults: HasVersionResults = hasVersion(req, params);
    if (
      hasVersionResults.hasVersionPath ||
      hasVersionResults.hasVersionHeader
    ) {
      const { isVersionValid, version } = isVersionSupported(
        req,
        hasVersionResults,
        params.supportedVersions
      );
      if (!isVersionValid) {
        res.status(400).json({
          message: `The version ${version} isn't supported. Please verify the url schema and headers`,
          apiTemplate: params.apiTemplate,
          versionFormat: params.versionValidationRegex.toString(),
          supportedHeaders: params.acceptedVersionHeaders,
          supportedVersions: params.supportedVersions,
          defaultVersion: params.defaultVersion,
        });
      } else if (
        hasVersionResults.versionHeader &&
        !hasVersionResults.hasVersionPath
      ) {
        req.url = AppendVersion(req.url, version, params);
      }
    } else {
      req.url = AppendVersion(req.url, params.defaultVersion, params);
    }
    next();
  };
};

const hasVersion = (
  req: Request,
  params: VersionMiddlewareParams
): HasVersionResults => {
  let hasVersionHeader: boolean = false;
  let versionHeader: string = "";
  if (params.acceptedVersionHeaders && params.acceptedVersionHeaders.length) {
    params.acceptedVersionHeaders.forEach((header) => {
      if (req.header(header)) {
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
  let hasVersionPath = Boolean(
    versionPath.match(params.versionValidationRegex)
  );

  return {
    hasVersionHeader: hasVersionHeader,
    hasVersionPath: hasVersionPath,
    versionPath: versionPath,
    versionHeader: versionHeader,
  };
};

const AppendVersion = (
  url: string,
  version: string,
  params: VersionMiddlewareParams
): string => {
  const versionTemplateIndex = params.apiTemplate.split("/").length - 1;
  let splittedRoute = url.split("/");
  splittedRoute.splice(versionTemplateIndex, 0, `v${version.replace("v", "")}`);
  return splittedRoute.join("/");
};

const isVersionSupported = (
  request: Request,
  hasVersionResults: HasVersionResults,
  supportedVersions: Array<string>
) => {
  let version = hasVersionResults.hasVersionPath
    ? hasVersionResults.versionPath
    : String(request.header(hasVersionResults.versionHeader));
  if (!supportedVersions.some((x) => x === version.replace("v", ""))) {
    return { isVersionValid: false, version: version };
  }
  return { isVersionValid: true, version: version };
};
