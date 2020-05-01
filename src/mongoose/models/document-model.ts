import mongoose, { Schema, Document } from "mongoose";
import { IsNullOrWhiteSpace } from "../model-validators/not-null-or-whitespace";
import { DocumentModel } from "./interfaces/document-model-interface";

const documentSchema: Schema = new mongoose.Schema({
  path: { type: String, required: true, validate: IsNullOrWhiteSpace },
});

export default mongoose.model<DocumentModel>("Document", documentSchema);
