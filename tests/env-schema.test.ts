import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("Env schema parser (issue #137)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("should apply defaults for PORT, APP_NAME, and API_PREFIX", async () => {
    delete process.env.PORT;
    delete process.env.APP_NAME;
    delete process.env.API_PREFIX;
    process.env.NODE_ENV = "test";

    const { env } = await import("../src/config/env");
    expect(env.PORT).toBe(4000);
    expect(env.APP_NAME).toBe("Lily Backend");
    expect(env.API_PREFIX).toBe("/api/v1");
  });

  it("should coerce PORT string to number", async () => {
    process.env.PORT = "8080";
    process.env.NODE_ENV = "test";

    const { env } = await import("../src/config/env");
    expect(env.PORT).toBe(8080);
    expect(typeof env.PORT).toBe("number");
  });

  it("should reject invalid NODE_ENV values", async () => {
    process.env.NODE_ENV = "staging";

    await expect(import("../src/config/env")).rejects.toThrow(
      "Invalid environment configuration",
    );
  });

  it("should transform numeric hop count string to a number", async () => {
    process.env.TRUST_PROXY = "1";
    process.env.NODE_ENV = "test";

    const { env } = await import("../src/config/env");
    expect(env.TRUST_PROXY).toBe(1);
    expect(typeof env.TRUST_PROXY).toBe("number");
  });

  it("should transform TRUST_PROXY string 'false' to boolean false", async () => {
    process.env.TRUST_PROXY = "false";
    process.env.NODE_ENV = "test";

    const { env } = await import("../src/config/env");
    expect(env.TRUST_PROXY).toBe(false);
    expect(typeof env.TRUST_PROXY).toBe("boolean");
  });

  it("should reject unsafe TRUST_PROXY string 'true'", async () => {
    process.env.TRUST_PROXY = "true";
    process.env.NODE_ENV = "test";

    await expect(import("../src/config/env")).rejects.toThrow(
      "Invalid environment configuration",
    );
  });

  it("should default TRUST_PROXY to false", async () => {
    delete process.env.TRUST_PROXY;
    process.env.NODE_ENV = "test";

    const { env } = await import("../src/config/env");
    expect(env.TRUST_PROXY).toBe(false);
  });

  it("should parse rate limit values as positive integers", async () => {
    process.env.RATE_LIMIT_WINDOW_MS = "60000";
    process.env.RATE_LIMIT_MAX_REQUESTS = "50";
    process.env.NODE_ENV = "test";

    const { env } = await import("../src/config/env");
    expect(env.RATE_LIMIT_WINDOW_MS).toBe(60000);
    expect(env.RATE_LIMIT_MAX_REQUESTS).toBe(50);
  });

  it("should reject non-positive rate limit values", async () => {
    process.env.RATE_LIMIT_MAX_REQUESTS = "0";
    process.env.NODE_ENV = "test";

    await expect(import("../src/config/env")).rejects.toThrow(
      "Invalid environment configuration",
    );
  });

  it("should keep x-api-key as the default API key header", async () => {
    delete process.env.AUTH_API_KEY_HEADER;
    process.env.NODE_ENV = "test";

    const { env } = await import("../src/config/env");
    expect(env.AUTH_API_KEY_HEADER).toBe("x-api-key");
  });

  it("should accept an ordinary custom API key header", async () => {
    process.env.AUTH_API_KEY_HEADER = "x-auth-key";
    process.env.NODE_ENV = "test";

    const { env } = await import("../src/config/env");
    expect(env.AUTH_API_KEY_HEADER).toBe("x-auth-key");
  });

  it.each(["my header", "   ", "x-auth-key:", "x-auth-key\tvalue"])(
    "should reject malformed API key header name %j",
    async (headerName) => {
      process.env.AUTH_API_KEY_HEADER = headerName;
      process.env.NODE_ENV = "test";
      vi.resetModules();

      await expect(import("../src/config/env")).rejects.toThrow(
        "Invalid environment configuration",
      );
    },
  );

  it.each(["authorization", "Authorization", "cookie", "set-cookie"])(
    "should reject reserved auth/session header %j",
    async (headerName) => {
      process.env.AUTH_API_KEY_HEADER = headerName;
      process.env.NODE_ENV = "test";
      vi.resetModules();

      await expect(import("../src/config/env")).rejects.toThrow(
        "Invalid environment configuration",
      );
    },
  );
});
