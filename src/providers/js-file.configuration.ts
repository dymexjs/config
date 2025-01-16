import { ConfigurationSource } from "../configuration-source.ts";
import { TConfiguration } from "../types/configuration.ts";
import { ConfigurationBuilder } from "../configuration-builder.ts";
import { ThrowNullOrUndefined, isUndefined } from "../helpers.ts";
import { PathLike } from "node:fs";
import { ConfigSourceOptions } from "../types/config-source-options.ts";

export class JsFileConfigurationSource extends ConfigurationSource<PathLike> {
  async build(): Promise<TConfiguration> {
    const f = await this.readFile();
    const obj = !isUndefined(f.default) ? f.default : {};
    for (const [key, value] of Object.entries(f)) {
      if (key !== "default") {
        Object.defineProperty(obj, key, { value, enumerable: true, writable: true });
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
    /**
     * Adds a source of configuration from a js file.
     * Any exports will be cloned into the configuration object.
     * @param path - The path to the file.
     * @param options - Options for the source.
     * @returns The configuration builder instance.
     */
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
