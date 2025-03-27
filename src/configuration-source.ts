import type { TConfiguration } from "./types/configuration.ts";
import { coerce, interpolate, isObject, resolveEscapeSequence } from "./helpers.ts";
import type { ConfigSourceOptions } from "./types/config-source-options.ts";
import type { IConfiguration } from "./types/configuration.ts";
import type { ValidatorFunc } from "./types/validator-func.type.ts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class ConfigurationSource<T = any> {
  protected dataOlder: T;
  protected expandVariables = true;
  protected coerce = true;
  protected validation: ValidatorFunc = (config) => Promise.resolve(config);

  constructor(dataOlder: T, options: ConfigSourceOptions = {}) {
    this.dataOlder = dataOlder;
    this.expandVariables = options.expandVariables ?? true;
    this.coerce = options.coerce ?? true;
    this.validation = options.validation ?? ((config) => Promise.resolve(config));
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async preBuild(): Promise<void> {}
  abstract build(): Promise<TConfiguration>;
  async postBuild(config: TConfiguration, configuration: IConfiguration): Promise<TConfiguration> {
    if (this.expandVariables) {
      this.expand(config, configuration);
    }
    return this.validation(config) as Promise<TConfiguration>;
  }

  expand(obj: TConfiguration, config: IConfiguration): TConfiguration {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string") {
        let valueAux = interpolate(value, obj, config);
        valueAux = resolveEscapeSequence(valueAux);
        Object.defineProperty(obj, key, {
          value: this.coerce && typeof valueAux === "string" ? coerce(valueAux) : valueAux,
          enumerable: true,
          writable: true,
        });
      } else if (isObject(value)) {
        this.expand(value, config);
      }
    }
    return obj;
  }
}
