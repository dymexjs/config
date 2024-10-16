import { IConfiguration, TConfiguration } from "./configuration";

export type ValidatorFunc = (
  config: TConfiguration,
) => Promise<TConfiguration | IConfiguration>;
