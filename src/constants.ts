//export const KEY_DELIMITER = ":";

export const ENV_LINE =
  // eslint-disable-next-line security/detect-unsafe-regex
  /^([^#=\r\n]+?)=(?:(['"`])([\s\S]*?)\2|([^\r\n#]*))\s*(?:#.*)?$/gm;

export const DOTENV_SUBSTITUTION_REGEX =
  // eslint-disable-next-line security/detect-unsafe-regex
  /(?<!\\)\$\{([a-zA-Z_][\w.-]*)(?::-([^{}]*))?\}/gi;
