import { test, describe } from "node:test";
import { ConfigurationBuilder, type TConfiguration } from "../../src/index.ts";
import * as assert from "node:assert/strict";
import { env } from "process";
import Joi from "joi";

describe("@Dymexjs/config", () => {
  describe("env variables source", () => {
    test("should load from env variables", async () => {
      env.foo = "bar";
      const configBuilder = new ConfigurationBuilder();
      configBuilder.addEnvVariablesConfiguration();
      const config = await configBuilder.build();
      assert.strictEqual(config.get("foo"), "bar");
      delete env.foo;
    });
    test("validation", async () => {
      const configurationBuilder = new ConfigurationBuilder();
      env.test_key1 = "ValueInMem1";
      configurationBuilder.addEnvVariablesConfiguration("test_", {
        validation: async (config: TConfiguration) => {
          const schema = Joi.object({
            test_key1: Joi.string().required(),
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
      await assert.doesNotReject(async () => await configurationBuilder.build());
      delete env.test_key1;
    });
    test("validation fail", async () => {
      env.test_key1 = "ValueInMem1";
      const configurationBuilder = new ConfigurationBuilder();
      configurationBuilder.addEnvVariablesConfiguration("test_", {
        validation: async (config: TConfiguration) => {
          const schema = Joi.object({
            key1: Joi.number().required(),
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
      await assert.rejects(async () => await configurationBuilder.build(), /Validation failed/);
      delete env.test_key1;
    });
  });
});
