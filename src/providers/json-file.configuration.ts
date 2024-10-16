import { ConfigurationSource } from "../configuration-source";
import { TConfiguration } from "../types/configuration";
import { ConfigurationBuilder } from "../configuration-builder";
import { ThrowNullOrUndefined } from "../helpers";
import { PathLike } from "node:fs";
import { readFile as nodeReadFile } from "node:fs/promises";
import { ConfigSourceOptions } from "../types/config-source-options";

export class JsonFileConfigurationSource extends ConfigurationSource<PathLike> {
  constructor(file: PathLike, options?: ConfigSourceOptions) {
    super(file, options);
  }
  async build(): Promise<TConfiguration> {
    const contents = await this.readFile();
    return JSON.parse(contents);
  }
  private async readFile(): Promise<string> {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    return nodeReadFile(this.dataOlder, { encoding: "utf8", flag: "r" });
  }
}

declare module "../configuration-builder" {
  export interface ConfigurationBuilder {
    addJsonFileConfiguration(
      path: PathLike,
      options?: ConfigSourceOptions,
    ): ConfigurationBuilder;
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

ConfigurationBuilder.prototype.addJsonFileConfiguration =
  addJsonFileConfiguration;
