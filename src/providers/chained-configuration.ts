import { ConfigurationSource } from "../configuration-source";
import { IConfiguration } from "../types/configuration";
import { ConfigurationBuilder } from "../configuration-builder";
import { ThrowNullOrUndefined } from "../helpers";
import { TConfiguration } from "../types/configuration";
import { ConfigSourceOptions } from "../types/config-source-options";

export class ChainedConfigurationSource extends ConfigurationSource<IConfiguration> {
  constructor(config: IConfiguration, options?: ConfigSourceOptions) {
    super(config, options);
  }

  async build(): Promise<TConfiguration> {
    return this.dataOlder.configuration;
  }
}

declare module "../configuration-builder" {
  export interface ConfigurationBuilder {
    addConfiguration(
      config: IConfiguration,
      options?: ConfigSourceOptions,
    ): ConfigurationBuilder;
  }
}

function addConfiguration(
  this: ConfigurationBuilder,
  config: IConfiguration,
  options?: ConfigSourceOptions,
): ConfigurationBuilder {
  ThrowNullOrUndefined(config, "config");
  this.sources.add(new ChainedConfigurationSource(config, options));
  return this;
}

ConfigurationBuilder.prototype.addConfiguration = addConfiguration;
