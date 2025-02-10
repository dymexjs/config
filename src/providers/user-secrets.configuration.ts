import { ConfigurationBuilder } from "../configuration-builder.ts";
import { ThrowNullOrUndefined } from "../helpers.ts";
import { env } from "node:process";
import { join } from "node:path";
import { type PathLike } from "node:fs";
import { ConfigurationSource } from "../configuration-source.ts";
import { type TConfiguration } from "../types/configuration.ts";
import { readFile as nodeReadFile } from "node:fs/promises";
import { type ConfigSourceOptions } from "../types/config-source-options.ts";

export class UserSecretsFileConfigurationSource extends ConfigurationSource<PathLike> {
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
     * Adds a user secrets configuration source to the configuration builder.
     * The user secrets configuration source will search for a file in the user's
     * home directory (or the appdata directory on Windows) with the given id and
     * the name "secrets.json".
     * @param id - The id of the user secrets configuration source.
     * @param path - The path to the file. If not provided, it will be determined
     *               based on the user's home directory.
     * @param options - Options for the source.
     * @returns The configuration builder instance.
     */
    addUserSecretsConfiguration(id: string, path?: PathLike, options?: ConfigSourceOptions): ConfigurationBuilder;
  }
}

function addUserSecretsConfiguration(
  this: ConfigurationBuilder,
  id: string,
  path?: PathLike,
  options?: ConfigSourceOptions,
): ConfigurationBuilder {
  ThrowNullOrUndefined(id, "id");
  if (!path) {
    const homePaths = [env.HOME, env.home, env.appdata, env.userprofile];
    const p = homePaths.find((x) => x !== undefined);
    if (!p) {
      throw new Error("Could not determine a root path for user secrets file");
    }
    path = join(p, ".config", id, "secrets.json");
  }
  this.sources.add(new UserSecretsFileConfigurationSource(path, options));
  return this;
}

ConfigurationBuilder.prototype.addUserSecretsConfiguration = addUserSecretsConfiguration;
