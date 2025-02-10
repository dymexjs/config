import type { IConfiguration, TConfiguration } from "./configuration.ts";

export type ValidatorFunc = (config: TConfiguration) => Promise<TConfiguration | IConfiguration>;
