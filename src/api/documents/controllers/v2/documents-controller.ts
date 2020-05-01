import { ApiController } from "../../../abstracts/api-controller";
import { Request, Response } from "express";
import mongoose from "mongoose";
import DocumentModel from "../../../../mongoose/models/document-model"


export class DocumentsController extends ApiController
{
    defaultRoute: string = "/api/v2.0.0/document";

    constructor(){
        super();
        this.initRoutes();
    }
    protected initRoutes(): void {
        this.router.get(this.defaultRoute, this.get);
        this.router.get(`${this.defaultRoute}/:id`, this.getById);
    }
    
    public async getById(request: Request, response: Response) {
        DocumentModel.findById(mongoose.Types.ObjectId(request.params.id))
                     .exec().then(doc => {
                        if(!doc){
                            response.status(400).json(
                                { 
                                    data: null,
                                    error: "The specified document was not found" 
                                });
                        } else {
                            response.status(200).json({
                                data: doc
                            });
                        }
                     }).catch(error => {
                         response.status(500).json({
                             error: error,
                             message: "An error occured"
                         })
                     })
    }

    public async get(request: Request, response: Response) {
        DocumentModel.find().exec()
                     .then(docs => {
                         response.status(200).json({
                            data: docs
                        })
                     })
                     .catch(error => {
                         response.status(500)   
                                 .json({
                                     message: "An error occured",
                                     error: error
                                 })        
                     });
    
    }                
}