function rollDice(sides = 6) {
    return Math.floor(Math.random() * sides) + 1;
}

function parseAndRollDice(input) {
    if (/^\d+$/.test(input)) {
        return parseInt(input);
    }

    const match = input.match(/(\d+)d(\d+)([+-]\d+)?/i);
    if (!match) {
        return null;
    }
    const [_, count, sides, modifier] = match;
    const baseRoll = Array.from({ length: parseInt(count) }, () =>
        rollDice(parseInt(sides))
    ).reduce((total, num) => total + num, 0);

    return baseRoll + (modifier ? parseInt(modifier) : 0);
}

function rollWounds(hits, weapon, defender) {
    const strength = weapon["strength"];
    const toughness = defender["toughness"];
    let keywords = weapon["Keywords"];
    let toWound = 0;
    if (strength >= 2 * toughness) {
        toWound = 2;
    } else if (strength > toughness) {
        toWound = 3;
    } else if (strength === toughness) {
        toWound = 4;
    } else if (strength * 2 <= toughness) {
        toWound = 6;
    } else if (strength < toughness) {
        toWound = 5;
    }

    if (keywords.includes("+1 wound") || keywords.includes("lance")) {
        toWound -= 1;
    }

    let wounds = 0;
    let damage = 0;
    let rolls = [];

    for (let i = 0; i < hits; i++) {
        rolls.push(rollDice());
    }

    if (keywords.includes("WRMiss")) {
        rolls = rolls.filter((roll) => roll >= toWound).concat(
            rolls.filter((roll) => roll < toWound).map(() => rollDice())
        );
    } else if (keywords.includes("WR1")) {
        rolls = rolls.filter((roll) => roll !== 1).concat(
            rolls.filter((roll) => roll === 1).map(() => rollDice())
        );
    } else if (keywords.includes("WRCrit")) {
        rolls = rolls.filter((roll) => roll === 6).concat(
            rolls.filter((roll) => roll !== 6).map(() => rollDice())
        );
    }

    for (const roll of rolls) {
        if (roll >= toWound) {
            wounds++;
        }
        if (roll === 6) {
            if (keywords.includes("devastating wounds")) {
                wounds--;
                damage++;
            }
        }

    }
    return { wounds, damage };
}

function rollHits(weapon, defender) {
    let hits = 0;
    let wounds = 0;
    let attacks = weapon["attacks"];

    attacks = parseD(attacks);
    attacks = attacks * weapon["amount"];

    //attacks = attacks.toString();
    let toHit = weapon["to_hit"];
    let keywords = weapon["Keywords"];

    if (keywords.includes("+1 hit")) {
        toHit -= 1;
    }

    if (keywords.includes("blast")) {
        attacks = parseInt(attacks) + Math.floor(defender['models'] / 5);
    }

    let rolls = [];
    for (let i = 0; i < attacks; i++) {
        rolls.push(rollDice());
    }

    if (keywords.includes("HRMiss")) {
        rolls = rolls.filter((roll) => roll >= toHit).concat(
            rolls.filter((roll) => roll < toHit).map(() => rollDice())
        );
    } else if (keywords.includes("HR1")) {
        rolls = rolls.filter((roll) => roll !== 1).concat(
            rolls.filter((roll) => roll === 1).map(() => rollDice())
        );
    } else if (keywords.includes("HRCrit")) {
        rolls = rolls.filter((roll) => roll === 6).concat(
            rolls.filter((roll) => roll !== 6).map(() => rollDice())
        );
    }

    const sustainedHitsMatch = keywords
        .find((keyword) => keyword.startsWith("sustained hits"))
        ?.match(/sustained hits (\d+|D\d+)/);

    let sustainedAmount = 0;
    if (sustainedHitsMatch) {
        const value = sustainedHitsMatch[1];
        sustainedAmount = parseD(value);
    }

    for (const roll of rolls) {
        if (roll >= toHit) {
            hits++;
        }
        if (roll === 6) {
            if (keywords.includes("lethal hits")) {
                hits--;
                wounds++;
            }
            if (sustainedHitsMatch) {
                hits += parseInt(sustainedAmount);
            }
        }
    }

    return { hits, wounds };
}

