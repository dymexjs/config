import { test, describe } from "node:test";
import { ConfigurationBuilder, type TConfiguration } from "../../src/index.ts";
import * as assert from "node:assert/strict";
import { env } from "process";
import { z } from "zod";

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
      env.test_port = "3000";
      configurationBuilder.addEnvVariablesConfiguration("test_", {
        validation: async (config: TConfiguration) => {
          const schema = z.object({
            test_key1: z.string(),
            test_port: z.number(),
          });
          try {
            return schema.parse(config);
          } catch (err) {
            throw new Error("Validation failed: " + err.message);
          }
        },
      });
      await assert.doesNotReject(async () => await configurationBuilder.build());
      delete env.test_key1;
      delete env.test_port;
    });
    test("validation fail", async () => {
      env.test_key1 = "ValueInMem1";
      const configurationBuilder = new ConfigurationBuilder();
      configurationBuilder.addEnvVariablesConfiguration("test_", {
        validation: async (config: TConfiguration) => {
          const schema = z.object({
            key1: z.number(),
          });
          try {
            return schema.parse(config);
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
