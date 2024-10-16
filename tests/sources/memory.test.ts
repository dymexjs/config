import { test, describe } from "node:test";
import { ConfigurationBuilder, MemoryConfigurationSource, TConfiguration } from "../../src";
import * as assert from "node:assert/strict";
import Joi from "joi";

describe("@Dymexjs/config", () => {
    describe("memory source", () => {
        const dic1 = { key1: { key1: "ValueInMem1" } };
        const dic2 = { key2: { key2: "ValueInMem2" } };
        const dic3 = { key3: { key3: "ValueInMem3" } };
        test("simple test object", async () => {
            const obj = { key1: { key2: { key3: "value" } } };
            const configurationBuilder = new ConfigurationBuilder();
            configurationBuilder.addInMemoryConfiguration(obj);
            const config = await configurationBuilder.build();
            assert.deepEqual(config.get("key1"), { key2: { key3: "value" } });
        });
        test("getChild with '.' key separator object", async () => {
            const obj = { key1: { key2: { key3: "value" } } };
            const configurationBuilder = new ConfigurationBuilder();
            configurationBuilder.addInMemoryConfiguration(obj);
            const config = await configurationBuilder.build();
            const value = config.get(`key1.key2`);
            assert.deepEqual(value, { key3: "value" });
        });
        test("load and combine key value pairs from different configuration providers", async () => {
            const memConfigSrc1 = new MemoryConfigurationSource(dic1);
            const memConfigSrc2 = new MemoryConfigurationSource(dic2);
            const memConfigSrc3 = new MemoryConfigurationSource(dic3);

            const configurationBuilder = new ConfigurationBuilder();

            configurationBuilder.add(memConfigSrc1);
            configurationBuilder.add(memConfigSrc2);
            configurationBuilder.add(memConfigSrc3);

            const config = await configurationBuilder.build();

            const memVal1 = config.get(`key1.key1`);
            const memVal2 = config.get(`key2.key2`);
            const memVal3 = config.get(`key3.key3`);

            assert.strictEqual(Array.from(configurationBuilder.sources.values())[0], memConfigSrc1);
            assert.strictEqual(Array.from(configurationBuilder.sources.values())[1], memConfigSrc2);
            assert.strictEqual(Array.from(configurationBuilder.sources.values())[2], memConfigSrc3);

            assert.strictEqual(memVal1, "ValueInMem1");
            assert.strictEqual(memVal2, "ValueInMem2");
            assert.strictEqual(memVal3, "ValueInMem3");
            assert.equal(config.get("NotExist"), undefined);
        });
        test("new configuration overrides old one when key is duplicated", async () => {
            const dic1 = { key1: { key2: "ValueInMem1" } };
            const dic2 = { key1: { key2: "ValueInMem2" } };
            const memConfigSrc1 = new MemoryConfigurationSource(dic1);
            const memConfigSrc2 = new MemoryConfigurationSource(dic2);

            const configurationBuilder = new ConfigurationBuilder();

            configurationBuilder.add(memConfigSrc1);
            configurationBuilder.add(memConfigSrc2);

            const config = await configurationBuilder.build();

            assert.strictEqual(config.get(`key1.key2`), "ValueInMem2");
        });
        test("new configuration may be built from existing one", async () => {
            const configurationRoot = await new ConfigurationBuilder()
                .addInMemoryConfiguration({ keya: { keyb: "valueA" } })
                .addInMemoryConfiguration({ keya: { keyb: "valueB" } })
                .build();
            const newConfigurationRoot = await new ConfigurationBuilder()
                .addInMemoryConfiguration(configurationRoot)
                .build();
            const value = newConfigurationRoot.get(`keya.keyb`);
            assert.strictEqual(value, "valueB");
        });
        test("sources returns added configuration sources", async () => {
            const dict = { "Mem.KeyInMem": "MemVal" };
            const memConfigSrc1 = new MemoryConfigurationSource(dict);
            const memConfigSrc2 = new MemoryConfigurationSource(dict);
            const memConfigSrc3 = new MemoryConfigurationSource(dict);

            const configurationBuilder = new ConfigurationBuilder();

            configurationBuilder.add(memConfigSrc1);
            configurationBuilder.add(memConfigSrc2);
            configurationBuilder.add(memConfigSrc3);

            await configurationBuilder.build();

            assert.deepEqual(configurationBuilder.sources, new Set([memConfigSrc1, memConfigSrc2, memConfigSrc3]));
        });
        test("validation", async () => {
            const configurationBuilder = new ConfigurationBuilder();
            configurationBuilder.addInMemoryConfiguration(
                { key1: { key2: "ValueInMem1" } },
                {
                    validation: async (config: TConfiguration) => {
                        const schema = Joi.object({
                            key1: Joi.object({
                                key2: Joi.string().required(),
                            }),
                        });
                        try {
                            return schema.validateAsync(config, { abortEarly: false, allowUnknown: true });
                        } catch (err) {
                            throw new Error("Validation failed: " + err.message);
                        }
                    },
                },
            );
            await assert.doesNotReject(async () => await configurationBuilder.build());
        });
        test("validation fail", async () => {
            const configurationBuilder = new ConfigurationBuilder();
            configurationBuilder.addInMemoryConfiguration(
                { key1: { key2: "ValueInMem1" } },
                {
                    validation: async (config: TConfiguration) => {
                        const schema = Joi.object({
                            key1: Joi.object({
                                key2: Joi.number().required(),
                            }),
                        });
                        try {
                            return await schema.validateAsync(config, { abortEarly: false, allowUnknown: true });
                        } catch (err) {
                            throw new Error("Validation failed: " + err.message);
                        }
                    },
                },
            );
            await assert.rejects(async () => await configurationBuilder.build(), /Validation failed/);
        });
    });
});
