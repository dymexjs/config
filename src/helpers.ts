import { DOTENV_SUBSTITUTION_REGEX } from "./constants.ts";
import { IConfiguration, TConfiguration } from "./types/configuration.ts";

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

//#region Expand env variables

export function expand(obj: TConfiguration, config: IConfiguration): TConfiguration {
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      let valueAux = interpolate(value, obj, config);
      valueAux = resolveEscapeSequence(valueAux);
      Object.defineProperty(obj, key, { value: valueAux, enumerable: true, writable: true });
    } else if (isObject(value)) {
      expand(value, config);
    }
  }
  return obj;
}

function interpolate(value: string, obj: TConfiguration, configuration: IConfiguration): string {
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

function resolveEscapeSequence(value: string): string {
  return value.replace(/\\\$/g, "$");
}

//#endregion

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
