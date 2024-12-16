import test from 'ava';
import { Dice } from '../dice.js';

test('Dice roll', (t) => {
    const dice = new Dice();
    const roll = dice.roll();
    t.log(`Dice for single D6: ${roll}`);
    t.true(roll >= 1 && roll <= 6);
});

test('Dice parseAndRoll 2D6', (t) => {
    const dice = new Dice();
    const roll = dice.parseAndRoll('2D6');
    t.log(`Dice for 2D6: ${roll}`);
    t.true(roll >= 2 && roll <= 12);
});

test('Dice parseAndRoll 2D6+3', (t) => {
    const dice = new Dice();
    const roll = dice.parseAndRoll('2D6+3');
    t.log(`Dice for 2D6+3: ${roll}`);
    t.true(roll >= 5 && roll <= 15);
});

test('Dice parseAndRoll D3', (t) => {
    const dice = new Dice();
    const roll = dice.parseAndRoll('D3');
    t.log(`Dice for D3: ${roll}`);
    t.true(roll >= 1 && roll <= 3);
});