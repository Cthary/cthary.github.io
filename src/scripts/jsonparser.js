import { Attacker, Defender } from "./units.js";

export class JsonParser {

    constructor(json) {
        this.json = json;
    }

    getAttacker(index) {
        const attacker = new Attacker(this.json["Attackers"][index]);
        return attacker;
    }

    getDefenders() {
        const defenders = [];
        for (const defender of this.json["Defenders"]) {
            defenders.push(new Defender(defender));
        }
        return defenders;
    }
}
