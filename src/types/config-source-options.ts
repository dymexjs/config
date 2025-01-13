import { ValidatorFunc } from "./validator-func.type.ts";

export interface ConfigSourceOptions {
  expandVariables?: boolean;
  validation?: ValidatorFunc;
}
