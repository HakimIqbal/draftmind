import { describe, it, expect } from "vitest";
import { getPublicOrigin } from "@/lib/http/public-origin";

describe("getPublicOrigin", () => {
  it("prefers NEXT_PUBLIC_APP_URL over internal localhost origin", () => {
    const headers = new Headers({
      host: "localhost:3000",
      "x-forwarded-host": "draftmind.web.id",
      "x-forwarded-proto": "https",
    });

    expect(
      getPublicOrigin({
        nextUrlOrigin: "http://localhost:3000",
        headers,
        envAppUrl: "https://draftmind.web.id",
      }),
    ).toBe("https://draftmind.web.id");
  });

  it("falls back to forwarded host/proto when env is absent", () => {
    const headers = new Headers({
      host: "localhost:3000",
      "x-forwarded-host": "draftmind.web.id",
      "x-forwarded-proto": "https",
    });

    expect(
      getPublicOrigin({
        nextUrlOrigin: "http://localhost:3000",
        headers,
      }),
    ).toBe("https://draftmind.web.id");
  });

  it("keeps existing public origin when already correct", () => {
    const headers = new Headers({ host: "draftmind.web.id" });

    expect(
      getPublicOrigin({
        nextUrlOrigin: "https://draftmind.web.id",
        headers,
      }),
    ).toBe("https://draftmind.web.id");
  });
});
