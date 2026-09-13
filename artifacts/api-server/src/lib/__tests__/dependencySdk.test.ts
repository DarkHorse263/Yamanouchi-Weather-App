import test from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { XMLParser } from "fast-xml-parser";

test("upgraded Supabase client preserves PostgREST cache reads without realtime", async () => {
  const calls: URL[] = [];
  const client = createClient("https://example.invalid", "test-only-public-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (input) => {
        calls.push(new URL(String(input)));
        return new Response(JSON.stringify([{ id: "thredbo", snow_cm: 12 }]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  });
  const { data, error } = await client.from("snow_cache").select("*").eq("id", "thredbo");
  assert.equal(error, null);
  assert.deepEqual(data, [{ id: "thredbo", snow_cm: 12 }]);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].pathname, "/rest/v1/snow_cache");
  assert.equal(calls[0].searchParams.get("id"), "eq.thredbo");
});

test("upgraded XML parser rejects repeated DOCTYPE declarations", () => {
  const xml = '<!DOCTYPE report [<!ENTITY snow "12">]><!DOCTYPE report [<!ENTITY base "20">]><report>&snow;</report>';
  assert.throws(() => new XMLParser().parse(xml));
});