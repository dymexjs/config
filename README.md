# Dymexjs/config

Dymexjs stands for DYnamic, Modular, EXtensible JavaScript/Typescript framework.

[![Released under the MIT license.](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](code_of_conduct.md)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/346f8ec7b5cd4c00b704a2144463ce8a)](https://app.codacy.com/gh/dymexjs/config/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)
[![Codacy Badge](https://app.codacy.com/project/badge/Coverage/346f8ec7b5cd4c00b704a2144463ce8a)](https://app.codacy.com/gh/dymexjs/config/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_coverage)
[![PRs welcome!](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](.github/CONTRIBUTING.md)
[![All Contributors](https://img.shields.io/github/all-contributors/dymexjs/collections?color=ee8449&style=flat-square)](#contributors-)

Configuration system that allows the use of multiple providers, with support for validation.

<!-- TOC depthFrom:1 depthTo:5 -->
- [Dymexjs/config](#dymexjsconfig)
  - [Instalation](#instalation)
  - [Basic Usage](#basic-usage)
  - [Description](#description)
    - [Types](#types)
      - [ConfigSourceOptions](#configsourceoptions)
      - [ValidatorFunc](#validatorfunc)
      - [IConfiguration](#iconfiguration)
      - [TConfiguration](#tconfiguration)
    - [Functions `ConfigurationBuilder`](#functions-configurationbuilder)
      - [addEnvVariablesConfiguration](#addenvvariablesconfiguration)
      - [addInMemoryConfiguration](#addinmemoryconfiguration)
      - [addJsonFileConfiguration](#addjsonfileconfiguration)
      - [addJsFileConfiguration](#addjsfileconfiguration)
      - [addUserSecretsConfiguration](#addusersecretsconfiguration)
      - [addEnvFileConfiguration](#addenvfileconfiguration)
    - [Configuration](#configuration)
      - [get](#get)
      - [has](#has)
      - [set](#set)
      - [getSection](#getsection)
      - [getRequiredSection](#getrequiredsection)
  - [Advanced Usage](#advanced-usage)
  - [Code of Conduct](#code-of-conduct)
  - [How to Contribute](#how-to-contribute)
  - [License 📝](#license-)
  - [Contributors ✨](#contributors-)

## Instalation

```sh
npm install --save @dymexjs/config
```

## Basic Usage

```typescript
import { ConfigurationBuilder } from "@dymexjs/config";
import { env } from "process";

env.test_ENV = "test";
env.test_VARIABLES = "test";
env.test2_PORT = "3000";

const configBuilder = new ConfigurationBuilder();
//import variables from 'env' based on prefix
configBuilder.addEnvVariablesConfiguration(["test_", "test2_"]);
configBuilder.addInMemoryConfiguration({ MEMORY: "test" });
// { JSON: "test" }
configBuilder.addJsonFileConfiguration("env.json");
// export default { JS: "test" }
configBuilder.addJsFileConfiguration("env.js");
// { USER_SECRETS: "test" }
configBuilder.addUserSecretsConfiguration("id", "env.json");
// ENVFILE=test
configBuilder.addEnvFileConfiguration(".env");

const config = await configBuilder.build();
console.log(config.configuration);
/*
    {
        test_ENV: "test",
        test_VARIABLES: "test",
        MEMORY: "test",
        JSON: "test",
        JS: "test",
        USER_SECRETS: "test",
        ENVFILE: "test",
        test2_PORT: "3000",
    }
*/
console.log(config.get("JSON"));
// test
```

## Description

### Types

#### ConfigSourceOptions

```typescript
type ConfigSourceOptions = {
  expandVariables?: boolean; // default: true
  validation?: ValidatorFunc;
};
```

expand variables allows for the transformation of values like `db://${user}:${password}@${host}` into something like `db://username:password@localhost` depending that the keys used are already loaded into the configuration, see [Advanced Usage](#advanced-usage)

#### ValidatorFunc

```typescript
type ValidatorFunc = (
  config: TConfiguration,
) => Promise<TConfiguration | IConfiguration>;
```

#### IConfiguration

```typescript
interface IConfiguration {
  configuration: TConfiguration;
  get<T>(key: string): T | undefined;
  has(key: string): boolean;
  set(key: string | TConfiguration, value?: unknown): void;
  getSection(key: string): IConfiguration;
  getRequiredSection(key: string): IConfiguration;
}
```

#### TConfiguration

```typescript
type TConfiguration = {
  [key: string]: string | number | boolean | TConfiguration;
};
```

### Functions `ConfigurationBuilder`

#### addEnvVariablesConfiguration

Loads variables from peocess.env based on the prefix(es) passed into the function

**Note:** If the `prefix` is empty then all the `process.env` variables will be loaded.

```typescript
    addEnvVariablesConfiguration(
        prefix?: string | Array<string>,
        options?: ConfigSourceOptions,
    ): ConfigurationBuilder;
```

#### addInMemoryConfiguration

Adds an object of key:value pairs to the configuration

```typescript
addInMemoryConfiguration(
            config: TConfiguration | IConfiguration,
            options?: ConfigSourceOptions,
        ): ConfigurationBuilder
```

#### addJsonFileConfiguration

Adds key:value pairs from a json file to the configuration

```typescript
addJsonFileConfiguration(path: PathLike, options?: ConfigSourceOptions): ConfigurationBuilder
```

#### addJsFileConfiguration

Adds key:value pairs from a js file to the configuration

```typescript
addJsFileConfiguration(path: PathLike, options?: ConfigSourceOptions): ConfigurationBuilder
```

#### addUserSecretsConfiguration

Adds key:value pairs from a user secrets file (json) to the configuration

```typescript
addUserSecretsConfiguration(id: string, path?: PathLike, options?: ConfigSourceOptions): ConfigurationBuilder
```

This is a special method to load a file not present in the repository of the application to allow for the setup of configuration properties private to the user.

The `id` should represent a unique id defined for the application.

If the `path` is defined then that will be the path used for loading the file, if not the method will try to find a file in

```typescript
const p = env.HOME || env.home || env.appdata || env.userprofile;
path = join(p, ".config", id, "secrets.json");
```

#### addEnvFileConfiguration

Adds key:value pairs from a .env file to the configuration

```typescript
addEnvFileConfiguration(path: PathLike, options?: ConfigSourceOptions): ConfigurationBuilder
```

### Configuration

#### get

Returns the value associated with the given key.

If the key is not present returns the default value.

```typescript
get<T>(key: string): T | undefined
```

#### has

Checks if the configuration has a value associated with the given key.

```typescript
has(key: string): boolean
```

#### set

Sets the value associated with the given key.

If the key is an object it will be merged with the current configuration.

If the key is a string with a dot (.) it will be interpreted as a path and the value will be set at the corresponding path in the configuration.

If the key is a string without a dot it will be interpreted as a direct property of the configuration object.

```typescript
set(key: string | TConfiguration, value?: unknown): void
```

#### getSection

Gets a section of the configuration based on the provided key.

```typescript
getSection(key: string): IConfiguration
```

#### getRequiredSection

Gets a section of the configuration based on the provided key, throws an error if the section is not found.

```typescript
getRequiredSection(key: string): IConfiguration
```

## Advanced Usage

```typescript
import { ConfigurationBuilder } from "@dymexjs/config";
import { env } from "process";

env.test_ENV = "test";
env.test_VARIABLES = "test";
const configBuilder = new ConfigurationBuilder();
configBuilder.addEnvVariablesConfiguration("test_");
configBuilder.addInMemoryConfiguration({
  MEMORY: "test",
  MEMORY_ENV: "${test_ENV}",
  MEMORY_JSON: "memory",
});
/*
{
    JSON: "test",
    JSON_ENV: "${MEMORY_JSON}",
    JSON_JS: "json",
    JSON_PASSWORD: "password",
}
*/
configBuilder.addJsonFileConfiguration("env.json");
/*
{
    JS: "test",
    JS_ENV: "${JSON_JS}",
    JS_USER: "user",
    "JS_MONGO.DB.URI": "mongodb://${JS_USER}:${JSON_PASSWORD}@localhost:27017/test",
}
*/
configBuilder.addJsFileConfiguration("env.js");
/*
{
    USER_SECRETS: "test",
    USER_ENV: "${JS_USER}",
    USER: "envfile",
    KEY1: { KEY2: "${JS_USER}" },
    MONGODB: "${JS_MONGO.DB.URI}",
}
*/
configBuilder.addUserSecretsConfiguration("id", "env.json");
/*
ENVFILE=test
test_ENV=development
FILE_ENV=${USER}
MULTI_LINE="This is
a multi line
string"
*/
configBuilder.addEnvFileConfiguration(".env");

const config = await configBuilder.build();
console.log(config.configuration);
/*
{
    test_ENV: "development",
    test_VARIABLES: "test",
    MEMORY: "test",
    MEMORY_ENV: "test",
    MEMORY_JSON: "memory",
    JSON: "test",
    JSON_ENV: "memory",
    JSON_JS: "json",
    JSON_PASSWORD: "password",
    JS: "test",
    JS_ENV: "json",
    JS_USER: "user",
    USER_SECRETS: "test",
    USER_ENV: "user",
    USER: "envfile",
    ENVFILE: "test",
    FILE_ENV: "envfile",
    KEY1: { KEY2: "user" },
    JS_MONGO: {
        DB: {
            URI: "mongodb://user:password@localhost:27017/test",
        },
    },
    MONGODB: "mongodb://user:password@localhost:27017/test",
    MULTI_LINE: "This is\na multi line\nstring",
}
*/

console.log(config.get("USER_ENV"));
// "user"

console.log(config.get("JS_MONGO.DB.URI"));
// "mongodb://user:password@localhost:27017/test"

config.set("new.property", "value");

console.log(config.get("new.property"));
// "value"
```

## Code of Conduct

We expect everyone to abide by our [**Code of Conduct**](./CODE_OF_CONDUCT.md). Please read it.

## How to Contribute

Check out our [**Contributing Guide**](./CONTRIBUTING.md) for information on contributing.

## License 📝

Licensed under the [MIT License](./LICENSE).

## Contributors ✨

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/n3okill"><img src="https://avatars.githubusercontent.com/u/1280607?v=4?s=50" width="50px;" alt="João Parreira"/><br /><sub><b>João Parreira</b></sub></a><br /><a href="#maintenance-n3okill" title="Maintenance">🚧</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
