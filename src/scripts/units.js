import { Dice } from "./dice.js";

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
        this.processDefenderKeywords();
    }

    processDefenderKeywords() {
        // Helper function für case-insensitive keyword checks
        const hasKeyword = (keyword) => this.Keywords.some(k => k.toLowerCase() === keyword.toLowerCase());

        // Process damage reduction keywords (case-insensitive)
        if (hasKeyword("/2D")) {
            this.Keywords.push("halve damage");
        }

        if (hasKeyword("-1D")) {
            this.Keywords.push("-1 dmg");
        }

        // Process feel no pain keywords (case-insensitive)
        this.feelNoPainValue = null;
        this.feelNoPainPsychicValue = null;

        for (const keyword of this.Keywords) {
            const fnpMatch = keyword.match(/^feel no pain (\d+)$/i);
            if (fnpMatch) {
                this.feelNoPainValue = parseInt(fnpMatch[1]);
                continue;
            }

            // Feel No Pain Psychic
            const fnpPsychicMatch = keyword.match(/^feel no pain psychic (\d+)$/i);
            if (fnpPsychicMatch) {
                this.feelNoPainPsychicValue = parseInt(fnpPsychicMatch[1]);
                continue;
            }
        }

        // Cover keyword (case-insensitive)
        if (this.Keywords.some(k => k.toLowerCase() === "cover")) {
            // Cover ist bereits im Keywords Array, keine weitere Verarbeitung nötig
        }
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
        // Gib nur die Attacken zurück, ohne amount zu multiplizieren
        // amount wird bereits in der Simulation-Logik berücksichtigt
        return dice.parseAndRoll(this.attacks);
    }

    getDamage() {
        const dice = new Dice();
        return dice.parseAndRoll(this.damage);
    }

    calculateKeywords() {
        // Normalisiere alle Keywords zu lowercase für case-insensitive Vergleiche
        const normalizedKeywords = this.Keywords.map(k => k.toLowerCase());

        // Helper function für case-insensitive keyword checks
        const hasKeyword = (keyword) => normalizedKeywords.includes(keyword.toLowerCase());

        // Hit Modifier (case-insensitive)
        if (hasKeyword("+1 hit") || hasKeyword("+1 to hit")) {
            this.to_hit -= 1;
        }

        if (hasKeyword("-1 hit") || hasKeyword("-1 to hit")) {
            this.to_hit += 1;
        }

        // Wound Modifier - werden in der Wound-Phase angewendet (case-insensitive)
        if (hasKeyword("+1 wound") || hasKeyword("+1 to wound")) {
            this.Keywords.push("WoundBonus+1");
        }

        if (hasKeyword("-1 wound") || hasKeyword("-1 to wound")) {
            this.Keywords.push("WoundPenalty-1");
        }

        // Blood Angels Charge (case-insensitive)
        if (hasKeyword("ba charge")) {
            if (this.type === "Melee" || this.type === "M") {
                this.attacks = this.addToValue(this.attacks, 1);
                this.strength += 2;
            }
        }

        // Sustained Hits - Dynamische Parsing (case-insensitive)
        for (const keyword of this.Keywords) {
            if (keyword.toLowerCase().startsWith("sustained hits")) {
                const match = keyword.match(/sustained hits\s+(\d+|D\d+(?:\+\d+)?)/i);
                if (match) {
                    this.sustainedHits = match[1];
                }
            }
        }

        // Standard Keywords (case-insensitive) - removed old boolean properties
        // this.lethalHits = hasKeyword("lethal hits");
        // this.devastatingWounds = hasKeyword("devastating wounds");
        this.betterCrits = hasKeyword("better crits");

        // Twin-linked (case-insensitive)
        if (hasKeyword("twin-linked")) {
            this.Keywords.push("RWMiss");
        }

        // Rapid Fire - Dynamische Parsing (case-insensitive)
        for (const keyword of this.Keywords) {
            if (keyword.toLowerCase().startsWith("rapid fire")) {
                const match = keyword.match(/rapid fire\s+(\d+)/i);
                if (match) {
                    const bonusAttacks = parseInt(match[1]);
                    // Bei kurzer Reichweite würde dies +X Attacks geben
                    // Für Simulation nehmen wir an, dass immer in kurzer Reichweite geschossen wird
                    this.attacks = this.addToValue(this.attacks, bonusAttacks);
                }
            }
        }

        // Melta - Dynamische Parsing (case-insensitive)
        for (const keyword of this.Keywords) {
            if (keyword.toLowerCase().startsWith("melta")) {
                const match = keyword.match(/melta\s+(\d+)/i);
                if (match) {
                    const bonusDamage = parseInt(match[1]);
                    // Bei kurzer Reichweite würde dies +X Damage geben
                    // Für Simulation nehmen wir an, dass immer in kurzer Reichweite geschossen wird
                    this.damage = this.addToValue(this.damage, bonusDamage);
                }
            }
        }

        // Lance (Charge Bonus) (case-insensitive)
        if (hasKeyword("lance") && (this.type === "Melee" || this.type === "M")) {
            this.Keywords.push("+1 wound");
            this.ap += 1;
        }

        // Anti-X Keywords - Dynamische Parsing (case-insensitive, mit und ohne +)
        // Anti-X sollte Critical Wounds bei X+ verursachen, nicht Critical Hits
        for (const keyword of this.Keywords) {
            if (keyword.toLowerCase().startsWith("anti-")) {
                // Versuche zuerst das Standard-Pattern mit +
                let match = keyword.match(/anti-(\w+)\s+(\d+)\+/i);
                if (!match) {
                    // Falls kein + vorhanden, versuche ohne +
                    match = keyword.match(/anti-(\w+)\s+(\d+)/i);
                }
                if (match) {
                    const targetType = match[1].toLowerCase();
                    const threshold = parseInt(match[2]);
                    this.Keywords.push(`CritWound${threshold}`);
                    this.Keywords.push(`Anti-${targetType}`);
                }
            }
        }

        // Blast - +1 Attack pro 5 Modelle (case-insensitive)
        if (hasKeyword("blast")) {
            this.Keywords.push("blast-effect");
            // Blast wird in der Hit-Phase angewendet - +1 Attack pro 5 Modelle im Ziel
        }

        // Hazardous (case-insensitive)
        if (hasKeyword("hazardous")) {
            this.Keywords.push("hazardous-effect");
            // Hazardous wird in der Hit-Phase angewendet - bei 1er Würfen = 1 Mortal Wound
        }

        // Torrent (case-insensitive)
        if (hasKeyword("torrent")) {
            this.Keywords.push("torrent-effect");
            // Torrent: Automatische Hits, keine Hit-Würfe erforderlich
        }

        // Ignores Cover (case-insensitive)
        if (hasKeyword("ignores cover")) {
            this.Keywords.push("ignores-cover-effect");
            // Ignores Cover: Ziele erhalten keinen Cover-Save Bonus
        }

        // Indirect Fire (case-insensitive)
        if (hasKeyword("indirect fire")) {
            this.Keywords.push("indirect-fire-effect");
            // Indirect Fire: -1 to hit, maximal 4+ to hit
        }

        // Psychic - nur mit Feel No Pain Psychic relevant (case-insensitive)
        if (hasKeyword("psychic")) {
            this.Keywords.push("psychic-effect");
            // Psychic: Kann durch Deny the Witch gestoppt werden
        }

        // Damage Reduction Keywords (case-insensitive)
        if (hasKeyword("-1d")) {
            this.Keywords.push("-1 dmg");
        }

        if (hasKeyword("/2d")) {
            this.Keywords.push("halve damage");
        }

        // Damage Increase Keywords (case-insensitive)
        if (hasKeyword("+1d")) {
            this.Keywords.push("+1 dmg");
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
