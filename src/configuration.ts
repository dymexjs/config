import { deepMixIn, isObject, isUndefined } from "./helpers.ts";
import { IConfiguration } from "./types/configuration.ts";
import { InvalidKeyException } from "./types/exceptions/invalid-key.exception.ts";
import { TConfiguration } from "./types/configuration.ts";

export class Configuration implements IConfiguration {
  #_configuration: TConfiguration = {};

  constructor(config: TConfiguration = {}) {
    this.#_configuration = config;
  }
  get configuration(): TConfiguration {
    return this.#_configuration;
  }
  /**
   * Returns the value associated with the given key.
   * If the key is not present returns the default value.
   * @param key The key to look up in the configuration
   * @param defaultValue The value to return if the key is not present
   */
  get<T>(key: string, defaultValue?: T): T | undefined {
    if (typeof key === "string" && Reflect.has(this.#_configuration, key)) {
      // If the key is a direct property of the configuration object
      return Reflect.get(this.#_configuration, key) as T;
    } else {
      // If the key is a nested property
      const path = getKeyPathParts(key);
      let obj = this.#_configuration;
      while (obj && path.length > 0) {
        obj = Reflect.get(obj, path.shift() as PropertyKey);
      }
      // If the key was found return the value
      return path.length === 0
        ? isUndefined(obj) && !isUndefined(defaultValue)
          ? defaultValue
          : (obj as T)
        : undefined;
    }
  }
  /**
   * Checks if the configuration has a value associated with the given key.
   * @param key The key to check in the configuration
   * @returns True if the key exists in the configuration, false otherwise
   */
  has(key: string): boolean {
    // Get the path parts from the key
    const pathParts = getKeyPathParts(key);
    let obj = this.#_configuration;

    // Traverse the configuration object based on the path parts
    while (obj && pathParts.length > 0) {
      obj = Reflect.get(obj, pathParts.shift() as PropertyKey);
    }

    // Return true if the key was found in the configuration
    return pathParts.length === 0 && !isUndefined(obj);
  }

  /**
   * Sets the value associated with the given key.
   * If the key is an object it will be merged with the current configuration.
   * If the key is a string with a dot (.) it will be interpreted as a path
   * and the value will be set at the corresponding path in the configuration.
   * If the key is a string without a dot it will be interpreted as a direct
   * property of the configuration object.
   * @param key The key to set in the configuration
   * @param value The value to set, if not provided the key will be interpreted as an object
   */
  set<T>(key: string | TConfiguration, value?: T): void {
    if (isUndefined(value)) {
      if (isObject(key)) {
        const obj = normalizeObject(key);
        deepMixIn(this.#_configuration, obj);
        return;
      } else if (typeof key !== "string") {
        throw new InvalidKeyException();
      }
    }

    if ((key as string).indexOf(".") !== -1) {
      const keyValueObj = normalizeKey(key as string, normalizeObject(value as TConfiguration));
      deepMixIn(this.#_configuration, keyValueObj);
      return;
    }
    deepMixIn(this.#_configuration, {
      [key as string]: normalizeObject(value as TConfiguration),
    });
  }

  /**
   * Gets a section of the configuration based on the provided key.
   * @param key The key to identify the section in the configuration
   * @returns The configuration section identified by the key
   */
  getSection(key: string): IConfiguration {
    // Retrieve the section from the configuration
    return new Configuration(this.get(key));
  }
  /**
   * Gets a section of the configuration based on the provided key, throws an error if the section is not found.
   * @param key The key to identify the section in the configuration
   * @returns The configuration section identified by the key
   * @throws Error If the section identified by the key is not found
   */
  getRequiredSection(key: string): IConfiguration {
    const section = this.get(key);
    if (isUndefined(section)) {
      throw new Error(`Required section ${key} not found`);
    }
    return new Configuration(section as TConfiguration);
  }
}

function getKeyPathParts(key: string): Array<string> {
  if (key.indexOf(".") === -1) {
    return [key];
  }
  key = key.replace(/\[(\d+)]/g, `.$1`);
  return key.split(".");
}

function normalizeObject(obj: TConfiguration): TConfiguration {
  if (!isObject(obj)) {
    return obj;
  }
  const config = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key.indexOf(".") !== -1) {
      const keyValueObj = normalizeKey(key as string, normalizeObject(value as TConfiguration));
      deepMixIn(config, keyValueObj);
      continue;
    }
    Object.defineProperty(config, key, {
      value: normalizeObject(value as TConfiguration),
      enumerable: true,
      writable: true,
    });
  }
  return config;
}

function normalizeKey(key: string, value: unknown): TConfiguration {
  const path = getKeyPathParts(key as string);
  const config = {};
  let obj = config;
  const last = path.reduce((prev: string, current: string) => {
    const actual = Reflect.get(obj, prev);
    Object.defineProperty(obj, prev, {
      writable: true,
      enumerable: true,
      value: !isUndefined(actual) ? actual : parseInt(current).toString() === current ? [] : {},
    });
    obj = Reflect.get(obj, prev) as TConfiguration;
    return current;
  });

  Object.defineProperty(obj, last, { value, writable: true, enumerable: true });
  return config;
}
