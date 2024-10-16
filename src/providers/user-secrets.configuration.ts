import { ConfigurationBuilder } from "../configuration-builder";
import { ThrowNullOrUndefined } from "../helpers";
import { env } from "node:process";
import { join } from "node:path";
import { PathLike } from "node:fs";
import { ConfigurationSource } from "../configuration-source";
import { TConfiguration } from "../types/configuration";
import { readFile as nodeReadFile } from "node:fs/promises";
import { ConfigSourceOptions } from "../types/config-source-options";

export class UserSecretsFileConfigurationSource extends ConfigurationSource<PathLike> {
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
    addUserSecretsConfiguration(
      id: string,
      path?: PathLike,
      options?: ConfigSourceOptions,
    ): ConfigurationBuilder;
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
    const p = env.HOME || env.home || env.appdata || env.userprofile;
    if (!p) {
      throw new Error("Could not set a root path for user secrets file");
    }
    path = join(p, ".config", id, "secrets.json");
  }
  this.sources.add(new UserSecretsFileConfigurationSource(path, options));
  return this;
}

ConfigurationBuilder.prototype.addUserSecretsConfiguration =
  addUserSecretsConfiguration;
