import { ConfigurationSource } from "../configuration-source.ts";
import { type TConfiguration } from "../types/configuration.ts";
import { ConfigurationBuilder } from "../configuration-builder.ts";
import { ThrowNullOrUndefined } from "../helpers.ts";
import { type IConfiguration } from "../types/configuration.ts";
import { type ConfigSourceOptions } from "../types/config-source-options.ts";
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
    /**
     * Adds a source of configuration from a memory object.
     * @param config - The configuration object to be added.
     * @param options - Options for the source.
     * @returns The configuration builder instance.
     */
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
  // Ensure the configuration object is not null or undefined
  // Add the memory configuration source to the builder
  this.sources.add(
    new MemoryConfigurationSource(
      // If the configuration is an instance of Configuration, use its internal configuration object
      // Otherwise, use the configuration object directly
      config instanceof Configuration ? config.configuration : (config as TConfiguration),
      options,
    ),
  );
  // Return the configuration builder instance for chaining
  return this;
}

ConfigurationBuilder.prototype.addInMemoryConfiguration = addInMemoryConfiguration;
