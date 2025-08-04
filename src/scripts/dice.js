export class Dice {
    constructor() {
    }

    roll(sides = 6) {
        return Math.floor(Math.random() * sides) + 1;
    }

    parseAndRoll(value) {
        if (!value) {
            return 0;
        }

        if (typeof value === "number") {
            return value;
        }

        if (typeof value === "string") {
            // Handle simple numbers
            if (/^\d+$/.test(value)) {
                return parseInt(value);
            }

            // Handle dice expressions like "D6", "2D6", "D3+1", "2D6+3", "D6-1", etc.
            const dicePattern = /^(\d*)[Dd](\d+)(?:([+-])(\d+))?$/;
            const match = value.match(dicePattern);

            if (match) {
                const numDice = parseInt(match[1]) || 1;
                const sides = parseInt(match[2]);
                const operator = match[3];
                const modifier = parseInt(match[4]) || 0;

                let result = 0;
                for (let i = 0; i < numDice; i++) {
                    result += this.roll(sides);
                }

                if (operator === "+") {
                    result += modifier;
                } else if (operator === "-") {
                    result -= modifier;
                }

                return result;
            }

            // Handle complex expressions like "1+1", "2+3", etc.
            const simpleAddPattern = /^(\d+)\+(\d+)$/;
            const addMatch = value.match(simpleAddPattern);
            if (addMatch) {
                return parseInt(addMatch[1]) + parseInt(addMatch[2]);
            }

            const simpleSubPattern = /^(\d+)-(\d+)$/;
            const subMatch = value.match(simpleSubPattern);
            if (subMatch) {
                return parseInt(subMatch[1]) - parseInt(subMatch[2]);
            }

            // If no pattern matches, try to parse as integer
            const num = parseInt(value);
            return isNaN(num) ? 0 : num;
        }

        return 0;
    }
}

