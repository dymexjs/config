import { TConfiguration } from "./types/configuration";
import { expand } from "./helpers";
import { ConfigSourceOptions } from "./types/config-source-options";
import { IConfiguration } from "./types/configuration";
import { ValidatorFunc } from "./types/validator-func.type";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class ConfigurationSource<T = any> {
  protected dataOlder: T;
  protected expandVariables: boolean = true;
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

  async preBuild(): Promise<void> {}
  abstract build(): Promise<TConfiguration>;
  async postBuild(
    config: TConfiguration,
    configuration: IConfiguration,
  ): Promise<TConfiguration> {
    if (this.expandVariables) {
      expand(config, configuration);
    }
    return this.validation(config) as Promise<TConfiguration>;
  }
}
