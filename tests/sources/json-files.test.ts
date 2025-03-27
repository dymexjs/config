import { test, describe } from "node:test";
import { ConfigurationBuilder, type TConfiguration } from "../../src/index.ts";
import * as assert from "node:assert/strict";
import { z } from "zod";

describe("@Dymexjs/config", () => {
  describe("json files source", () => {
    test("should load from json file", async (t) => {
      const configBuilder = new ConfigurationBuilder();
      configBuilder.addJsonFileConfiguration("env.json");
      t.mock.method(
        Array.from(configBuilder.sources.values())[0],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "readFile" as any,
        async () => JSON.stringify({ ENV: "test", PORT: 3000, DATE: new Date("2014-10-25T13:46:20+07:00") }),
      );
      const config = await configBuilder.build();
      assert.strictEqual(config.get("ENV"), "test");
      assert.strictEqual(config.get("PORT"), 3000);
      assert.deepStrictEqual(config.get("DATE"), new Date("2014-10-25T13:46:20+07:00"));
      assert.ok(config.get("DATE") instanceof Date);
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
        async () => JSON.stringify({ ENV: "development", KEY1: "bar" }),
      );
      await assert.doesNotReject(async () => await configurationBuilder.build());
    });
    test("validation fail", async (t) => {
      const configurationBuilder = new ConfigurationBuilder();
      configurationBuilder.addJsonFileConfiguration("file.json", {
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
        async () => JSON.stringify({ ENV: "development", KEY1: "bar" }),
      );
      await assert.rejects(async () => await configurationBuilder.build(), /Validation failed/);
    });
  });
});
