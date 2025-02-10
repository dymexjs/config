import { ConfigurationSource } from "../configuration-source.ts";
import { type TConfiguration } from "../types/configuration.ts";
import { ConfigurationBuilder } from "../configuration-builder.ts";
import { ThrowNullOrUndefined } from "../helpers.ts";
import { type PathLike } from "node:fs";
import { readFile as nodeReadFile } from "node:fs/promises";
import { type ConfigSourceOptions } from "../types/config-source-options.ts";

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
    /**
     * Adds a source of configuration from a JSON file.
     * The key:value pairs from the JSON file will be added to the configuration.
     *
     * @param path - The path to the JSON file.
     * @param options - Options for the configuration source.
     * @returns The configuration builder instance.
     */
    addJsonFileConfiguration(path: PathLike, options?: ConfigSourceOptions): ConfigurationBuilder;
  }
}

function addJsonFileConfiguration(
  this: ConfigurationBuilder,
  path: PathLike,
  options?: ConfigSourceOptions,
): ConfigurationBuilder {
  // Ensure the path is not null or undefined
  ThrowNullOrUndefined(path, "path");

  // Add the JSON file configuration source to the builder
  this.sources.add(new JsonFileConfigurationSource(path, options));

  // Return the configuration builder instance for chaining
  return this;
}

ConfigurationBuilder.prototype.addJsonFileConfiguration = addJsonFileConfiguration;
