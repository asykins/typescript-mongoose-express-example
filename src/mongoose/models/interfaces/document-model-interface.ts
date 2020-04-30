import { Document } from "mongoose";

export interface DocumentModel extends Document
{
    path: string;
}