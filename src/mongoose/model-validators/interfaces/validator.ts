export interface Validator {
  validator: (prop: any) => boolean;
  message: string;
}
