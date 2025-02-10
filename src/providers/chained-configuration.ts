import { ConfigurationSource } from "../configuration-source.ts";
import { type IConfiguration } from "../types/configuration.ts";
import { ConfigurationBuilder } from "../configuration-builder.ts";
import { ThrowNullOrUndefined } from "../helpers.ts";
import { type TConfiguration } from "../types/configuration.ts";
import { type ConfigSourceOptions } from "../types/config-source-options.ts";

export class ChainedConfigurationSource extends ConfigurationSource<IConfiguration> {
  async build(): Promise<TConfiguration> {
    return this.dataOlder.configuration;
  }
}

declare module "../configuration-builder.ts" {
  export interface ConfigurationBuilder {
    /**
     * Adds a chained configuration source to the configuration builder.
     *
     * @param config - The configuration to be added.
     * @param options - Optional configuration source options.
     * @returns The configuration builder instance.
     */
    addConfiguration(config: IConfiguration, options?: ConfigSourceOptions): ConfigurationBuilder;
  }
}

function addConfiguration(
  this: ConfigurationBuilder,
  config: IConfiguration,
  options?: ConfigSourceOptions,
): ConfigurationBuilder {
  // Ensure the configuration is not null or undefined
  ThrowNullOrUndefined(config, "config");
  // Add the chained configuration source to the builder
  this.sources.add(new ChainedConfigurationSource(config, options));
  return this;
}

ConfigurationBuilder.prototype.addConfiguration = addConfiguration;
