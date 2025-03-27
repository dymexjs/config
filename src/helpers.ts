import { DOTENV_SUBSTITUTION_REGEX } from "./constants.ts";
import type { IConfiguration, TConfiguration } from "./types/configuration.ts";

export function ThrowNullOrUndefined(value: unknown, name: string) {
  if (isNullOrUndefined(value)) {
    throw new TypeError(`${name} can't be null or undefined`);
  }
}

export function isNull(arg: unknown): arg is null {
  return arg === null;
}

export function isUndefined(arg?: unknown): arg is undefined {
  return typeof arg === "undefined";
}

export function isNullOrUndefined(arg: unknown): arg is null | undefined {
  return isNull(arg) || isUndefined(arg);
}

export function isObject(arg: unknown): arg is object {
  return (
    !isNullOrUndefined(arg) &&
    (/^\[object (.*)]$/.exec(Object.prototype.toString.call(arg)) as RegExpExecArray)[1].toLowerCase() === "object"
  );
}

//#region Coerce

/**
 * Attempts to convert a string value to a number, boolean, or Date.
 * 
 * @param value - The string value to be coerced.
 * @returns The coerced value as a number, boolean, Date, or the original string if no coercion is possible.
 */
export function coerce(value: string): string | number | boolean | Date {
  const coercers = [tryCoerceNumber, tryCoerceBoolean, tryCoerceDate];
  for (const coercer of coercers) {
    const [coerce, result] = coercer(value);
    if (coerce) {
      return result;
    }
  }
  return value;
}

  /**
   * Attempts to coerce a string value to a boolean.
   * 
   * @param value - The string value to be coerced.
   * @returns A boolean indicating whether the coercion was successful, and the coerced value as a boolean, or the original string if no coercion is possible.
   */
function tryCoerceBoolean(value: string): [boolean, boolean | string] {
  const booleanValue = value.toLowerCase();
  if (booleanValue === "true" || booleanValue === "false") {
    return [true, booleanValue === "true"];
  }
  return [false, value];
}

/**
 * Attempts to coerce a string value to a number.
 * 
 * @param value - The string value to be coerced.
 * @returns A boolean indicating whether the coercion was successful, and the coerced value as a number, or the original string if no coercion is possible.
 */
function tryCoerceNumber(value: string): [boolean, number | string] {
  // eslint-disable-next-line security/detect-unsafe-regex
  const matches = value.match(/^\s*[+-]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:e([+-]?\d+))?\s*$/i);
  if (!matches) {
    return [false, value];
  }
  const result = parseFloat(value);

  if (result === 0) {
    return [true, 0]; // -0
  }

  if (value.match(/e/i)) {
    if (extractSignificantDigits(value) !== extractSignificantDigits(String(result))) {
      return [false, value];
    }
  } else {
    const string = result.toString();
    if (string.match(/e/i)) {
      return [true, result];
    }

    if (string !== normalizeDecimal(value)) {
      return [false, value];
    }
  }

  return [true, result];
}

/**
 * Extracts the significant digits from a string representation of a number.
 * 
 * @param value - The string value from which to extract significant digits.
 * @returns The string of significant digits extracted from the input value.
 */
function extractSignificantDigits(value: string) {
  return (
    value
      .replace(/[eE][+-]?\d+$/, "")
      .replace(/\./, "")
      .replace(/0+$/, "")
      // eslint-disable-next-line security/detect-unsafe-regex
      .replace(/^[+-]?(0*)?/, "")
  );
}

/**
 * Normalizes a decimal string by removing unnecessary decimal points and leading/trailing zeros.
 * 
 * @param str - The string value to be normalized.
 * @returns The normalized string value.
 */
function normalizeDecimal(str: string) {
  str = str
    // Remove leading plus signs
    .replace(/^\+/, "")
    // Remove trailing zeros if there is a decimal point and unecessary decimal points
    .replace(/\.0*$/, "")
    // Add a integer 0 if the numbers starts with a decimal point
    .replace(/^(-?)\.([^.]*)$/, "$10.$2")
    // Remove leading zeros
    .replace(/^(-?)0+([0-9])/, "$1$2");

  if (str.includes(".") && str.endsWith("0")) {
    str = str.replace(/0+$/, "");
  }

  if (str === "-0") {
    return "0";
  }

  return str;
}

/**
 * Attempts to coerce a string value to a Date.
 * 
 * @param value - The string value to be coerced.
 * @returns A boolean indicating whether the coercion was successful, and the coerced value as a Date, or the original string if no coercion is possible.
 */
function tryCoerceDate(value: string): [boolean, Date | string] {
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    return [true, date];
  }
  return [false, value];
}

//#endregion

//#region Expand env variables

/**
 * Interpolates environment variables in a string value.
 * 
 * @param value - The string value containing environment variables to be interpolated.
 * @param obj - The configuration object containing the configuration values.
 * @param configuration - The configuration object containing the configuration values.
 * @returns The interpolated string value.
 */
export function interpolate(value: string, obj: TConfiguration, configuration: IConfiguration): string {
  return value.replace(DOTENV_SUBSTITUTION_REGEX, (match, key, defaultValue) => {
    const configurationValue = configuration.get(key);
    if (!isUndefined(configurationValue)) {
      if (configurationValue === Reflect.get(obj, key)) {
        return configurationValue;
      } else {
        return interpolate(configurationValue as string, obj, configuration);
      }
    }

    const objKey = Reflect.get(obj, key);
    if (!isUndefined(objKey)) {
      // avoid recursion from EXPAND_SELF=$EXPAND_SELF
      if (objKey === value) {
        return value;
      } else if (typeof objKey !== "string") {
        return objKey.toString();
      } else {
        return interpolate(objKey, obj, configuration);
      }
    }
    if (defaultValue) {
      if (defaultValue.startsWith("$")) {
        return interpolate(defaultValue, obj, configuration);
      } else {
        return defaultValue;
      }
    }
    return "";
  });
}

/**
 * Resolves escape sequences in a string value.
 * 
 * @param value - The string value containing escape sequences to be resolved.
 * @returns The resolved string value.
 */
export function resolveEscapeSequence(value: string): string {
  return value.replace(/\\\$/g, "$");
}

//#endregion

/**
 * Recursively merges properties from the source object into the target object.
 * 
 * @param target - The target object to which properties will be merged.
 * @param source - The source object from which properties will be merged.
 */
export function deepMixIn(target: TConfiguration, source: TConfiguration): void {
  for (const [key, value] of Object.entries(source)) {
    if (!Object.prototype.hasOwnProperty.call(target, key)) {
      Object.defineProperty(target, key, { value, enumerable: true, writable: true });
    } else if (isObject(value) && isObject(Reflect.get(target, key))) {
      deepMixIn(Reflect.get(target, key) as TConfiguration, value as TConfiguration);
    } else {
      if (!isUndefined(source)) {
        for (const name of Object.getOwnPropertyNames(source)) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          Object.defineProperty(target, name, Object.getOwnPropertyDescriptor(source, name)!);
        }
        for (const name of Object.getOwnPropertySymbols(source)) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          Object.defineProperty(target, name, Object.getOwnPropertyDescriptor(source, name)!);
        }
      }
    }
  }
}
