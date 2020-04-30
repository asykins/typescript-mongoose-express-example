import { Validator } from "./interfaces/validator";

export const IsNullOrWhiteSpace = {
    validator: function(prop:string) {
        if(prop && prop.trim().length) {
            return true;
        }
        else {
            return false;
        }
    },
    message: "{PATH} should not be null or contain only whitespaces"
} as Validator