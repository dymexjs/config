import { test, describe } from "node:test";
import { ConfigurationBuilder, type TConfiguration } from "../../src/index.ts";
import * as assert from "node:assert/strict";
import { z } from "zod";

describe("@Dymexjs/config", () => {
  describe("js files source", () => {
    test("should load from js file", async (t) => {
      const configBuilder = new ConfigurationBuilder();
      configBuilder.addJsFileConfiguration("env.js");
      t.mock.method(
        Array.from(configBuilder.sources.values())[0],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "readFile" as any,
        async () => ({
          ENV: "test",
          PORT: 3000,
        }),
      );
      const config = await configBuilder.build();
      assert.strictEqual(config.get("ENV"), "test");
      assert.strictEqual(typeof config.get("PORT"), "number");
    });
    test("should load from js files and rewrite existent", async (t) => {
      const configBuilder = new ConfigurationBuilder();
      configBuilder.addJsFileConfiguration("env.js");
      configBuilder.addJsFileConfiguration("env.development.js");
      t.mock.method(
        Array.from(configBuilder.sources.values())[0],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "readFile" as any,
        async () => ({
          ENV: "test",
        }),
      );
      t.mock.method(
        Array.from(configBuilder.sources.values())[1],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "readFile" as any,
        async () => ({
          ENV: "development",
          FOO: "bar",
          BAR: "${FOO}foo",
        }),
      );
      const config = await configBuilder.build();
      assert.strictEqual(config.get("ENV"), "development");
    });
    test("validation", async (t) => {
      const configurationBuilder = new ConfigurationBuilder();
      configurationBuilder.addJsFileConfiguration("file.js", {
        validation: async (config: TConfiguration) => {
          const schema = z.object({
            ENV: z.string(),
            KEY1: z.string(),
          });
          try {
            return schema.parse(config);
          } catch (err) {
            throw new Error("Validation failed: " + err.message);
          }
        },
      });
      t.mock.method(
        Array.from(configurationBuilder.sources.values())[0],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "readFile" as any,
        async () => ({
          ENV: "development",
          KEY1: "bar",
        }),
      );
      await assert.doesNotReject(async () => await configurationBuilder.build());
    });
    test("validation fail", async (t) => {
      const configurationBuilder = new ConfigurationBuilder();
      configurationBuilder.addJsFileConfiguration("file.js", {
        validation: async (config: TConfiguration) => {
          const schema = z.object({
            ENV: z.string(),
            KEY1: z.number(),
          });
          try {
            return schema.parse(config);
          } catch (err) {
            throw new Error("Validation failed: " + err.message);
          }
        },
      });
      t.mock.method(
        Array.from(configurationBuilder.sources.values())[0],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "readFile" as any,
        async () => ({
          ENV: "development",
          KEY1: "bar",
        }),
      );
      await assert.rejects(async () => await configurationBuilder.build(), /Validation failed/);
    });
  });
});
