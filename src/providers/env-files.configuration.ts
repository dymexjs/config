import type { PathLike } from "node:fs";
import { readFile as nodeReadFile } from "node:fs/promises";
import type { TConfiguration } from "../types/configuration.ts";
import { ConfigurationSource } from "../configuration-source.ts";
import { ENV_LINE } from "../constants.ts";
import { ConfigurationBuilder } from "../configuration-builder.ts";
import { ThrowNullOrUndefined } from "../helpers.ts";
import type { ConfigSourceOptions } from "../types/config-source-options.ts";

export class EnvFilesConfigurationSource extends ConfigurationSource<PathLike> {
  async build(): Promise<TConfiguration> {
    const contents = await this.readFile();
    return this.parse(contents);
  }

  private async readFile(): Promise<string> {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    return nodeReadFile(this.dataOlder, { encoding: "utf8", flag: "r" });
  }
  private parse(content: string): TConfiguration {
    const obj = {};
    const contents = content.replace(/\r\n?/gm, "\n");

    let match;
    while ((match = ENV_LINE.exec(contents)) !== null) {
      const key = match[1].trim();
      let value = (match[3] || match[4] || "").trim(); // Match[3] é para valores multilinha, match[4] para valores simples

      // Remove surrounding quotes
      value = value.replace(/^(['"`])([\s\S]*)\1$/gm, "$2");

      // Expand newlines if double quoted
      if (match[3]) {
        value = value.replace(/\\n/g, "\n");
        value = value.replace(/\\r/g, "\r");
      }

      // Add to object
      Object.defineProperty(obj, key, { value, enumerable: true, writable: true });
    }
    return obj;
  }
}

declare module "../configuration-builder.ts" {
  export interface ConfigurationBuilder {
    /**
     * Adds a source of configuration from a file containing environment variables.
     * The file should have the format of a .env file, with each line being a key-value pair of the form `KEY=VALUE`.
     * The values can be either single-lined or multi-lined.
     * The values can contain newlines and tabs.
     * The values can contain substitutions of the form `${KEY}` which will be replaced with the value of the environment variable with the same name.
     * The values can contain comments of the form `# comment`, which will be ignored.
     * @param path - The path to the file.
     * @param options - Options for the source.
     * @returns The configuration builder instance.
     */
    addEnvFileConfiguration(path: PathLike, options?: ConfigSourceOptions): ConfigurationBuilder;
  }
}

function addEnvFileConfiguration(
  this: ConfigurationBuilder,
  path: PathLike,
  options?: ConfigSourceOptions,
): ConfigurationBuilder {
  ThrowNullOrUndefined(path, "path");
  this.sources.add(new EnvFilesConfigurationSource(path, options));
  return this;
}

ConfigurationBuilder.prototype.addEnvFileConfiguration = addEnvFileConfiguration;
