import { ConfigurationSource } from "../configuration-source";
import { TConfiguration } from "../types/configuration";
import { ConfigurationBuilder } from "../configuration-builder";
import { ThrowNullOrUndefined } from "../helpers";
import { IConfiguration } from "../types/configuration";
import { ConfigSourceOptions } from "../types/config-source-options";
import { Configuration } from "../configuration";

export class MemoryConfigurationSource extends ConfigurationSource<TConfiguration> {
  constructor(data: TConfiguration = {}, options?: ConfigSourceOptions) {
    super(data, options);
  }
  async build(): Promise<TConfiguration> {
    return structuredClone(this.dataOlder);
  }
}

declare module "../configuration-builder" {
  export interface ConfigurationBuilder {
    addInMemoryConfiguration(
      config: TConfiguration | IConfiguration,
      options?: ConfigSourceOptions,
    ): ConfigurationBuilder;
  }
}
function addInMemoryConfiguration(
  this: ConfigurationBuilder,
  config: TConfiguration | IConfiguration,
  options?: ConfigSourceOptions,
): ConfigurationBuilder {
  ThrowNullOrUndefined(config, "config");
  this.sources.add(
    new MemoryConfigurationSource(
      config instanceof Configuration
        ? config.configuration
        : (config as TConfiguration),
      options,
    ),
  );
  return this;
}

ConfigurationBuilder.prototype.addInMemoryConfiguration =
  addInMemoryConfiguration;
