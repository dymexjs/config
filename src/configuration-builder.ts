import { Configuration } from "./configuration.ts";
import { ConfigurationSource } from "./configuration-source.ts";
import { ThrowNullOrUndefined } from "./helpers.ts";
import type { IConfiguration, TConfiguration } from "./types/configuration.ts";
import type { ValidatorFunc } from "./types/validator-func.type.ts";

export class ConfigurationBuilder {
  #_sources = new Set<ConfigurationSource<unknown>>();
  #_validator: ValidatorFunc;
  get sources(): Set<ConfigurationSource<unknown>> {
    return this.#_sources;
  }
  constructor(validator: ValidatorFunc = (config) => Promise.resolve(config)) {
    this.#_validator = validator;
  }
  add(source: ConfigurationSource<unknown>): ConfigurationBuilder {
    ThrowNullOrUndefined(source, "source");
    if (!(source instanceof ConfigurationSource)) {
      throw new Error("'source' must be instance of ConfigurationSource");
    }
    this.#_sources.add(source);
    return this;
  }
  async build(): Promise<IConfiguration> {
    const configuration = new Configuration();
    for (const source of this.#_sources) {
      await source.preBuild();
      let config = await source.build();
      config = await source.postBuild(config, configuration);
      configuration.set(config);
    }
    const configurationAux = await this.#_validator(configuration.configuration);
    if (configurationAux instanceof Configuration) {
      return configurationAux;
    } else {
      return new Configuration(configurationAux as TConfiguration);
    }
  }
}
