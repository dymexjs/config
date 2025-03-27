import type { ValidatorFunc } from "./validator-func.type.ts";

export interface ConfigSourceOptions {
  //Coerce types like number and boolean defaults to 'true'
  coerce?: boolean;
  //Expand environment variables defaults to 'true'
  expandVariables?: boolean;
  //Validation function to validate the configuration
  validation?: ValidatorFunc;
}
