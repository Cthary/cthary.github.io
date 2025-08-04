import { Dice } from './dice.js';

export class Attacker {

    constructor(json) {
        this.json = json;
        this.Name = json["Name"];
        this.Weapons = json["Weapons"];
    }

    getWeapon(index) {
        return new Weapon(this.json["Weapons"][index]);
    }
}

export class Defender {

    constructor(json) {
        this.Name = json["Name"];
        this.json = json;
        this.kills = 0;
        this.type = json["type"];
        this.toughness = json["toughness"];
        this.wounds = json["wounds"];
        this.models = json["models"];
        this.save = json["save"];
        this.invulnerable = json["invulnerable"];
        this.Keywords = json["Keywords"] || [];
    }
}

export class Weapon {

    constructor(json) {
        this.json = json;
        this.name = json["name"];
        this.type = json["type"];
        this.hitsAll = 0;
        this.woundsAll = 0;
        this.failedSavesAll = 0;
        this.damageAll = 0;
        this.attacks = json["attacks"];
        this.to_hit = json["to_hit"];
        this.strength = json["strength"];
        this.ap = json["ap"];
        this.amount = json["amount"];
        this.Keywords = json["Keywords"] || [];
        this.damage = json["damage"];
        this.sustainedHits = false;
        this.lethalHits = false;
        this.devastatingWounds = false;
        this.betterCrits = false;
        this.calculateKeywords();
    }

    getAttacks() {
        const dice = new Dice();
        return dice.parseAndRoll(this.attacks);
    }

    getDamage() {
        const dice = new Dice();
        return dice.parseAndRoll(this.damage);
    }

    calculateKeywords() {
        // Hit Modifier
        if (this.Keywords.includes("+1 hit")) {
            this.to_hit -= 1;
        }

        // Blood Angels Charge
        if (this.Keywords.includes("BA Charge")) {
            if (this.type === "Melee" || this.type === "M") {
                this.attacks = this.addToValue(this.attacks, 1);
                this.strength += 2;
            }
        }

        // Sustained Hits - Dynamische Parsing
        for (const keyword of this.Keywords) {
            if (keyword.startsWith("sustained hits")) {
                const match = keyword.match(/sustained hits\s+(\d+|D\d+(?:\+\d+)?)/i);
                if (match) {
                    this.sustainedHits = match[1];
                }
            }
        }

        // Standard Keywords
        this.lethalHits = this.Keywords.includes("lethal hits");
        this.devastatingWounds = this.Keywords.includes("devastating wounds");
        this.betterCrits = this.Keywords.includes("better crits");

        // Twin-linked
        if (this.Keywords.includes("twin-linked")) {
            this.Keywords.push("RWMiss");
        }

        // Rapid Fire - Dynamische Parsing
        for (const keyword of this.Keywords) {
            if (keyword.startsWith("rapid fire")) {
                const match = keyword.match(/rapid fire\s+(\d+)/i);
                if (match) {
                    const bonusAttacks = parseInt(match[1]);
                    // Bei kurzer Reichweite würde dies +X Attacks geben
                    // Für Simulation nehmen wir an, dass immer in kurzer Reichweite geschossen wird
                    this.attacks = this.addToValue(this.attacks, bonusAttacks);
                }
            }
        }

        // Melta - Dynamische Parsing
        for (const keyword of this.Keywords) {
            if (keyword.startsWith("melta")) {
                const match = keyword.match(/melta\s+(\d+)/i);
                if (match) {
                    const bonusDamage = parseInt(match[1]);
                    // Bei kurzer Reichweite würde dies +X Damage geben
                    // Für Simulation nehmen wir an, dass immer in kurzer Reichweite geschossen wird
                    this.damage = this.addToValue(this.damage, bonusDamage);
                }
            }
        }

        // Lance (Charge Bonus)
        if (this.Keywords.includes("lance") && (this.type === "Melee" || this.type === "M")) {
            this.Keywords.push("+1 wound");
            this.ap += 1;
        }

        // Anti-X Keywords - Dynamische Parsing
        for (const keyword of this.Keywords) {
            if (keyword.startsWith("anti-")) {
                const match = keyword.match(/anti-(\w+)\s+(\d+)\+/i);
                if (match) {
                    const threshold = parseInt(match[2]);
                    this.Keywords.push(`CritHit${threshold}`);
                }
            }
        }

        // Blast - Maximum Attacks gegen große Units
        if (this.Keywords.includes("blast")) {
            // Würde gegen Units mit 6+ Modellen Maximum Attacks geben
            // Dies würde in der Simulation berücksichtigt werden müssen
        }

        // Hazardous
        if (this.Keywords.includes("hazardous")) {
            // Bei Critical Fails: 1 Mortal Wound (würde in hit phase implementiert)
        }

        // Precision
        if (this.Keywords.includes("precision")) {
            // Critical hits können Charaktere zuweisen (UI Feature)
        }

        // Damage Reduction Keywords
        if (this.Keywords.includes("-1D")) {
            this.Keywords.push("-1 dmg");
        }
        
        if (this.Keywords.includes("/2D")) {
            this.Keywords.push("halve damage");
        }
    }

    addToValue(value, addition) {
        if (typeof value === "string") {
            if (value.includes("+")) {
                const parts = value.split("+");
                const bonus = parseInt(parts[1]) + addition;
                return parts[0] + "+" + bonus;
            } else if (value.includes("D")) {
                return value + "+" + addition;
            } else {
                const num = parseInt(value) + addition;
                return num.toString();
            }
        } else {
            return value + addition;
        }
    }
}
