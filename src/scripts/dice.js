export class Dice {
    constructor() {
    }

    roll(sides = 6) {
        return Math.floor(Math.random() * sides) + 1;
    }

    parseAndRoll(value) {
        let result = 0;
        if (typeof value === "string") {
            if (value.includes("D")) {
                let valueArray = value.split("D");
                let dice = parseInt(valueArray[0]) || 1;
                let sidesAndBonus = valueArray[1];
                let sides, bonus = 0;
                if (sidesAndBonus.includes("+")) {
                    let parts = sidesAndBonus.split("+");
                    sides = parseInt(parts[0]);
                    bonus = parseInt(parts[1]);
                } else {
                    sides = parseInt(sidesAndBonus);
                }
                for (let i = 0; i < dice; i++) {
                    result += this.roll(sides);
                }
                result += bonus;
            } 
        } else {
            result = value;
        }
        return result;
    }
}

