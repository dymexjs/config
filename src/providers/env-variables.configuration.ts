import { env } from "node:process";
import { TConfiguration } from "../types/configuration.ts";
import { ConfigurationBuilder } from "../configuration-builder.ts";
import { ConfigurationSource } from "../configuration-source.ts";
import { ThrowNullOrUndefined } from "../helpers.ts";
import { ConfigSourceOptions } from "../types/config-source-options.ts";

export class EnvVariablesConfigurationSource extends ConfigurationSource<string | Array<string>> {
  constructor(prefix: string | Array<string> = "", options?: ConfigSourceOptions) {
    super(prefix, options);
  }

  async build(): Promise<TConfiguration> {
    let obj = {};
    if (Array.isArray(this.dataOlder)) {
      for (const prefix of this.dataOlder) {
        obj = {
          ...obj,
          ...Object.fromEntries(Object.entries(env).filter(([key]) => key.startsWith(prefix))),
        };
      }
    } else {
      if (this.dataOlder === "") {
        return env as unknown as TConfiguration;
      }
      obj = Object.fromEntries(Object.entries(env).filter(([key]) => key.startsWith(this.dataOlder as string)));
    }

    return obj;
  }
}

declare module "../configuration-builder.ts" {
  export interface ConfigurationBuilder {
    addEnvVariablesConfiguration(prefix?: string | Array<string>, options?: ConfigSourceOptions): ConfigurationBuilder;
  }
}
function addEnvVariablesConfiguration(
  this: ConfigurationBuilder,
  prefix: string | Array<string> = "",
  options?: ConfigSourceOptions,
): ConfigurationBuilder {
  ThrowNullOrUndefined(prefix, "prefix");
  this.sources.add(new EnvVariablesConfigurationSource(prefix, options));
  return this;
}

ConfigurationBuilder.prototype.addEnvVariablesConfiguration = addEnvVariablesConfiguration;
