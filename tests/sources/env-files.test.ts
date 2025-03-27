import { test, describe } from "node:test";
import { ConfigurationBuilder, type TConfiguration } from "../../src/index.ts";
import * as assert from "node:assert/strict";
import { env } from "node:process";
import { z } from "zod";

describe("@Dymexjs/config", () => {
  describe("env files source", () => {
    test("should load from env file", async (t) => {
      const configBuilder = new ConfigurationBuilder();
      configBuilder.addEnvFileConfiguration(".env");
      t.mock.method(
        Array.from(configBuilder.sources.values())[0],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "readFile" as any,
        async () => "ENV=test\n",
      );
      const config = await configBuilder.build();
      assert.strictEqual(config.get("ENV"), "test");
    });
    test("should load from env files and rewrite existent", async (t) => {
      const configBuilder = new ConfigurationBuilder();
      configBuilder.addEnvFileConfiguration(".env");
      configBuilder.addEnvFileConfiguration(".env.development");
      t.mock.method(
        Array.from(configBuilder.sources.values())[0],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "readFile" as any,
        async () => "ENV=test\n",
      );
      t.mock.method(
        Array.from(configBuilder.sources.values())[1],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "readFile" as any,
        async () => "ENV=development",
      );
      const config = await configBuilder.build();
      assert.strictEqual(config.get("ENV"), "development");
    });
    describe("postBuild - expand", () => {
      test("should expand environment variables", async (t) => {
        const configBuilder = new ConfigurationBuilder();
        configBuilder.addEnvFileConfiguration(".env");
        configBuilder.addEnvFileConfiguration(".env.development");
        t.mock.method(
          Array.from(configBuilder.sources.values())[0],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          "readFile" as any,
          async () => `
                    ENV=test
                    BASIC='basic'
                    BASIC_EXPAND=\${BASIC}
                    BASIC_EXPAND_SIMPLE='\${BASIC}'
                    EXPAND_SELF='\${EXPAND_SELF}'
                    EXPAND_SELF2=\${EXPAND_SELF2}
                    UNDEFINED_EXPAND='\${UNDEFINED}'
                    ESCAPED_EXPAND='\\\${ESCAPED}'
                    INLINE_ESCAPED_EXPAND='pa\\$\\$word'
                    INLINE_ESCAPED_EXPAND_BCRYPT=\\$2b\\$10\\$OMZ69gxxsmRgwAt945WHSujpr/u8ZMx.xwtxWOCMkeMW7p3XqKYca
                    FOO=bar
                    POSTGRESQL.BASE.USER=postgres
                    DOLLAR=$
                    DATE='2014-10-25T03:46:20-0300'
                    BOOLEAN=true
                    `,
        );
        t.mock.method(
          Array.from(configBuilder.sources.values())[1],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          "readFile" as any,
          async () => `
                    BAR=\${FOO}foo
                    ENV=development
                    PARAM1=42
                    MIXED_VALUES=\\$this\${PARAM1}\\$is\${PARAM1}
                    MONGOLAB_DATABASE=heroku_db
                    MONGOLAB_USER=username
                    MONGOLAB_PASSWORD=password
                    MONGOLAB_DOMAIN=abcd1234.mongolab.com
                    MONGOLAB_PORT=12345
                    MONGOLAB_URI=mongodb://\${MONGOLAB_USER}:\${MONGOLAB_PASSWORD}@\${MONGOLAB_DOMAIN}:\${MONGOLAB_PORT}/\${MONGOLAB_DATABASE}
                    MONGOLAB_USER_RECURSIVELY=\${MONGOLAB_USER}:\${MONGOLAB_PASSWORD}
                    MONGOLAB_URI_RECURSIVELY=mongodb://\${MONGOLAB_USER_RECURSIVELY}@\${MONGOLAB_DOMAIN}:\${MONGOLAB_PORT}/\${MONGOLAB_DATABASE}
                    UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS=\${UNDEFINED:-/default/path:with/colon}
                    UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS2=\${UNDEFINED:-/default/path:with/colon}
                    NO_CURLY_BRACES_URI=mongodb://\${MONGOLAB_USER}:\${MONGOLAB_PASSWORD}@\${MONGOLAB_DOMAIN}:\${MONGOLAB_PORT}/\${MONGOLAB_DATABASE}
                    NO_CURLY_BRACES_USER_RECURSIVELY=\${MONGOLAB_USER}:\${MONGOLAB_PASSWORD}
                    NO_CURLY_BRACES_URI_RECURSIVELY=mongodb://\${MONGOLAB_USER_RECURSIVELY}@\${MONGOLAB_DOMAIN}:\${MONGOLAB_PORT}/\${MONGOLAB_DATABASE}
                    NO_CURLY_BRACES_UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS=\${UNDEFINED:-/default/path:with/colon}
                    NO_CURLY_BRACES_UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS2=\${UNDEFINED:-/default/path:with/colon}
                    UNDEFINED_EXPAND_DEFAULT=\${UNDEFINED:-default}
                    POSTGRESQL.MAIN.USER=\${POSTGRESQL.BASE.USER}
                    `,
        );
        const config = await configBuilder.build();
        assert.strictEqual(config.get("ENV"), "development");
        assert.strictEqual(config.get("BAR"), "barfoo");
        assert.strictEqual(config.get("BASIC_EXPAND"), "basic");
        assert.strictEqual(config.get("BASIC_EXPAND_SIMPLE"), "basic");
        assert.strictEqual(config.get("EXPAND_SELF"), "${EXPAND_SELF}");
        assert.strictEqual(config.get("EXPAND_SELF2"), "${EXPAND_SELF2}");
        assert.strictEqual(config.get("UNDEFINED_EXPAND"), "");
        assert.strictEqual(config.get("ESCAPED_EXPAND"), "${ESCAPED}");
        assert.strictEqual(config.get("INLINE_ESCAPED_EXPAND"), "pa$$word");
        assert.strictEqual(
          config.get("INLINE_ESCAPED_EXPAND_BCRYPT"),
          "$2b$10$OMZ69gxxsmRgwAt945WHSujpr/u8ZMx.xwtxWOCMkeMW7p3XqKYca",
        );
        assert.strictEqual(config.get("MIXED_VALUES"), "$this42$is42");
        assert.strictEqual(
          config.get("MONGOLAB_URI"),
          "mongodb://username:password@abcd1234.mongolab.com:12345/heroku_db",
        );
        assert.strictEqual(
          config.get("MONGOLAB_URI_RECURSIVELY"),
          "mongodb://username:password@abcd1234.mongolab.com:12345/heroku_db",
        );
        assert.strictEqual(
          config.get("NO_CURLY_BRACES_URI"),
          "mongodb://username:password@abcd1234.mongolab.com:12345/heroku_db",
        );
        assert.strictEqual(
          config.get("NO_CURLY_BRACES_URI_RECURSIVELY"),
          "mongodb://username:password@abcd1234.mongolab.com:12345/heroku_db",
        );
        assert.strictEqual(config.get("UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS"), "/default/path:with/colon");
        assert.strictEqual(config.get("UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS2"), "/default/path:with/colon");
        assert.strictEqual(
          config.get("NO_CURLY_BRACES_UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS"),
          "/default/path:with/colon",
        );
        assert.strictEqual(config.get("POSTGRESQL.MAIN.USER"), "postgres");
        assert.strictEqual(config.get("DOLLAR"), "$");
        assert.strictEqual(config.get("UNDEFINED_EXPAND_DEFAULT"), "default");
        assert.ok(config.get("DATE") instanceof Date);
        assert.strictEqual(config.get("BOOLEAN"), true);
      });
      test("should expand environment variables more cases", async (t) => {
        env.PASSWORD = "pas$word";
        const configBuilder = new ConfigurationBuilder();
        configBuilder.addEnvVariablesConfiguration("PASSWORD");
        configBuilder.addEnvFileConfiguration(".env");
        configBuilder.addEnvFileConfiguration(".env.development");

        t.mock.method(
          Array.from(configBuilder.sources.values())[1],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          "readFile" as any,
          async () => `
                    DONT_CHOKE1='.kZh\`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!'
                    DONT_CHOKE2='=;+=CNy3)-D=zI6gRP2w\\$B@0K;Y]e^EFnCmx\\$Dx?;.9wf-rgk1BcTR0]JtY<S:b_'
                    DONT_CHOKE3='MUcKSGSY@HCON<1S_siWTP\`DgS*Ug],mu]SkqI|7V2eOk9:>&fw;>HEwms\`D8E2H'
                    DONT_CHOKE4='m]zjzfRItw2gs[2:{p{ugENyFw9m)tH6_VCQzer\`*noVaI<vqa3?FZ9+6U;K#Bfd'
                    DONT_CHOKE5='#la__nK?IxNlQ%\`5q&DpcZ>Munx=[1-AMgAcwmPkToxTaB?kgdF5y\`A8m=Oa-B!)'
                    DONT_CHOKE6='xlC&*<j4J<d._<JKH0RBJV!4(ZQEN-+&!0p137<g*hdY2H4xk?/;KO1\\$(W{:Wc}Q'
                    DONT_CHOKE7='?\\$6)m*xhTVewc#NVVgxX%eBhJjoHYzpXFg=gzn[rWXPLj5UWj@z\\$/UDm8o79n/p%'
                    DONT_CHOKE8='@}:[4#g%[R-CFR});bY(Z[KcDQDsVn2_y4cSdU<Mjy!c^F\`G<!Ks7]kbS]N1:bP:'
                    `,
        );
        t.mock.method(
          Array.from(configBuilder.sources.values())[2],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          "readFile" as any,
          async () => `
                    HOST="something"
                    DOMAIN="https://\${HOST}"
                    PASSWORD_EXPAND=\${PASSWORD}
                    PASSWORD_EXPAND_SIMPLE=\${PASSWORD}
                    PASSWORD_EXPAND_NESTED=\${PASSWORD_EXPAND}
                    PASSWORD_EXPAND_NESTED_NESTED=\${PASSWORD_EXPAND_NESTED}
                    NO_VARIABLES='\\$.$+$-$$'
                    `,
        );
        const config = await configBuilder.build();
        assert.strictEqual(
          config.get("DONT_CHOKE1"),
          ".kZh`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!",
        );
        assert.strictEqual(
          config.get("DONT_CHOKE2"),
          "=;+=CNy3)-D=zI6gRP2w$B@0K;Y]e^EFnCmx$Dx?;.9wf-rgk1BcTR0]JtY<S:b_",
        );
        assert.strictEqual(
          config.get("DONT_CHOKE3"),
          "MUcKSGSY@HCON<1S_siWTP`DgS*Ug],mu]SkqI|7V2eOk9:>&fw;>HEwms`D8E2H",
        );
        assert.strictEqual(
          config.get("DONT_CHOKE4"),
          "m]zjzfRItw2gs[2:{p{ugENyFw9m)tH6_VCQzer`*noVaI<vqa3?FZ9+6U;K#Bfd",
        );
        assert.strictEqual(
          config.get("DONT_CHOKE5"),
          "#la__nK?IxNlQ%`5q&DpcZ>Munx=[1-AMgAcwmPkToxTaB?kgdF5y`A8m=Oa-B!)",
        );
        assert.strictEqual(
          config.get("DONT_CHOKE6"),
          "xlC&*<j4J<d._<JKH0RBJV!4(ZQEN-+&!0p137<g*hdY2H4xk?/;KO1$(W{:Wc}Q",
        );
        assert.strictEqual(
          config.get("DONT_CHOKE7"),
          "?$6)m*xhTVewc#NVVgxX%eBhJjoHYzpXFg=gzn[rWXPLj5UWj@z$/UDm8o79n/p%",
        );
        assert.strictEqual(
          config.get("DONT_CHOKE8"),
          "@}:[4#g%[R-CFR});bY(Z[KcDQDsVn2_y4cSdU<Mjy!c^F`G<!Ks7]kbS]N1:bP:",
        );
        assert.strictEqual(config.get("HOST"), "something");
        assert.strictEqual(config.get("DOMAIN"), "https://something");
        assert.strictEqual(config.get("PASSWORD"), "pas$word");
        assert.strictEqual(config.get("PASSWORD_EXPAND"), "pas$word");
        assert.strictEqual(config.get("PASSWORD_EXPAND_SIMPLE"), "pas$word");
        assert.strictEqual(config.get("PASSWORD_EXPAND_NESTED"), "pas$word");
        assert.strictEqual(config.get("NO_VARIABLES"), "$.$+$-$$");
        delete env.PASSWORD;
      });
      test("validation", async (t) => {
        const configurationBuilder = new ConfigurationBuilder();
        configurationBuilder.addEnvFileConfiguration(".env", {
          validation: async (config: TConfiguration) => {
            const schema = z.object({
              ENV: z.string(),
              KEY1: z.string(),
              PORT: z.number(),
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
          async () => "ENV=test\nKEY1=key1\nPORT=3000",
        );
        await assert.doesNotReject(async () => await configurationBuilder.build());
        const config = await configurationBuilder.build();
        assert.strictEqual(typeof config.get("PORT"), "number");
      });
      test("validation fail", async (t) => {
        const configurationBuilder = new ConfigurationBuilder();
        configurationBuilder.addEnvFileConfiguration(".env", {
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
          async () => "ENV=test\nKEY1=key1",
        );
        await assert.rejects(async () => await configurationBuilder.build(), /Validation failed/);
      });
    });
  });
});
