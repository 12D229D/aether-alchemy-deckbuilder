// Catálogo de Enemigos con Intent System (Ataque, Bloqueo, Debuff, Carga, Especial)

export const INTENT_TYPES = {
  ATTACK: 'attack',
  DEFEND: 'defend',
  BUFF: 'buff',
  DEBUFF: 'debuff',
  SPECIAL: 'special'
};

export const ENEMY_DEFINITIONS = [
  // Enemigos de Piso Normal
  {
    id: 'homunculus_slag',
    name: 'Homúnculo de Escoria',
    type: 'normal',
    maxHp: 38,
    avatar: '🧪',
    color: '#8b5cf6',
    description: 'Una masa deforme de reactivos alquímicos descartados que busca calor vital.',
    pattern: [
      { type: INTENT_TYPES.ATTACK, value: 7, desc: 'Ataque de Escoria: 7 de daño' },
      { type: INTENT_TYPES.DEFEND, value: 6, desc: 'Endurecer Cáscara: 6 de Bloqueo' },
      { type: INTENT_TYPES.ATTACK, value: 9, debuff: { burn: 2 }, desc: 'Vapor Ígneo: 9 de daño y 2 Quemadura' }
    ]
  },
  {
    id: 'corrupted_gargoyle',
    name: 'Gárgola de Azufre',
    type: 'normal',
    maxHp: 44,
    avatar: '🗿',
    color: '#eab308',
    description: 'Estatua animada por vapores de azufre densos y corrosivos.',
    pattern: [
      { type: INTENT_TYPES.DEFEND, value: 10, desc: 'Piel Pétrea: 10 de Bloqueo' },
      { type: INTENT_TYPES.ATTACK, value: 8, debuff: { vulnerable: 1 }, desc: 'Picotazo Corrosivo: 8 de daño y 1 Vulnerable' },
      { type: INTENT_TYPES.ATTACK, value: 11, desc: 'Impacto Rocoso: 11 de daño' }
    ]
  },
  {
    id: 'aether_wraith',
    name: 'Espectro del Éter',
    type: 'normal',
    maxHp: 35,
    avatar: '👻',
    color: '#06b6d4',
    description: 'Residuo fantasmal atrapado en las fracturas de la corriente astral.',
    pattern: [
      { type: INTENT_TYPES.ATTACK, value: 6, debuff: { weak: 2 }, desc: 'Lamento Hipnótico: 6 de daño y 2 Débil' },
      { type: INTENT_TYPES.ATTACK, value: 12, desc: 'Descarga Astral: 12 de daño' },
      { type: INTENT_TYPES.BUFF, value: 3, buff: { strength: 2 }, desc: 'Condensar Maná: +2 Fuerza' }
    ]
  },
  // Enemigos Élite
  {
    id: 'chimera_alchemical',
    name: 'Quimera Alquímica',
    type: 'elite',
    maxHp: 75,
    avatar: '🦁',
    color: '#f97316',
    description: 'Fusión monstruosa de león, serpiente y fuego primordial guiada por rabia pura.',
    pattern: [
      { type: INTENT_TYPES.ATTACK, value: 14, desc: 'Mordedura Ígnea: 14 de daño' },
      { type: INTENT_TYPES.DEFEND, value: 12, buff: { thorns: 3 }, desc: 'Espinas Alquímicas: 12 Bloqueo y +3 Espinas' },
      { type: INTENT_TYPES.ATTACK, value: 18, debuff: { burn: 4 }, desc: 'Aliento de Fuego Líquido: 18 de daño y 4 Quemadura' },
      { type: INTENT_TYPES.BUFF, value: 4, buff: { strength: 3 }, desc: 'Rugido Primordial: +3 Fuerza' }
    ]
  },
  {
    id: 'void_inquisitor',
    name: 'Inquisidor del Vacío',
    type: 'elite',
    maxHp: 80,
    avatar: '👁️',
    color: '#a855f7',
    description: 'Cultista herético que canaliza la nulidad cósmica para devorar la magia.',
    pattern: [
      { type: INTENT_TYPES.DEBUFF, value: 0, debuff: { vulnerable: 2, weak: 2 }, desc: 'Anulación de Sentidos: 2 Vulnerable y 2 Débil' },
      { type: INTENT_TYPES.ATTACK, value: 16, desc: 'Lanza del Abismo: 16 de daño' },
      { type: INTENT_TYPES.DEFEND, value: 15, desc: 'Manto Estelar: 15 de Bloqueo' },
      { type: INTENT_TYPES.ATTACK, value: 22, desc: 'Ruptura Cósmica: 22 de daño masivo' }
    ]
  },
  // Jefe de Piso / Boss
  {
    id: 'archmagus_athanor',
    name: 'Archimago del Atanor Eterno',
    type: 'boss',
    maxHp: 130,
    avatar: '🧙‍♂️',
    color: '#ef4444',
    description: 'El maestro alquimista que trascendió la mortalidad fundiendo su alma con la Piedra Filosofal.',
    pattern: [
      { type: INTENT_TYPES.DEFEND, value: 18, buff: { strength: 2 }, desc: 'Barrera Trismegista: 18 de Bloqueo y +2 Fuerza' },
      { type: INTENT_TYPES.ATTACK, value: 15, debuff: { burn: 3, vulnerable: 1 }, desc: 'Ignición Hermética: 15 de daño, 3 Quemadura y 1 Vulnerable' },
      { type: INTENT_TYPES.ATTACK, value: 24, desc: 'Transmutación Vital: 24 de daño' },
      { type: INTENT_TYPES.SPECIAL, value: 10, heal: 15, buff: { strength: 3 }, desc: 'Rejuvenecimiento Alquímico: Cura 15 HP y gana +3 Fuerza' }
    ]
  }
];

