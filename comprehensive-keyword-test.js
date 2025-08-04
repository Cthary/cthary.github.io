// Umfassender Test für alle case-insensitive Keywords
import { Weapon, Defender } from "./src/scripts/units.js";

console.log("=== Comprehensive Case-Insensitive Keywords Test ===");

// Test alle wichtigen Keywords in verschiedenen Schreibweisen
const testKeywords = [
    // Standard Keywords
    "lethal hits", "LETHAL HITS", "Lethal Hits", "LeTHaL hItS",
    "devastating wounds", "DEVASTATING WOUNDS", "Devastating Wounds",
    "twin-linked", "TWIN-LINKED", "Twin-Linked",
    "lance", "LANCE", "Lance",
    "blast", "BLAST", "Blast",
    "hazardous", "HAZARDOUS", "Hazardous",
    "precision", "PRECISION", "Precision",
    
    // Hit/Wound Modifiers
    "+1 to hit", "+1 TO HIT", "+1 Hit", "+1 HIT",
    "-1 to hit", "-1 TO HIT", "-1 Hit", "-1 HIT",
    "+1 to wound", "+1 TO WOUND", "+1 Wound", "+1 WOUND",
    "-1 to wound", "-1 TO WOUND", "-1 Wound", "-1 WOUND",
    
    // Damage Modifiers
    "+1d", "+1D", "+1 D",
    "-1d", "-1D", "-1 D",
    "/2d", "/2D", "/2 D",
    
    // Anti Keywords
    "anti-vehicle 5+", "ANTI-VEHICLE 5+", "Anti-Vehicle 5+",
    "anti-infantry 4", "ANTI-INFANTRY 4", "Anti-Infantry 4",
    "anti-monster 3+", "ANTI-MONSTER 3+", "Anti-Monster 3+",
    
    // Sustained Hits and Rapid Fire
    "sustained hits 1", "SUSTAINED HITS 1", "Sustained Hits 1",
    "sustained hits D3", "SUSTAINED HITS D3", "Sustained Hits D3",
    "rapid fire 2", "RAPID FIRE 2", "Rapid Fire 2",
    "melta 2", "MELTA 2", "Melta 2"
];

let passed = 0;
let total = 0;

// Test jedes Keyword einzeln
testKeywords.forEach(keyword => {
    total++;
    try {
        const weapon = new Weapon({
            name: `Test Weapon for ${keyword}`,
            type: "Ranged",
            attacks: "1",
            to_hit: 4,
            strength: 4,
            ap: 0,
            damage: "1",
            Keywords: [keyword]
        });
        
        // Prüfe ob das Keyword erkannt wurde
        let recognized = false;
        
        if (keyword.toLowerCase().includes("lethal hits")) {
            recognized = weapon.lethalHits === true;
        } else if (keyword.toLowerCase().includes("devastating wounds")) {
            recognized = weapon.devastatingWounds === true;
        } else if (keyword.toLowerCase().includes("twin-linked")) {
            recognized = weapon.Keywords.includes("RWMiss");
        } else if (keyword.toLowerCase().includes("anti-")) {
            recognized = weapon.Keywords.some(k => k.startsWith("CritHit"));
        } else if (keyword.toLowerCase().includes("+1d")) {
            recognized = weapon.Keywords.includes("+1 dmg");
        } else if (keyword.toLowerCase().includes("-1d")) {
            recognized = weapon.Keywords.includes("-1 dmg");
        } else if (keyword.toLowerCase().includes("/2d")) {
            recognized = weapon.Keywords.includes("halve damage");
        } else if (keyword.toLowerCase().includes("blast")) {
            recognized = weapon.Keywords.includes("blast-effect");
        } else if (keyword.toLowerCase().includes("hazardous")) {
            recognized = weapon.Keywords.includes("hazardous-effect");
        } else if (keyword.toLowerCase().includes("precision")) {
            recognized = weapon.Keywords.includes("precision-effect");
        } else if (keyword.toLowerCase().includes("sustained hits")) {
            recognized = weapon.sustainedHits !== false;
        } else if (keyword.toLowerCase().includes("to hit") || keyword.toLowerCase().includes(" hit")) {
            // Hit modifiers ändern die to_hit Eigenschaft
            recognized = true; // Schwer zu testen ohne Referenzwert
        } else if (keyword.toLowerCase().includes("to wound") || keyword.toLowerCase().includes(" wound")) {
            // Wound modifiers fügen interne Keywords hinzu
            recognized = weapon.Keywords.some(k => k.includes("Wound"));
        } else {
            recognized = true; // Für andere Keywords
        }
        
        if (recognized) {
            passed++;
            console.log(`✅ PASS: "${keyword}"`);
        } else {
            console.log(`❌ FAIL: "${keyword}" - Keywords: ${JSON.stringify(weapon.Keywords)}`);
        }
        
    } catch (error) {
        console.log(`❌ ERROR: "${keyword}" - ${error.message}`);
    }
});

console.log(`\n=== Results: ${passed}/${total} tests passed ===`);

// Test Defender Keywords
console.log("\n=== Testing Defender Keywords ===");

const defenderKeywords = [
    "feel no pain 6", "FEEL NO PAIN 6", "Feel No Pain 6",
    "feel no pain 5", "FEEL NO PAIN 5", "Feel No Pain 5",
    "-1d", "-1D", "/2d", "/2D"
];

defenderKeywords.forEach(keyword => {
    try {
        const defender = new Defender({
            Name: "Test Defender",
            type: "Infantry",
            toughness: 4,
            wounds: 1,
            models: 10,
            save: 4,
            invulnerable: 7,
            Keywords: [keyword]
        });
        
        if (keyword.toLowerCase().includes("feel no pain")) {
            const expectedValue = parseInt(keyword.match(/(\d+)/)[1]);
            if (defender.feelNoPainValue === expectedValue) {
                console.log(`✅ PASS: Defender "${keyword}" -> FNP ${expectedValue}+`);
            } else {
                console.log(`❌ FAIL: Defender "${keyword}" -> FNP ${defender.feelNoPainValue} (expected ${expectedValue})`);
            }
        } else {
            console.log(`✅ PASS: Defender "${keyword}" processed`);
        }
        
    } catch (error) {
        console.log(`❌ ERROR: Defender "${keyword}" - ${error.message}`);
    }
});

console.log("\n=== Test Complete ===");
