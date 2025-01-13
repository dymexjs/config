import { ConfigurationSource } from "../configuration-source.ts";
import { IConfiguration } from "../types/configuration.ts";
import { ConfigurationBuilder } from "../configuration-builder.ts";
import { ThrowNullOrUndefined } from "../helpers.ts";
import { TConfiguration } from "../types/configuration.ts";
import { ConfigSourceOptions } from "../types/config-source-options.ts";

export class ChainedConfigurationSource extends ConfigurationSource<IConfiguration> {
  async build(): Promise<TConfiguration> {
    return this.dataOlder.configuration;
  }
}

declare module "../configuration-builder.ts" {
  export interface ConfigurationBuilder {
    addConfiguration(config: IConfiguration, options?: ConfigSourceOptions): ConfigurationBuilder;
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
