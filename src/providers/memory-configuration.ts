import { ConfigurationSource } from "../configuration-source.ts";
import { TConfiguration } from "../types/configuration.ts";
import { ConfigurationBuilder } from "../configuration-builder.ts";
import { ThrowNullOrUndefined } from "../helpers.ts";
import { IConfiguration } from "../types/configuration.ts";
import { ConfigSourceOptions } from "../types/config-source-options.ts";
import { Configuration } from "../configuration.ts";

export class MemoryConfigurationSource extends ConfigurationSource<TConfiguration> {
  constructor(data: TConfiguration = {}, options?: ConfigSourceOptions) {
    super(data, options);
  }
  async build(): Promise<TConfiguration> {
    return structuredClone(this.dataOlder);
  }
}

declare module "../configuration-builder.ts" {
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
      config instanceof Configuration ? config.configuration : (config as TConfiguration),
      options,
    ),
  );
  return this;
}

ConfigurationBuilder.prototype.addInMemoryConfiguration = addInMemoryConfiguration;
