import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import ts from "typescript";
import { publishedRecords } from "@workspace/ski-catalogue/public-runtime";
import { visitorCopy, visitorLabel } from "../public-copy";

const AUDIT_LANGUAGE = /⚠️|unverified|in research|treat as|per resort|2025[-–/]26|tracker|not confirmed|unconfirmed|conflicting|sources disagree|verify-status|first-party|at time of writing|data gap/i;

test("publication filter never promotes caveats to verified claims", () => {
  assert.equal(visitorCopy("Resort · ⚠️ no confirmed webcam URL found in research"),
    "Resort. Check the resort's official site for current operating status and pass terms before travelling.");
  assert.equal(visitorLabel("Sierra-at-Tahoe (closed for 2025/26 season)"), "Sierra-at-Tahoe");
  assert.match(visitorCopy("⚠️ avalanche risk needs verification")!, /avalanche advisories/i);
});

test("all authored region blurbs and link labels and imported public catalogue copy are visitor-safe", () => {
  const regionDir = path.resolve(import.meta.dirname, "..");
  let checked = 0;
  for (const filename of readdirSync(regionDir).filter((name) => name.endsWith(".ts") && !name.endsWith(".test.ts"))) {
    const source = ts.createSourceFile(filename, readFileSync(path.join(regionDir, filename), "utf8"), ts.ScriptTarget.Latest, true);
    function walk(node: ts.Node) {
      if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name) && ["blurb", "blurbJa", "label"].includes(node.name.text) &&
        ts.isStringLiteral(node.initializer)) {
        const original = node.initializer.text;
        const output = node.name.text === "label" ? visitorLabel(original) :
          visitorCopy(original, node.name.text === "blurbJa" ? "ja" : "en")!;
        assert.ok(output.trim(), `${filename}: empty public copy`);
        assert.doesNotMatch(output, AUDIT_LANGUAGE, `${filename}: public copy leaked research note`);
        checked++;
      }
      ts.forEachChild(node, walk);
    }
    walk(source);
  }
  for (const record of publishedRecords) {
    const output = visitorCopy(record.publicCopy)!;
    assert.doesNotMatch(output, AUDIT_LANGUAGE, `${record.publicId}: catalogue leaked research note`);
    checked++;
  }
  assert.ok(checked > 300, "expect whole region and catalogue inventory, not selected examples");
});