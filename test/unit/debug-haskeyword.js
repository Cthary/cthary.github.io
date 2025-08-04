// Debug hasKeyword function
import { test } from "node:test";
import { strict as assert } from "node:assert";

test("Debug hasKeyword", (t) => {
    t.test("test keyword normalization", () => {
        const keywords = ["ignores cover"];
        const normalizedKeywords = keywords.map(k => k.toLowerCase());
        
        console.log("Original keywords:", keywords);
        console.log("Normalized keywords:", normalizedKeywords);
        
        const hasKeyword = (keyword) => normalizedKeywords.includes(keyword.toLowerCase());
        
        console.log("hasKeyword('ignores cover'):", hasKeyword("ignores cover"));
        console.log("hasKeyword('IGNORES COVER'):", hasKeyword("IGNORES COVER"));
        
        assert.ok(hasKeyword("ignores cover"));
    });
});
