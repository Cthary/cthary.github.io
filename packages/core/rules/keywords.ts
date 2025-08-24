// Standard-Keywords für Warhammer 40k 10th Edition
// Siehe README_full.md und GW-Referenz

export type KeywordParam = number | string | undefined;

export interface KeywordDef {
  name: string;
  type: 'weapon' | 'ability';
  params?: string[];
  description: string;
}

export const STANDARD_KEYWORDS: KeywordDef[] = [
  {
    name: 'Assault',
    type: 'weapon',
    description: 'Kann nach Advancen schießen.'
  },
  {
    name: 'Heavy',
    type: 'weapon',
    description: '+1 to Hit wenn nicht bewegt.'
  },
  {
    name: 'Pistol',
    type: 'weapon',
    description: 'Kann im Nahkampf schießen.'
  },
  {
    name: 'Rapid Fire',
    type: 'weapon',
    params: ['X'],
    description: 'Doppelte Schusszahl auf halber Reichweite.'
  },
  {
    name: 'Twin-linked',
    type: 'weapon',
    description: 'Reroll Wound rolls.'
  },
  {
    name: 'Torrent',
    type: 'weapon',
    description: 'Automatisch Treffer.'
  },
  {
    name: 'Blast',
    type: 'weapon',
    description: '+1 Attacke pro 5 Modelle im Ziel.'
  },
  {
    name: 'Devastating Wounds',
    type: 'weapon',
    description: 'Crits verursachen Mortal Wounds.'
  },
  {
    name: 'Lethal Hits',
    type: 'weapon',
    description: 'Crits verwunden automatisch.'
  },
  {
    name: 'Sustained Hits',
    type: 'weapon',
    params: ['X'],
    description: 'Crits erzeugen X zusätzliche Treffer.'
  },
  {
    name: 'Precision',
    type: 'weapon',
    description: 'Kann Charaktere gezielt attackieren.'
  },
  {
    name: 'Anti',
    type: 'weapon',
    params: ['X', 'Y'],
    description: 'Wound-Crit gegen X auf Y+.'
  },
  {
    name: 'Ignores Cover',
    type: 'weapon',
    description: 'Ziel erhält keinen Bonus durch Cover.'
  },
  {
    name: 'Hazardous',
    type: 'weapon',
    description: '1 auf Hazardous-Wurf = Modell tot.'
  },
  {
    name: 'Lance',
    type: 'weapon',
    description: '+2 AP bei Charge.'
  },
  {
    name: 'Melta',
    type: 'weapon',
    params: ['X'],
    description: 'Extra Damage auf kurze Distanz.'
  },
  {
    name: 'Extra Attacks',
    type: 'weapon',
    description: 'Zusätzliche Attacken.'
  },
  {
    name: 'Indirect Fire',
    type: 'weapon',
    description: 'Kann ohne Sichtlinie schießen.'
  },
  {
    name: 'Deadly Demise',
    type: 'ability',
    description: 'Explodiert beim Sterben.'
  },
  {
    name: 'FNP',
    type: 'ability',
    params: ['X+'],
    description: 'Feel No Pain gegen Schaden.'
  },
  {
    name: 'Stealth',
    type: 'ability',
    description: '-1 to Hit.'
  },
  {
    name: 'Scout',
    type: 'ability',
    params: ['X'],
    description: 'Vorrücken vor Spielbeginn.'
  },
  {
    name: 'Deep Strike',
    type: 'ability',
    description: 'Kann aus Reserve kommen.'
  },
  {
    name: 'Leader',
    type: 'ability',
    description: 'Kann sich Einheiten anschließen.'
  },
  {
    name: 'Lone Operative',
    type: 'ability',
    description: 'Kann nicht beschossen werden, wenn nah an Feind.'
  },
];
