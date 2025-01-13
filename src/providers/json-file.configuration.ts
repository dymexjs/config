import { ConfigurationSource } from "../configuration-source.ts";
import { TConfiguration } from "../types/configuration.ts";
import { ConfigurationBuilder } from "../configuration-builder.ts";
import { ThrowNullOrUndefined } from "../helpers.ts";
import { PathLike } from "node:fs";
import { readFile as nodeReadFile } from "node:fs/promises";
import { ConfigSourceOptions } from "../types/config-source-options.ts";

export class JsonFileConfigurationSource extends ConfigurationSource<PathLike> {
  async build(): Promise<TConfiguration> {
    const contents = await this.readFile();
    return JSON.parse(contents);
  }
  private async readFile(): Promise<string> {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    return nodeReadFile(this.dataOlder, { encoding: "utf8", flag: "r" });
  }
}

declare module "../configuration-builder.ts" {
  export interface ConfigurationBuilder {
    addJsonFileConfiguration(path: PathLike, options?: ConfigSourceOptions): ConfigurationBuilder;
  }
}
function addJsonFileConfiguration(
  this: ConfigurationBuilder,
  path: PathLike,
  options?: ConfigSourceOptions,
): ConfigurationBuilder {
  ThrowNullOrUndefined(path, "path");
  this.sources.add(new JsonFileConfigurationSource(path, options));
  return this;
}

ConfigurationBuilder.prototype.addJsonFileConfiguration = addJsonFileConfiguration;
