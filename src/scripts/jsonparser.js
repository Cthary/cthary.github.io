import { Attacker, Defender } from './units.js';

export class JsonParser {

    constructor(json) {
        this.json = json;
    }

    getAttacker(index) {
        let attacker = new Attacker(this.json["Attackers"][index]);
        return attacker;
    }

    getDefenders() {
        let defenders = [];
        for (let defender of this.json["Defenders"]) {
            defenders.push(new Defender(defender));
        }
        return defenders;
    }
}
