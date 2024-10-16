import { ValidatorFunc } from "./validator-func.type";

export type ConfigSourceOptions = {
  expandVariables?: boolean;
  validation?: ValidatorFunc;
};
