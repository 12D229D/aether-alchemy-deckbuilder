// Matriz de Recetas y Transmutación Alquímica Elemental
import { audio } from './audio.js';

// Definición de Elementos Primarios Base
export const ELEMENTAL_CARDS = {
  fire: {
    id: 'elem_fire',
    name: 'Esencia de Fuego',
    element: 'fire',
    type: 'element',
    cost: 1,
    damage: 6,
    block: 0,
    burn: 2,
    rarity: 'common',
    description: 'Inflige 6 de daño y aplica 2 de Quemadura.',
    icon: '🔥',
    color: 'var(--elem-fire)'
  },
  water: {
    id: 'elem_water',
    name: 'Esencia de Agua',
    element: 'water',
    type: 'element',
    cost: 1,
    damage: 4,
    block: 5,
    rarity: 'common',
    description: 'Inflige 4 de daño y otorga 5 de Bloqueo.',
    icon: '💧',
    color: 'var(--elem-water)'
  },
  earth: {
    id: 'elem_earth',
    name: 'Esencia de Tierra',
    element: 'earth',
    type: 'element',
    cost: 1,
    damage: 0,
    block: 8,
    rarity: 'common',
    description: 'Refuerza tu defensa con 8 de Bloqueo.',
    icon: '🌱',
    color: 'var(--elem-earth)'
  },
  air: {
    id: 'elem_air',
    name: 'Esencia de Aire',
    element: 'air',
    type: 'element',
    cost: 1,
    damage: 5,
    draw: 1,
    rarity: 'common',
    description: 'Inflige 5 de daño veloz y roba 1 carta.',
    icon: '💨',
    color: 'var(--elem-air)'
  },
  aether: {
    id: 'elem_aether',
    name: 'Éter Puro',
    element: 'aether',
    type: 'element',
    cost: 1,
    damage: 4,
    energy: 1,
    rarity: 'uncommon',
    description: 'Canaliza las corrientes astrales: Otorga +1 de Éter y 4 de daño.',
    icon: '✨',
    color: 'var(--elem-aether)'
  },
  void: {
    id: 'elem_void',
    name: 'Piedra de Vacío',
    element: 'void',
    type: 'element',
    cost: 0,
    damage: 0,
    block: 3,
    debuff: { vulnerable: 1 },
    rarity: 'uncommon',
    description: 'El abismo consume: Otorga 3 de Bloqueo y aplica 1 Vulnerable al enemigo.',
    icon: '🌑',
    color: 'var(--elem-void)'
  }
};

