import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function parseDice(value) {
  const match = value.match(/^(\d*)[dD](\d+)([+-]\d+)?$/);
  if (!match) return parseInt(value);
  const count = match[1] ? parseInt(match[1]) : 1;
  const sides = parseInt(match[2]);
  const modifier = match[3] ? parseInt(match[3]) : 0;
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  return total + modifier;
}

export default function WarhammerSimulator() {
  const [attacker, setAttacker] = useState({
    name: "",
    weapons: [
      {
        name: "",
        toHit: 3,
        shots: "1",
        strength: 4,
        ap: 0,
        damage: "1",
        keywords: [],
      },
    ],
  });

  const [defender, setDefender] = useState({
    name: "",
    models: 5,
    wounds_per_model: 1,
    save: 3,
    invuln: 0,
    toughness: 4,
    keywords: [],
  });

  const [result, setResult] = useState(null);

  const simulate = () => {
    const weaponResults = attacker.weapons.map((weapon) => {
      let totalDamage = 0;
      let shots = parseDice(weapon.shots);
      let hits = 0;
      for (let i = 0; i < shots; i++) {
        const roll = Math.ceil(Math.random() * 6);
        if (roll >= weapon.toHit) hits++;
      }
      const sustainedKeyword = weapon.keywords.find(k => k.startsWith("Sustained Hits"));
      if (sustainedKeyword) {
        const sustainedValue = sustainedKeyword.replace("Sustained Hits ", "").trim();
        const bonusHitsPerTrigger = parseDice(sustainedValue); // kann auch D3, D6+1 usw. sein
        const sixes = Array.from({ length: shots }, () => Math.ceil(Math.random() * 6))
                          .filter(roll => roll === 6).length;
        hits += sixes * bonusHitsPerTrigger;
      }
      let wounds = hits;
      if (weapon.strength >= defender.toughness * 2) wounds *= 0.83;
      else if (weapon.strength > defender.toughness) wounds *= 0.66;
      else if (weapon.strength === defender.toughness) wounds *= 0.5;
      else if (weapon.strength * 2 <= defender.toughness) wounds *= 0.16;
      else wounds *= 0.33;

      let failedSaves = wounds;
      const save = defender.invuln > 0 ? Math.min(defender.invuln, defender.save) : defender.save;
      failedSaves *= (1 - (7 - save) / 6);

      let damage = failedSaves * parseDice(weapon.damage);

      // Defender Keyword: -1 Damage
      if (defender.keywords.includes("-1 Damage")) {
        damage = Math.max(0, damage - failedSaves); // -1 Schaden pro Treffer
      }

      // Defender Keyword: Halber Damage
      if (defender.keywords.includes("Halber Damage")) {
        damage = damage / 2;
      }

      // Defender Keyword: Feel No Pain X+
      const fnpKeyword = defender.keywords.find(k => k.startsWith("Feel No Pain"));
      if (fnpKeyword) {
        const fnpRoll = parseInt(fnpKeyword.replace("Feel No Pain ", "").replace("+", ""));
        let unsavedWounds = Math.round(damage);
        let saved = 0;
        for (let i = 0; i < unsavedWounds; i++) {
          const roll = Math.ceil(Math.random() * 6);
          if (roll >= fnpRoll) saved++;
        }
        damage -= saved;
      }

      totalDamage += damage;

      const modelsKilled = Math.min(defender.models, Math.floor(totalDamage / defender.wounds_per_model));

      return {
        name: weapon.name,
        damage: Math.round(totalDamage * 100) / 100,
        kills: modelsKilled,
      };
    });

    setResult(weaponResults);
  };

  const updateWeapon = (index, field, value) => {
    const updatedWeapons = [...attacker.weapons];
    updatedWeapons[index][field] = field === "keywords"
      ? value.split(",")
      : ["strength", "ap", "toHit"].includes(field)
        ? parseInt(value)
        : value;
    setAttacker({ ...attacker, weapons: updatedWeapons });
  };

  const addWeapon = () => {
    setAttacker({
      ...attacker,
      weapons: [
        ...attacker.weapons,
        {
          name: "",
          toHit: 3,
          shots: "1",
          strength: 4,
          ap: 0,
          damage: "1",
          keywords: [],
        },
      ],
    });
  };

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardContent className="space-y-2">
          <h2 className="text-xl font-bold">Angreifer</h2>
          <Label>Name</Label>
          <Input value={attacker.name} onChange={(e) => setAttacker({ ...attacker, name: e.target.value })} />
          <h3 className="font-semibold">Waffen</h3>
          {attacker.weapons.map((weapon, i) => (
            <div key={i} className="border rounded p-2 space-y-1">
              <Label>Waffenname</Label>
              <Input placeholder="Name" value={weapon.name} onChange={(e) => updateWeapon(i, "name", e.target.value)} />
              <Label>Trefferwurf (z.B. 3 für 3+)</Label>
              <Input type="number" placeholder="To Hit" value={weapon.toHit} onChange={(e) => updateWeapon(i, "toHit", e.target.value)} />
              <Label>Schuss (z.B. 6, D6, D3+3)</Label>
              <Input placeholder="Schuss" value={weapon.shots} onChange={(e) => updateWeapon(i, "shots", e.target.value)} />
              <Label>Stärke</Label>
              <Input type="number" placeholder="Stärke" value={weapon.strength} onChange={(e) => updateWeapon(i, "strength", e.target.value)} />
              <Label>AP</Label>
              <Input type="number" placeholder="AP" value={weapon.ap} onChange={(e) => updateWeapon(i, "ap", e.target.value)} />
              <Label>Schaden (z.B. 1, D3, D6+2)</Label>
              <Input placeholder="Schaden" value={weapon.damage} onChange={(e) => updateWeapon(i, "damage", e.target.value)} />
              <Label>Keywords (z.B. Sustained Hits 1)</Label>
              <Input placeholder="Keywords (comma separated)" value={weapon.keywords.join(",")} onChange={(e) => updateWeapon(i, "keywords", e.target.value)} />
            </div>
          ))}
          <Button className="mt-2" onClick={addWeapon}>+ Waffe hinzufügen</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2">
          <h2 className="text-xl font-bold">Verteidiger</h2>
          <Label>Name</Label>
          <Input value={defender.name} onChange={(e) => setDefender({ ...defender, name: e.target.value })} />
          <Label>Modelle</Label>
          <Input type="number" placeholder="Modelle" value={defender.models} onChange={(e) => setDefender({ ...defender, models: parseInt(e.target.value) })} />
          <Label>Wunden pro Modell</Label>
          <Input type="number" placeholder="Wunden pro Modell" value={defender.wounds_per_model} onChange={(e) => setDefender({ ...defender, wounds_per_model: parseInt(e.target.value) })} />
          <Label>Rüstungswurf</Label>
          <Input type="number" placeholder="Rüstungswurf" value={defender.save} onChange={(e) => setDefender({ ...defender, save: parseInt(e.target.value) })} />
          <Label>Rettungswurf</Label>
          <Input type="number" placeholder="Rettungswurf" value={defender.invuln} onChange={(e) => setDefender({ ...defender, invuln: parseInt(e.target.value) })} />
          <Label>Zähigkeit</Label>
          <Input type="number" placeholder="Zähigkeit" value={defender.toughness} onChange={(e) => setDefender({ ...defender, toughness: parseInt(e.target.value) })} />
        </CardContent>
      </Card>

      <div className="md:col-span-2 flex justify-center">
        <Button onClick={simulate}>Simulation starten</Button>
      </div>

      {result && (
        <div className="md:col-span-2 bg-gray-100 p-4 rounded-xl shadow">
          <h2 className="text-xl font-bold mb-2">Ergebnis</h2>
          {result.map((res, i) => (
            <div key={i} className="mb-2">
              <h3 className="font-semibold">{res.name}</h3>
              <p>Schaden: {res.damage}</p>
              <p>Getötete Modelle: {res.kills}</p>
            </div>
          ))}
        </div>
      )}

      <div className="md:col-span-2 mt-4">
        <h2 className="text-lg font-bold mb-1">📄 JSON Template</h2>
        <Textarea
          className="text-sm bg-gray-50"
          readOnly
          rows={10}
          value={JSON.stringify(
            {
              name: "Space Marine Squad",
              weapons: [
                {
                  name: "Bolter",
                  toHit: 3,
                  shots: "D6",
                  strength: 4,
                  ap: 0,
                  damage: "1",
                  keywords: ["Sustained Hits 1"],
                },
              ],
            },
            null,
            2
          )}
        />
      </div>
    </div>
  );
}
