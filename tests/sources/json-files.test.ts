import { test, describe } from "node:test";
import { ConfigurationBuilder, TConfiguration } from "../../src";
import * as assert from "node:assert/strict";
import Joi from "joi";

describe("@Dymexjs/config", () => {
  describe("json files source", () => {
    test("should load from json file", async (t) => {
      const configBuilder = new ConfigurationBuilder();
      configBuilder.addJsonFileConfiguration("env.json");
      t.mock.method(
        Array.from(configBuilder.sources.values())[0],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "readFile" as any,
        async () => JSON.stringify({ ENV: "test", PORT: 3000 }),
      );
      const config = await configBuilder.build();
      assert.strictEqual(config.get("ENV"), "test");
      assert.strictEqual(config.get("PORT"), 3000);
    });
    test("should load from json files and rewrite existent", async (t) => {
      const configBuilder = new ConfigurationBuilder();
      configBuilder.addJsonFileConfiguration("env.json");
      configBuilder.addJsonFileConfiguration("env.development.json");
      t.mock.method(
        Array.from(configBuilder.sources.values())[0],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "readFile" as any,
        async () => JSON.stringify({ ENV: "test" }),
      );
      t.mock.method(
        Array.from(configBuilder.sources.values())[1],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "readFile" as any,
        async () => JSON.stringify({ ENV: "development", FOO: "bar" }),
      );
      const config = await configBuilder.build();
      assert.strictEqual(config.get("ENV"), "development");
    });
    test("validation", async (t) => {
      const configurationBuilder = new ConfigurationBuilder();
      configurationBuilder.addJsonFileConfiguration("file.json", {
        validation: async (config: TConfiguration) => {
          const schema = Joi.object({
            ENV: Joi.string().required(),
            KEY1: Joi.string().required(),
          });
          try {
            return schema.validateAsync(config, {
              abortEarly: false,
              allowUnknown: true,
            });
          } catch (err) {
            throw new Error("Validation failed: " + err.message);
          }
        },
      });
      t.mock.method(
        Array.from(configurationBuilder.sources.values())[0],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "readFile" as any,
        async () => JSON.stringify({ ENV: "development", KEY1: "bar" }),
      );
      await assert.doesNotReject(async () => await configurationBuilder.build());
    });
    test("validation fail", async (t) => {
      const configurationBuilder = new ConfigurationBuilder();
      configurationBuilder.addJsonFileConfiguration("file.json", {
        validation: async (config: TConfiguration) => {
          const schema = Joi.object({
            ENV: Joi.string().required(),
            KEY1: Joi.number().required(),
          });
          try {
            return await schema.validateAsync(config, {
              abortEarly: false,
              allowUnknown: true,
            });
          } catch (err) {
            throw new Error("Validation failed: " + err.message);
          }
        },
      });
      t.mock.method(
        Array.from(configurationBuilder.sources.values())[0],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "readFile" as any,
        async () => JSON.stringify({ ENV: "development", KEY1: "bar" }),
      );
      await assert.rejects(async () => await configurationBuilder.build(), /Validation failed/);
    });
  });
});
