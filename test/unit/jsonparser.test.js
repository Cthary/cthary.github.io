import { test, describe } from "node:test";
import { strict as assert } from "assert";
import { JsonParser } from "../../src/scripts/jsonparser.js";
import { TestUtils } from "../test-utils.js";

describe("JsonParser Class", () => {
    test("should create a JsonParser instance", () => {
        const testData = TestUtils.createSimulationData();
        const parser = new JsonParser(testData);
        assert.ok(parser instanceof JsonParser);
        assert.strictEqual(parser.json, testData);
    });

    test("should get attacker by index", () => {
        const testData = TestUtils.createSimulationData();
        const parser = new JsonParser(testData);

        const attacker = parser.getAttacker(0);
        assert.ok(attacker);
        assert.strictEqual(attacker.Name, "Space Marine Squad");
        assert.ok(attacker.Weapons.length > 0);
    });

    test("should get all defenders", () => {
        const testData = TestUtils.createSimulationData();
        const parser = new JsonParser(testData);

        const defenders = parser.getDefenders();
        assert.ok(Array.isArray(defenders));
        assert.strictEqual(defenders.length, 1);
        assert.strictEqual(defenders[0].Name, "Ork Boyz");
    });

    test("should handle multiple attackers", () => {
        const testData = {
            Amount: 100,
            Attackers: [
                TestUtils.createTestAttacker({ Name: "Attacker 1" }),
                TestUtils.createTestAttacker({ Name: "Attacker 2" })
            ],
            Defenders: [TestUtils.createTestDefender()]
        };

        const parser = new JsonParser(testData);

        const attacker1 = parser.getAttacker(0);
        const attacker2 = parser.getAttacker(1);

        assert.strictEqual(attacker1.Name, "Attacker 1");
        assert.strictEqual(attacker2.Name, "Attacker 2");
    });

    test("should handle multiple defenders", () => {
        const testData = {
            Amount: 100,
            Attackers: [TestUtils.createTestAttacker()],
            Defenders: [
                TestUtils.createTestDefender({ Name: "Defender 1" }),
                TestUtils.createTestDefender({ Name: "Defender 2" })
            ]
        };

        const parser = new JsonParser(testData);
        const defenders = parser.getDefenders();

        assert.strictEqual(defenders.length, 2);
        assert.strictEqual(defenders[0].Name, "Defender 1");
        assert.strictEqual(defenders[1].Name, "Defender 2");
    });

    test("should handle invalid attacker index", () => {
        const testData = TestUtils.createSimulationData();
        const parser = new JsonParser(testData);

        assert.throws(() => {
            parser.getAttacker(999);
        }, Error);
    });

    test("should handle empty defenders array", () => {
        const testData = {
            Amount: 100,
            Attackers: [TestUtils.createTestAttacker()],
            Defenders: []
        };

        const parser = new JsonParser(testData);
        const defenders = parser.getDefenders();

        assert.ok(Array.isArray(defenders));
        assert.strictEqual(defenders.length, 0);
    });

    test("should preserve original data", () => {
        const testData = TestUtils.createSimulationData();
        const parser = new JsonParser(testData);

        // Modifiziere den Angreifer
        const attacker = parser.getAttacker(0);
        attacker.Name = "Modified Name";

        // Original sollte unverändert sein
        assert.strictEqual(parser.json.Attackers[0].Name, "Space Marine Squad");
    });
});
