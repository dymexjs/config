export type TConfiguration = {
  [key: string]: string | number | boolean | TConfiguration;
};

export interface IConfiguration {
  configuration: TConfiguration;

  /**
   * Returns the value associated with the given key.
   * If the key is not present returns the default value.
   * @param key The key to look up in the configuration
   * @param defaultValue The value to return if the key is not present
   */
  get<T>(key: string): T | undefined;

  /**
   * Checks if the configuration has a value associated with the given key.
   * @param key The key to check in the configuration
   * @returns True if the key exists in the configuration, false otherwise
   */
  has(key: string): boolean;

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
  set(key: string | TConfiguration, value?: unknown): void;

  /**
   * Gets a section of the configuration based on the provided key.
   * @param key The key to identify the section in the configuration
   * @returns The configuration section identified by the key
   */
  getSection(key: string): IConfiguration;

  /**
   * Gets a section of the configuration based on the provided key, throws an error if the section is not found.
   * @param key The key to identify the section in the configuration
   * @returns The configuration section identified by the key
   * @throws Error If the section identified by the key is not found
   */
  getRequiredSection(key: string): IConfiguration;
}
