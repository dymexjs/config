import { ConfigurationSource } from "../configuration-source.ts";
import { TConfiguration } from "../types/configuration.ts";
import { ConfigurationBuilder } from "../configuration-builder.ts";
import { ThrowNullOrUndefined, isUndefined } from "../helpers.ts";
import { PathLike } from "node:fs";
import { ConfigSourceOptions } from "../types/config-source-options.ts";

export class JsFileConfigurationSource extends ConfigurationSource<PathLike> {
  async build(): Promise<TConfiguration> {
    const f = await this.readFile();
    const obj = !isUndefined(f.default) ? structuredClone(f.default) : {};
    for (const [key, value] of Object.entries(f)) {
      if (key !== "default") {
        Reflect.set(obj, key, structuredClone(value));
      }
    }
    return obj;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async readFile(): Promise<any> {
    const f = await import(this.dataOlder.toString());
    return f;
  }
}

declare module "../configuration-builder.ts" {
  export interface ConfigurationBuilder {
    addJsFileConfiguration(path: PathLike, options?: ConfigSourceOptions): ConfigurationBuilder;
  }
}
function addJsFileConfiguration(
  this: ConfigurationBuilder,
  path: PathLike,
  options?: ConfigSourceOptions,
): ConfigurationBuilder {
  ThrowNullOrUndefined(path, "path");
  this.sources.add(new JsFileConfigurationSource(path, options));
  return this;
}

ConfigurationBuilder.prototype.addJsFileConfiguration = addJsFileConfiguration;
