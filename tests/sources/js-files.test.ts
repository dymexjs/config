import { test, describe } from "node:test";
import { ConfigurationBuilder, TConfiguration } from "../../src";
import * as assert from "node:assert/strict";
import Joi from "joi";

describe("@Dymexjs/config", () => {
    describe("js files source", () => {
        test("should load from js file", async (t) => {
            const configBuilder = new ConfigurationBuilder();
            configBuilder.addJsFileConfiguration("env.js");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            t.mock.method(Array.from(configBuilder.sources.values())[0], "readFile" as any, async () => ({
                ENV: "test",
                PORT: 3000,
            }));
            const config = await configBuilder.build();
            assert.strictEqual(config.get("ENV"), "test");
            assert.strictEqual(typeof config.get("PORT"), "number");
        });
        test("should load from js files and rewrite existent", async (t) => {
            const configBuilder = new ConfigurationBuilder();
            configBuilder.addJsFileConfiguration("env.js");
            configBuilder.addJsFileConfiguration("env.development.js");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            t.mock.method(Array.from(configBuilder.sources.values())[0], "readFile" as any, async () => ({
                ENV: "test",
            }));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            t.mock.method(Array.from(configBuilder.sources.values())[1], "readFile" as any, async () => ({
                ENV: "development",
                FOO: "bar",
                BAR: "${FOO}foo",
            }));
            const config = await configBuilder.build();
            assert.strictEqual(config.get("ENV"), "development");
        });
        test("validation", async (t) => {
            const configurationBuilder = new ConfigurationBuilder();
            configurationBuilder.addJsFileConfiguration("file.js", {
                validation: async (config: TConfiguration) => {
                    const schema = Joi.object({
                        ENV: Joi.string().required(),
                        KEY1: Joi.string().required(),
                    });
                    try {
                        return schema.validateAsync(config, { abortEarly: false, allowUnknown: true });
                    } catch (err) {
                        throw new Error("Validation failed: " + err.message);
                    }
                },
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            t.mock.method(Array.from(configurationBuilder.sources.values())[0], "readFile" as any, async () => ({
                ENV: "development",
                KEY1: "bar",
            }));
            await assert.doesNotReject(async () => await configurationBuilder.build());
        });
        test("validation fail", async (t) => {
            const configurationBuilder = new ConfigurationBuilder();
            configurationBuilder.addJsFileConfiguration("file.js", {
                validation: async (config: TConfiguration) => {
                    const schema = Joi.object({
                        ENV: Joi.string().required(),
                        KEY1: Joi.number().required(),
                    });
                    try {
                        return await schema.validateAsync(config, { abortEarly: false, allowUnknown: true });
                    } catch (err) {
                        throw new Error("Validation failed: " + err.message);
                    }
                },
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            t.mock.method(Array.from(configurationBuilder.sources.values())[0], "readFile" as any, async () => ({
                ENV: "development",
                KEY1: "bar",
            }));
            await assert.rejects(async () => await configurationBuilder.build(), /Validation failed/);
        });
    });
});
