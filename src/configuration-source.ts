import { type TConfiguration } from "./types/configuration.ts";
import { expand } from "./helpers.ts";
import { type ConfigSourceOptions } from "./types/config-source-options.ts";
import { type IConfiguration } from "./types/configuration.ts";
import { type ValidatorFunc } from "./types/validator-func.type.ts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class ConfigurationSource<T = any> {
  protected dataOlder: T;
  protected expandVariables = true;
  protected validation: ValidatorFunc = (config) => Promise.resolve(config);

  constructor(dataOlder: T, options: ConfigSourceOptions = {}) {
    this.dataOlder = dataOlder;
    if (options.expandVariables) {
      this.expandVariables = options.expandVariables as boolean;
    }
    if (options.validation) {
      this.validation = options.validation;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async preBuild(): Promise<void> {}
  abstract build(): Promise<TConfiguration>;
  async postBuild(config: TConfiguration, configuration: IConfiguration): Promise<TConfiguration> {
    if (this.expandVariables) {
      expand(config, configuration);
    }
    return this.validation(config) as Promise<TConfiguration>;
  }
}
