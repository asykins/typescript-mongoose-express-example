import { Api } from "./api/api";
import cors from "cors";
import { DocumentsController } from "./api/documents/controllers/v1/documents-controller";

const app = new Api({
    port: 8081,
    controllers: [ new  DocumentsController()],
    middlewares: [ cors() ],
    mongoDbConnectionString: "mongodb://localhost:27017/local"
});

app.connectAndListen();