export class EnemyInstance {
  constructor(definition, floorLevel = 1) {
    this.id = definition.id;
    this.name = definition.name;
    this.type = definition.type;
    this.avatar = definition.avatar;
    this.color = definition.color;
    this.description = definition.description;
    
    // Escalar estadísticas según el piso
    const scaleFactor = 1 + (floorLevel - 1) * 0.15;
    this.maxHp = Math.round(definition.maxHp * scaleFactor);
    this.hp = this.maxHp;
    this.block = 0;
    
    this.pattern = definition.pattern;
    this.currentPatternIndex = 0;
    
    // Estados alterados
    this.buffs = {
      strength: 0,
      thorns: 0
    };
    this.debuffs = {
      vulnerable: 0, // Recibe 50% más de daño
      weak: 0,       // Inflige 25% menos de daño
      burn: 0        // Sufre daño al inicio del turno
    };
  }

  getCurrentIntent() {
    return this.pattern[this.currentPatternIndex];
  }

  advanceTurn() {
    this.currentPatternIndex = (this.currentPatternIndex + 1) % this.pattern.length;
  }

  takeDamage(amount) {
    let finalDamage = amount;
    if (this.debuffs.vulnerable > 0) {
      finalDamage = Math.round(finalDamage * 1.5);
    }

    let unblockedDamage = 0;
    if (this.block >= finalDamage) {
      this.block -= finalDamage;
    } else {
      unblockedDamage = finalDamage - this.block;
      this.block = 0;
      this.hp = Math.max(0, this.hp - unblockedDamage);
    }

    return {
      damageDealt: finalDamage,
      hpLost: unblockedDamage,
      remainingHp: this.hp,
      isDead: this.hp <= 0
    };
  }

  addBlock(amount) {
    this.block += amount;
  }

  applyDebuff(type, duration) {
    if (this.debuffs[type] !== undefined) {
      this.debuffs[type] += duration;
    }
  }

  applyBuff(type, value) {
    if (this.buffs[type] !== undefined) {
      this.buffs[type] += value;
    }
  }

  triggerStartTurnEffects() {
    const results = {
      burnDamage: 0
    };

    // Procesar quemadura
    if (this.debuffs.burn > 0) {
      results.burnDamage = this.debuffs.burn;
      this.hp = Math.max(0, this.hp - results.burnDamage);
      this.debuffs.burn = Math.max(0, this.debuffs.burn - 1);
    }

    // El bloqueo enemigo se resetea al inicio de su turno
    this.block = 0;

    return results;
  }

  tickTurnEnd() {
    // Reducir duraciones de debuffs temporales
    if (this.debuffs.vulnerable > 0) this.debuffs.vulnerable--;
    if (this.debuffs.weak > 0) this.debuffs.weak--;
  }
}