function savingThrow(wounds, weapon, defender) {
    let save = defender["save"];
    let invulnerableSave = defender["invulnerable"];
    let keywordsWeapon = weapon["Keywords"];
    let keywordsDefender = defender["Keywords"];
    let ap = weapon["ap"];

    if (keywordsWeapon.includes("-1 ap")) {
        ap -= 1;
    }

    if (keywordsWeapon.includes("+1 ap / infantry")) {
        if (defender["type"] === "infantry") {
            ap += 1;
        }
    }

    if (keywordsDefender.includes("cover")) {
        let tempAp = ap - 1;
        if (save - tempAp >= 3) {
            ap = tempAp;
        }
    }

    if (keywordsWeapon.includes("-1 save")) {
        save -= 1;
    }

    if (keywordsDefender.includes("+1 save")) {
        save += 1;
    }

    save = save + ap;
    if (save > invulnerableSave) {
        save = invulnerableSave;
    }

    let failedSaves = 0;
    let rolls = [];
    for (let i = 0; i < wounds; i++) {
        rolls.push(rollDice());
    }
    for (const roll of rolls) {
        if (roll < save) {
            failedSaves++;
        }
    }
    return failedSaves;
}

function parseD(value) {
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
                result += rollDice(sides);
            }
            result += bonus;
        } 
    } else {
        result = value;
    }
    return result;
}

function damage(weapon, defender) {
    let keywordsWeapon = weapon["Keywords"];
    let keywordsDefender = defender["Keywords"];
    let weaponDamage = weapon["damage"];

    weaponDamage = parseD(weaponDamage);

    if (keywordsWeapon.includes("+1 damage")) {
        weaponDamage += 1;
    }
    if (keywordsDefender.includes("-1 damage")) {
        weaponDamage -= 1;
    }

    return weaponDamage;
}

function start(jsonData) {
    if (jsonData == null) {
        jsonData = { "json": "data" };
    }

    let amount = jsonData["amount"] ?? 100;

    let jsonResult = {}

    let attackers = jsonData["Attackers"];
    let defenders = jsonData["Defenders"];

    for (const attackerIndex in attackers) {
        const attacker = attackers[attackerIndex];
        let attackerJsonResult = {}
        for (const defenderIndex in defenders) {
            let kills = 0;
            const defender = defenders[defenderIndex];
            let defenderJsonResult = {
                "Kills": 0,
                "OutOf": defender["models"]
            }
            let overallDamage = [];
            for (const weaponKey in attacker["weapons"]) {
                let totalHits = 0;
                let totalWounds = 0;
                let totalFailedSaves = 0;
                let totalDamage = 0;
                const maxWounds = defender["wounds"];
                let tmpDamage = 0;
                let tmpWounds = 0;
                for (let i = 0; i < amount; i++) {
                    const weapon = attacker["weapons"][weaponKey];
                    const hitResult = rollHits(weapon, defender);
                    totalHits += hitResult.hits;
                    const woundResult = rollWounds(hitResult.hits, weapon, defender);
                    totalWounds += (woundResult.wounds + hitResult.wounds);
                    const failedSaves = savingThrow((woundResult.wounds + hitResult.wounds), weapon, defender);
                    totalFailedSaves += failedSaves;
                    const damageResult = damage(weapon, defender);
                    for (let woundingAttack in (woundResult.wounds + hitResult.damage)) {
                        tmpDamage += tmpWounds;
                        tmpWounds = 0;
                        tmpDamage += damageResult;
                        if (tmpDamage >= maxWounds) {
                            kills++;
                            tmpDamage = 0;
                        }
                    }
                    tmpWounds = tmpDamage;
                    totalDamage += damageResult;
                }

                defenderJsonResult[weaponKey] = {
                    "Hits": totalHits / amount,
                    "Wounds": totalWounds / amount,
                    "FailedSaves": totalFailedSaves / amount,
                    "Damage": totalDamage / amount
                };
                overallDamage.push(totalDamage / amount);
            }
            defenderJsonResult['Kills'] = kills;
            attackerJsonResult[defender["name"]] = defenderJsonResult;
        }

        jsonResult[attacker['name']] = attackerJsonResult;
    }

    return jsonResult;
}

export default start;
