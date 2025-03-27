import { describe, test } from "node:test";
import {
  Configuration,
  ConfigurationBuilder,
  ConfigurationSource,
  InvalidKeyException,
  MemoryConfigurationSource,
  type TConfiguration,
  type ValidatorFunc,
} from "../src/index.ts";
import assert from "node:assert/strict";
import { env } from "node:process";
import { z } from "zod";

describe("@Dymexjs/config", () => {
  describe("chain source", () => {
    test("can chain configuration", async () => {
      const dic1 = { key1: { key1: "ValueInMem1" } };
      const dic2 = { key2: { key2: "ValueInMem2" } };
      const dic3 = { key3: { key3: "ValueInMem3" } };
      const memConfigSrc1 = new MemoryConfigurationSource(dic1);
      const memConfigSrc2 = new MemoryConfigurationSource(dic2);
      const memConfigSrc3 = new MemoryConfigurationSource(dic3);

      const configurationBuilder = new ConfigurationBuilder();

      configurationBuilder.add(memConfigSrc1);
      configurationBuilder.add(memConfigSrc2);
      configurationBuilder.add(memConfigSrc3);

      const config = await configurationBuilder.build();

      const chained = await new ConfigurationBuilder().addConfiguration(config).build();
      const memVal1 = chained.get(`key1.key1`);
      const memVal2 = chained.get(`key2.key2`);
      const memVal3 = chained.get(`key3.key3`);

      assert.strictEqual(memVal1, "ValueInMem1");
      assert.strictEqual(memVal2, "ValueInMem2");
      assert.strictEqual(memVal3, "ValueInMem3");
      assert.strictEqual(chained.get("NotExist"), undefined);
    });
  });
  describe("getSection", () => {
    test("can get configuration section", async () => {
      const dic1 = {
        data: {
          db1: {
            connection1: "MemVal1",
            connection2: "MemVal2",
          },
        },
      };

      const dic2 = { datasource: { db2connection: "MemVal3" } };

      const memConfigSrc1 = new MemoryConfigurationSource(dic1);
      const memConfigSrc2 = new MemoryConfigurationSource(dic2);

      const configurationBuilder = new ConfigurationBuilder();
      configurationBuilder.add(memConfigSrc1);
      configurationBuilder.add(memConfigSrc2);

      const config = await configurationBuilder.build();

      const configFocus = config.getSection("data");

      const memVal1 = configFocus.get(`db1.connection1`);
      const memVal2 = configFocus.get(`db1.connection2`);
      const memVal3 = configFocus.get(`db2.connection`);
      const memVal4 = configFocus.get(`source.db2.connection`);

      assert.strictEqual(memVal1, "MemVal1");
      assert.strictEqual(memVal2, "MemVal2");
      assert.strictEqual(memVal3, undefined);
      assert.strictEqual(memVal4, undefined);
    });
    test("get required section success", async () => {
      const dict = {
        mem1: { keyinmem1: "ValueInMem1" },
        mem2: { keyinmem2: { deep1: "ValueDeep1" } },
      };
      const configurationBuilder = new ConfigurationBuilder();
      configurationBuilder.addInMemoryConfiguration(dict);
      const config = await configurationBuilder.build();

      const sectionExists1 = config.getRequiredSection("mem1");
      const sectionExists2 = config.getRequiredSection(`mem2.keyinmem2`);

      assert.notEqual(sectionExists1, undefined);
      assert.notEqual(sectionExists2, undefined);
    });
    test("get required section should throw exception", async () => {
      const dict = { "Mem1.Deep1": "Value1" };
      const configurationBuilder = new ConfigurationBuilder();
      configurationBuilder.addInMemoryConfiguration(dict);
      const config = await configurationBuilder.build();
      assert.throws(() => config.getRequiredSection("Mem1.Deep2"), /Required section Mem1.Deep2 not found/);
    });
  });
  describe("Configuration", () => {
    test("should set undefined value", () => {
      const config = new Configuration();
      config.set("key", undefined);
      assert.strictEqual(config.has("key"), false);
      assert.strictEqual(config.get("key"), undefined);
    });
    test("should set simple property key and value", () => {
      const config = new Configuration();
      assert.throws(() => config.set(true as unknown as string), InvalidKeyException);
      config.set("key", "value");
      assert.strictEqual(config.has("key"), true);
      assert.strictEqual(config.get("key"), "value");
    });
    test("should set complex property key and value", () => {
      const config = new Configuration();
      config.set(`key.key1`, "value");
      assert.deepEqual(config.get("key"), { key1: "value" });
    });
    test("should set complex property with simple key and complex value", () => {
      const config = new Configuration();
      config.set(`key`, { [`key2.key3`]: "value" });
      assert.deepEqual(config.get(`key`), { key2: { key3: "value" } });
      const config2 = new Configuration();
      config2.set(`key`, { [`key2[1].key3`]: "value" });
      // eslint-disable-next-line no-sparse-arrays
      assert.deepEqual(config2.get(`key`), { key2: [, { key3: "value" }] });
    });

    test("should set complex property with complex key and complex value", () => {
      const config = new Configuration();
      config.set(`key.key1`, { [`key2.key3`]: "value" });
      assert.deepEqual(config.get(`key.key1`), { key2: { key3: "value" } });
      assert.deepEqual(config.configuration, {
        key: { key1: { key2: { key3: "value" } } },
      });
    });
    test("should replace old values", () => {
      const config = new Configuration();
      config.set(`key.key1`, { [`key2.key3`]: "value1" });
      config.set(`key.key1`, { [`key2.key3`]: "value2" });
      assert.deepEqual(config.get(`key.key1`), { key2: { key3: "value2" } });
      assert.deepEqual(config.configuration, {
        key: { key1: { key2: { key3: "value2" } } },
      });
    });
    test("should join values into existing key", () => {
      const config = new Configuration();
      config.set(`key.key1`, { [`key2.key3`]: "value1" });
      config.set(`key.key1.key2.value2`, "value2");
      assert.deepEqual(config.get(`key.key1`), {
        key2: { key3: "value1", value2: "value2" },
      });
      assert.deepEqual(config.configuration, {
        key: { key1: { key2: { key3: "value1", value2: "value2" } } },
      });
    });
    test("should return typeof number", async () => {
      const config = new Configuration();
      config.set("PORT", 3000);
      assert.strictEqual(typeof config.get("PORT"), "number");
    });
    test("should return default value", async () => {
      const config = new Configuration();
      config.set("PORT", 3000);
      assert.strictEqual(config.get("DATABASE", "mongodb"), "mongodb");
    });
  });
  describe("multiple sources", () => {
    test("all sources simple", async (t) => {
      env.test_ENV = "test";
      env.test_VARIABLES = "test";
      env.test2_PORT = "3000";
      const configBuilder = new ConfigurationBuilder();
      configBuilder.addEnvVariablesConfiguration(["test_", "test2_"]);
      configBuilder.addInMemoryConfiguration({ MEMORY: "test" });
      configBuilder.addJsonFileConfiguration("env.json");
      configBuilder.addJsFileConfiguration("env.js");
      configBuilder.addUserSecretsConfiguration("id", "env.json");
      configBuilder.addEnvFileConfiguration(".env");
      //env.json
      t.mock.method(
        Array.from(configBuilder.sources.values())[2],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "readFile" as any,
        async () => JSON.stringify({ JSON: "test" }),
      );
      //env.js
      t.mock.method(
        Array.from(configBuilder.sources.values())[3],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "readFile" as any,
        async () => ({
          JS: "test",
        }),
      );
      //env.json - user secrets
      t.mock.method(
        Array.from(configBuilder.sources.values())[4],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "readFile" as any,
        async () => JSON.stringify({ USER_SECRETS: "test" }),
      );
      //.env
      t.mock.method(
        Array.from(configBuilder.sources.values())[5],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "readFile" as any,
        async () => "ENVFILE=test\n",
      );
      const config = await configBuilder.build();
      assert.deepEqual(config.configuration, {
        test_ENV: "test",
        test_VARIABLES: "test",
        MEMORY: "test",
        JSON: "test",
        JS: "test",
        USER_SECRETS: "test",
        ENVFILE: "test",
        test2_PORT: 3000,
      });
      delete env.test_ENV;
      delete env.test_VARIABLES;
      delete env.test2_PORT;
    });
    test("all sources complex", async (t) => {
      env.test_ENV = "test";
      env.test_VARIABLES = "test";
      const configBuilder = new ConfigurationBuilder();
      configBuilder.addEnvVariablesConfiguration("test_");
      configBuilder.addInMemoryConfiguration({
        MEMORY: "test",
        MEMORY_ENV: "${test_ENV}",
        MEMORY_JSON: "memory",
      });
      configBuilder.addJsonFileConfiguration("env.json");
      configBuilder.addJsFileConfiguration("env.js");
      configBuilder.addUserSecretsConfiguration("id", "env.json");
      configBuilder.addEnvFileConfiguration(".env");
      //env.json
      t.mock.method(
        Array.from(configBuilder.sources.values())[2],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "readFile" as any,
        async () =>
          JSON.stringify({
            JSON: "test",
            JSON_ENV: "${MEMORY_JSON}",
            JSON_JS: "json",
            JSON_PASSWORD: "password",
          }),
      );
      //env.js
      t.mock.method(
        Array.from(configBuilder.sources.values())[3],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "readFile" as any,
        async () => ({
          JS: "test",
          JS_ENV: "${JSON_JS}",
          JS_USER: "user",
          "JS_MONGO.DB.URI": "mongodb://${JS_USER}:${JSON_PASSWORD}@localhost:27017/test",
        }),
      );
      //env.json - user secrets
      t.mock.method(
        Array.from(configBuilder.sources.values())[4],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "readFile" as any,
        async () =>
          JSON.stringify({
            USER_SECRETS: "test",
            USER_ENV: "${JS_USER}",
            USER: "envfile",
            KEY1: { KEY2: "${JS_USER}" },
            MONGODB: "${JS_MONGO.DB.URI}",
          }),
      );
      //.env
      t.mock.method(
        Array.from(configBuilder.sources.values())[5],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "readFile" as any,
        async () =>
          `ENVFILE=test\ntest_ENV=development\nFILE_ENV=\${USER}\nMULTI_LINE="This is\na multi line\nstring"\n`,
      );
      const config = await configBuilder.build();
      assert.deepEqual(config.configuration, {
        test_ENV: "development",
        test_VARIABLES: "test",
        MEMORY: "test",
        MEMORY_ENV: "test",
        MEMORY_JSON: "memory",
        JSON: "test",
        JSON_ENV: "memory",
        JSON_JS: "json",
        JSON_PASSWORD: "password",
        JS: "test",
        JS_ENV: "json",
        JS_USER: "user",
        USER_SECRETS: "test",
        USER_ENV: "user",
        USER: "envfile",
        ENVFILE: "test",
        FILE_ENV: "envfile",
        KEY1: { KEY2: "user" },
        JS_MONGO: {
          DB: {
            URI: "mongodb://user:password@localhost:27017/test",
          },
        },
        MONGODB: "mongodb://user:password@localhost:27017/test",
        MULTI_LINE: "This is\na multi line\nstring",
      });
      delete env.test_ENV;
      delete env.test_VARIABLES;
    });
  });
  describe("other", () => {
    test("should throw when source is not a ConfigurationSource", () => {
      assert.throws(
        () => new ConfigurationBuilder().add({} as ConfigurationSource<unknown>),
        /'source' must be instance of ConfigurationSource/,
      );
    });
    test("configurationBuilder - validation", async () => {
      const validationFunc: ValidatorFunc = async (config: TConfiguration) => {
        const schema = z.object({
          key1: z.object({
            key2: z.string(),
          }),
        });
        try {
          return schema.parse(config);
        } catch (err) {
          throw new Error("Validation failed: " + err.message);
        }
      };
      const configBuilder = new ConfigurationBuilder(validationFunc);
      configBuilder.addInMemoryConfiguration({ key1: { key2: "ValueInMem1" } });
      await assert.doesNotReject(async () => await configBuilder.build());
    });
    test("configurationBuilder - validation fail", async () => {
      const validationFunc: ValidatorFunc = async (config: TConfiguration) => {
        const schema = z.object({
          key1: z.object({
            key2: z.number(),
          }),
        });
        try {
          return schema.parse(config);
        } catch (err) {
          throw new Error("Validation failed: " + err.message);
        }
      };
      const configBuilder = new ConfigurationBuilder(validationFunc);
      configBuilder.addInMemoryConfiguration({ key1: { key2: "ValueInMem1" } });
      await assert.rejects(async () => await configBuilder.build(), /Validation failed/);
    });
  });
});
