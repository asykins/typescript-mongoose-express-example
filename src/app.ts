import { Api } from "./api/api";
import cors from "cors";
import { DocumentsController } from "./api/documents/controllers/v1/documents-controller";
import { apiVersioningMiddleware } from "./api/middlewares/api-versioning-middleware";

const app = new Api({
    port: 8081,
    controllers: [ new  DocumentsController()],
    middlewares: [  
        cors(), 
        apiVersioningMiddleware(
            {
                acceptedVersionHeaders: ["accept-header", "X-Version"],
                defaultVersion: "1.0.0",
                versionValidationRegex: /^v[0-9]+\.[0-9]+\.[0-9]+$/,
                apiTemplate: "/api/{version}",
                supportedVersions: ["1.0.0"] 
            }) 
    ],
    mongoDbConnectionString: "mongodb://localhost:27017/local"
});

app.connectAndListen();