// Recetas Alquímicas Transmutadas (2 y 3 ingredientes)
export const TRANSMUTATION_RECIPES = [
  // Fuego + Agua = Vapor Curativo
  {
    ingredients: ['fire', 'water'],
    result: {
      id: 'spell_healing_steam',
      name: 'Vapor Curativo',
      type: 'transmuted',
      cost: 1,
      heal: 6,
      block: 8,
      rarity: 'rare',
      description: 'Condensa vapores místicos: Restaura 6 de Vida y otorga 8 de Bloqueo.',
      icon: '♨️',
      color: 'hsl(190, 80%, 60%)',
      exhaust: true
    }
  },
  // Fuego + Tierra = Magma Devastador
  {
    ingredients: ['earth', 'fire'],
    result: {
      id: 'spell_devastating_magma',
      name: 'Magma Devastador',
      type: 'transmuted',
      cost: 2,
      damage: 18,
      burn: 4,
      rarity: 'rare',
      description: 'Funde roca ígnea: Inflige 18 de daño y aplica 4 de Quemadura.',
      icon: '🌋',
      color: 'hsl(15, 95%, 52%)',
      exhaust: true
    }
  },
  // Aire + Agua = Tormenta de Rayos
  {
    ingredients: ['air', 'water'],
    result: {
      id: 'spell_lightning_storm',
      name: 'Tormenta de Rayos',
      type: 'transmuted',
      cost: 1,
      damage: 14,
      draw: 2,
      rarity: 'rare',
      description: 'Tempestad ionizada: Inflige 14 de daño y roba 2 cartas.',
      icon: '⚡',
      color: 'hsl(50, 100%, 60%)',
      exhaust: true
    }
  },
  // Tierra + Aire = Torbellino de Arena
  {
    ingredients: ['air', 'earth'],
    result: {
      id: 'spell_sand_whirlwind',
      name: 'Torbellino de Arena',
      type: 'transmuted',
      cost: 1,
      damage: 8,
      block: 8,
      debuff: { weak: 2 },
      rarity: 'uncommon',
      description: 'Ciega a la bestia: 8 de daño, 8 de Bloqueo y aplica 2 de Débil.',
      icon: '🌪️',
      color: 'hsl(42, 60%, 55%)',
      exhaust: true
    }
  },
  // Éter + Fuego = Supernova Astral
  {
    ingredients: ['aether', 'fire'],
    result: {
      id: 'spell_astral_supernova',
      name: 'Supernova Astral',
      type: 'transmuted',
      cost: 2,
      damage: 24,
      burn: 5,
      rarity: 'epic',
      description: 'Colapso estelar ardiente: Inflige 24 de daño y 5 de Quemadura intensa.',
      icon: '🌠',
      color: 'hsl(330, 90%, 65%)',
      exhaust: true
    }
  },
  // Éter + Agua = Elixir de Fuente Eterna
  {
    ingredients: ['aether', 'water'],
    result: {
      id: 'spell_eternal_font',
      name: 'Fuente Eterna',
      type: 'transmuted',
      cost: 1,
      heal: 10,
      energy: 1,
      block: 6,
      rarity: 'epic',
      description: 'Aguas del Edén Alquímico: Restaura 10 de Vida, otorga 6 de Bloqueo y +1 Éter.',
      icon: '🧪',
      color: 'hsl(175, 85%, 55%)',
      exhaust: true
    }
  },
  // Éter + Tierra = Bastión Adamantino
  {
    ingredients: ['aether', 'earth'],
    result: {
      id: 'spell_adamantine_bastion',
      name: 'Bastión Adamantino',
      type: 'transmuted',
      cost: 1,
      block: 22,
      buff: { thorns: 4 },
      rarity: 'epic',
      description: 'Escudo inquebrantable: Otorga 22 de Bloqueo y 4 de Espinas reflexivas.',
      icon: '🛡️',
      color: 'hsl(140, 70%, 45%)',
      exhaust: true
    }
  },
  // Éter + Vacío = Singularidad
  {
    ingredients: ['aether', 'void'],
    result: {
      id: 'spell_singularity',
      name: 'Singularidad Cósmica',
      type: 'transmuted',
      cost: 2,
      damage: 32,
      debuff: { vulnerable: 2, weak: 2 },
      rarity: 'legendary',
      description: 'Rasga el tejido de la realidad: Inflige 32 de daño, 2 Vulnerable y 2 Débil.',
      icon: '🌌',
      color: 'hsl(270, 100%, 75%)',
      exhaust: true
    }
  },
  // Vacío + Fuego = Fuego Sombrío
  {
    ingredients: ['fire', 'void'],
    result: {
      id: 'spell_shadowflame',
      name: 'Llama del Abismo',
      type: 'transmuted',
      cost: 1,
      damage: 15,
      burn: 4,
      debuff: { vulnerable: 1 },
      rarity: 'rare',
      description: 'Fuego devorador de almas: 15 de daño, 4 Quemadura y 1 Vulnerable.',
      icon: '🔥',
      color: 'hsl(285, 80%, 40%)',
      exhaust: true
    }
  },
  // Vacío + Agua = Marea Abisal
  {
    ingredients: ['void', 'water'],
    result: {
      id: 'spell_abyssal_tide',
      name: 'Marea Abisal',
      type: 'transmuted',
      cost: 1,
      damage: 10,
      drain: 6, // Daño con robo de vida
      rarity: 'rare',
      description: 'Drenaje vampírico: 10 de daño y drena 6 puntos de salud al enemigo.',
      icon: '🌊',
      color: 'hsl(215, 75%, 35%)',
      exhaust: true
    }
  },
  // 3 Ingredientes: Fuego + Tierra + Éter = Piedra Filosofal Arcana
  {
    ingredients: ['earth', 'fire', 'aether'],
    result: {
      id: 'spell_philosophers_stone',
      name: 'Proyección Filosofal',
      type: 'transmuted',
      cost: 2,
      damage: 30,
      heal: 12,
      block: 15,
      rarity: 'legendary',
      description: 'La Gran Obra: Inflige 30 de daño, cura 12 de Vida y otorga 15 de Bloqueo.',
      icon: '💎',
      color: 'hsl(45, 100%, 55%)',
      exhaust: true
    }
  },
  // 3 Ingredientes: Aire + Agua + Vacío = Vórtice del Eclipse
  {
    ingredients: ['air', 'void', 'water'],
    result: {
      id: 'spell_eclipse_vortex',
      name: 'Vórtice del Eclipse',
      type: 'transmuted',
      cost: 2,
      damage: 26,
      draw: 3,
      debuff: { weak: 3 },
      rarity: 'legendary',
      description: 'Horizonte de sucesos: 26 de daño, roba 3 cartas y aplica 3 de Débil.',
      icon: '🌀',
      color: 'hsl(260, 95%, 68%)',
      exhaust: true
    }
  }
];

export class AlchemyLab {
  constructor() {
    this.crucible = []; // Cartas colocadas en el crisol
    this.maxCrucibleSlots = 3;
    this.knownRecipes = new Set();
  }

  addToCrucible(card) {
    if (this.crucible.length >= this.maxCrucibleSlots) {
      return false;
    }
    this.crucible.push(card);
    audio.playCardHover();
    return true;
  }

  removeFromCrucible(index) {
    if (index >= 0 && index < this.crucible.length) {
      const [removed] = this.crucible.splice(index, 1);
      return removed;
    }
    return null;
  }

  clearCrucible() {
    const returned = [...this.crucible];
    this.crucible = [];
    return returned;
  }

  // Verifica si las cartas actuales en el crisol forman una receta válida
  checkRecipe() {
    if (this.crucible.length < 2) return null;

    const currentElements = this.crucible
      .map(c => c.element)
      .filter(Boolean)
      .sort();

    for (const recipe of TRANSMUTATION_RECIPES) {
      const recipeSorted = [...recipe.ingredients].sort();
      if (
        recipeSorted.length === currentElements.length &&
        recipeSorted.every((elem, idx) => elem === currentElements[idx])
      ) {
        return recipe.result;
      }
    }

    // Fusión inestable por defecto si no hay receta específica (fusión elemental genérica)
    return {
      id: `spell_unstable_${Date.now()}`,
      name: 'Fusión Caótica Inestable',
      type: 'transmuted',
      cost: 1,
      damage: 10 + this.crucible.length * 4,
      block: 4 * this.crucible.length,
      rarity: 'uncommon',
      description: `Fusión de ${this.crucible.length} esencias: Inflige ${10 + this.crucible.length * 4} de daño impredecible.`,
      icon: '💥',
      color: 'hsl(300, 70%, 50%)',
      exhaust: true
    };
  }

  // Ejecuta la transmutación y consume los ingredientes
  transmute() {
    const recipeResult = this.checkRecipe();
    if (!recipeResult) return null;

    audio.playAlchemyFusion();
    this.knownRecipes.add(recipeResult.name);
    this.crucible = [];
    return recipeResult;
  }
}
