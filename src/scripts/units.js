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
        this.Keywords = json["Keywords"];
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
        this.Keywords = json["Keywords"];
        this.damage = json["damage"];
        this.sustainedHits = false;
        this.calculateKeywords();
    }

    calculateKeywords() {
        if (this.Keywords.includes("+1 hit")) {
            this.to_hit -= 1;
        }
        if (this.Keywords.includes("BA Charge")) {
            if(this.type === "M") {
                this.attacks++;
                this.strength += 2;
            }
        }
        const sustainedHitsMatch = this.Keywords
            .find((keyword) => keyword.startsWith("sustained hits"))
            ?.match(/sustained hits (\d+|D\d+)/);

        let sustainedAmount = 0;
        if (sustainedHitsMatch) {
            this.sustainedHits = sustainedHitsMatch[1];
        }

        this.lethalHits = this.Keywords.includes("lethal hits");
        this.devastatingWounds = this.Keywords.includes("devastating wounds");
        
    }
}
