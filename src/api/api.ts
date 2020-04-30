import { ApiInit } from "./api-init";
import mongoose, { mongo } from "mongoose";
import express, { Application } from "express";
import { ApiController } from "./abstracts/api-controller";

export class Api 
{
    private app: Application;
    private port: number;
    private connectionString?: string;

    constructor(init: ApiInit)
    {
        this.app = express();
        this.port = init.port;
        this.connectionString = init.mongoDbConnectionString;
        this.useMiddleWares(init.middlewares);
        this.useRoutes(init.controllers);
    }

    private useMiddleWares(middlewares: any[]): void {
        if(middlewares && middlewares.length) {
            middlewares.forEach(middleware => {
                this.app.use(middleware);
            });
        }
    }

    private useRoutes(controllers: ApiController[]): void {
        if(controllers && controllers.length) {
            controllers.forEach(controller => {
                this.app.use("/", controller.router)
            });
        }
    }

    public connectAndListen(){
        if(this.connectionString) {
            mongoose.connect("mongodb://localhost:27017/local", { useNewUrlParser: true });
            const database = mongoose.connection;
            database.on("error", console.error.bind(console, "connection error: "));
            database.once("open", () => { this.listen(); });
        } else {
            this.listen();
        }
    }

    private listen(): void {
        this.app.listen(this.port, () => {
            console.log(`App listening on the http://localhost:${this.port}`)
        })
    }
}