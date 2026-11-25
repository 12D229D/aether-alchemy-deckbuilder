// Motor de Combate por Turnos, Cálculo de Daño, Escudos, Efectos y Reliquias
import { audio } from './audio.js';

export const RELICS_CATALOG = [
  {
    id: 'relic_alembic',
    name: 'Alambique de Mercurio',
    description: 'Al realizar cualquier transmutación, gana +1 de Éter temporal.',
    icon: '⚗️',
    trigger: 'onTransmute'
  },
  {
    id: 'relic_philosopher_shard',
    name: 'Fragmento Filosofal',
    description: 'Inicias cada combate con 6 de Bloqueo.',
    icon: '🔮',
    trigger: 'onCombatStart'
  },
  {
    id: 'relic_brimstone',
    name: 'Piedra de Azufre Ardiente',
    description: 'Todos los ataques de Fuego infligen +3 de daño base.',
    icon: '🔥',
    trigger: 'onFireAttack'
  },
  {
    id: 'relic_dew_vial',
    name: 'Vial de Rocío Celestial',
    description: 'Al final del combate, recuperas 4 puntos de Vida.',
    icon: '🧪',
    trigger: 'onCombatEnd'
  },
  {
    id: 'relic_astral_compass',
    name: 'Brújula Astral',
    description: 'Al inicio del turno 1, roba 1 carta adicional.',
    icon: '🧭',
    trigger: 'onTurn1'
  }
];

export class CombatManager {
  constructor(player, enemyInstance, deckManager, alchemyLab) {
    this.player = player;
    this.enemy = enemyInstance;
    this.deck = deckManager;
    this.alchemy = alchemyLab;

    this.turn = 1;
    this.phase = 'PLAYER_TURN'; // 'PLAYER_TURN' | 'ENEMY_TURN' | 'ENDED'
    this.combatLog = [];
    this.isOver = false;
    this.winner = null; // 'player' | 'enemy'
  }

  startCombat() {
    this.combatLog = [];
    this.isOver = false;
    this.winner = null;
    this.turn = 1;

    // Resetear escudos iniciales
    this.player.block = 0;
    this.player.aether = this.player.maxAether;

    // Trigger de reliquias de inicio de combate
    if (this.player.hasRelic('relic_philosopher_shard')) {
      this.player.block += 6;
      this.log(`🔮 Fragmento Filosofal otorga 6 de Bloqueo al Alquimista.`);
    }

    // Inicializar mazo
    this.deck.initCombatDeck(this.player.masterDeck);
    
    // Robar cartas iniciales (5 base o 6 si tiene Brújula Astral)
    const drawCount = this.player.hasRelic('relic_astral_compass') ? 6 : 5;
    this.deck.draw(drawCount);

    this.phase = 'PLAYER_TURN';
    this.log(`⚔️ ¡Comienza el enfrentamiento contra ${this.enemy.name}!`);
  }

  log(msg) {
    this.combatLog.push({
      turn: this.turn,
      message: msg,
      timestamp: Date.now()
    });
  }

  // Jugar carta de la mano
  playCard(instanceId) {
    if (this.phase !== 'PLAYER_TURN' || this.isOver) return false;

    const card = this.deck.hand.find(c => c.instanceId === instanceId);
    if (!card) return false;

    // Verificar coste de Éter
    if (this.player.aether < card.cost) {
      this.log(`⚠️ Éter insuficiente para invocar "${card.name}".`);
      return false;
    }

    // Deducir Éter
    this.player.aether -= card.cost;
    this.deck.playCard(instanceId);

    // Ejecutar efectos de la carta
    this.executeCardEffects(card);

    // Chequear si el enemigo murió
    if (this.enemy.hp <= 0) {
      this.handleVictory();
      return true;
    }

    return true;
  }

  executeCardEffects(card) {
    // Daño
    if (card.damage && card.damage > 0) {
      let dmg = card.damage;
      // Bonus por Fuerza
      if (this.player.buffs.strength > 0) {
        dmg += this.player.buffs.strength;
      }
      // Debuff Débil
      if (this.player.debuffs.weak > 0) {
        dmg = Math.floor(dmg * 0.75);
      }
      // Reliquia de azufre
      if (card.element === 'fire' && this.player.hasRelic('relic_brimstone')) {
        dmg += 3;
      }

      const result = this.enemy.takeDamage(dmg);
      this.log(`💥 "${card.name}" infligió ${result.damageDealt} daño a ${this.enemy.name} (${result.hpLost} a la vida).`);
      
      if (card.element === 'fire') {
        audio.playFireImpact();
      } else if (card.element === 'water') {
        audio.playWaterIce();
      } else {
        audio.playCardPlay();
      }
    }

    // Bloqueo
    if (card.block && card.block > 0) {
      this.player.block += card.block;
      audio.playShield();
      this.log(`🛡️ Obtienes ${card.block} de Bloqueo.`);
    }

    // Curación
    if (card.heal && card.heal > 0) {
      const oldHp = this.player.hp;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + card.heal);
      const recovered = this.player.hp - oldHp;
      audio.playHeal();
      this.log(`💖 Te has curado ${recovered} puntos de Vida.`);
    }

    // Drenaje de Vida
    if (card.drain && card.drain > 0) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + card.drain);
      audio.playHeal();
      this.log(`🩸 Drenas ${card.drain} puntos de vida del enemigo.`);
    }

    // Energía / Éter extra
    if (card.energy && card.energy > 0) {
      this.player.aether = Math.min(this.player.maxAether + 2, this.player.aether + card.energy);
      this.log(`✨ Canalizas +${card.energy} de Éter.`);
    }

    // Robo de cartas
    if (card.draw && card.draw > 0) {
      this.deck.draw(card.draw);
      this.log(`📜 Robas ${card.draw} carta(s) adicional(es).`);
    }

    // Quemadura aplicada
    if (card.burn && card.burn > 0) {
      this.enemy.applyDebuff('burn', card.burn);
      this.log(`🔥 Aplicas ${card.burn} de Quemadura a ${this.enemy.name}.`);
    }

    // Debuffs varios (vulnerable, weak)
    if (card.debuff) {
      for (const [key, val] of Object.entries(card.debuff)) {
        this.enemy.applyDebuff(key, val);
        this.log(`⚡ Aplica ${val} de ${key.toUpperCase()} al enemigo.`);
      }
    }

    // Buffs propios
    if (card.buff) {
      for (const [key, val] of Object.entries(card.buff)) {
        if (this.player.buffs[key] !== undefined) {
          this.player.buffs[key] += val;
          this.log(`🌟 Ganas +${val} de ${key.toUpperCase()}.`);
        }
      }
    }
  }

  // Transmutar cartas en el Crisol
  transmuteCrucible() {
    if (this.phase !== 'PLAYER_TURN' || this.isOver) return null;

    const recipe = this.alchemy.checkRecipe();
    if (!recipe) return null;

    const synthesizedCard = this.alchemy.transmute();
    if (synthesizedCard) {
      this.deck.addToHand(synthesizedCard);
      this.log(`⚗️ ¡Éxito Alquímico! Has transmutado: "${synthesizedCard.name}".`);

      // Reliquia Alambique
      if (this.player.hasRelic('relic_alembic')) {
        this.player.aether = Math.min(this.player.maxAether + 2, this.player.aether + 1);
        this.log(`⚗️ Alambique de Mercurio otorga +1 de Éter por la transmutación.`);
      }

      return synthesizedCard;
    }
    return null;
  }

  // Finalizar turno del jugador
  endTurn() {
    if (this.phase !== 'PLAYER_TURN' || this.isOver) return;

    this.phase = 'ENEMY_TURN';
    this.deck.discardHand();

    // Reducir debuffs de fin de turno del jugador
    if (this.player.debuffs.vulnerable > 0) this.player.debuffs.vulnerable--;
    if (this.player.debuffs.weak > 0) this.player.debuffs.weak--;

    // Turno del enemigo
    setTimeout(() => {
      this.executeEnemyTurn();
    }, 600);
  }

  executeEnemyTurn() {
    if (this.isOver) return;

    // Efectos de inicio de turno enemigo (Quemadura, etc.)
    const startEffects = this.enemy.triggerStartTurnEffects();
    if (startEffects.burnDamage > 0) {
      this.log(`🔥 ${this.enemy.name} arde por ${startEffects.burnDamage} de daño.`);
      if (this.enemy.hp <= 0) {
        this.handleVictory();
        return;
      }
    }

    const intent = this.enemy.getCurrentIntent();
    this.log(`⚠️ ${this.enemy.name} ejecuta: ${intent.desc}`);

    // Resolver intenciones
    if (intent.type === 'attack') {
      audio.playEnemyAttack();
      let damage = intent.value;
      if (this.enemy.buffs.strength > 0) damage += this.enemy.buffs.strength;
      if (this.enemy.debuffs.weak > 0) damage = Math.floor(damage * 0.75);
      if (this.player.debuffs.vulnerable > 0) damage = Math.floor(damage * 1.5);

      let unblocked = 0;
      if (this.player.block >= damage) {
        this.player.block -= damage;
      } else {
        unblocked = damage - this.player.block;
        this.player.block = 0;
        this.player.hp = Math.max(0, this.player.hp - unblocked);
      }
      this.log(`🩸 Recibes ${damage} de ataque (${unblocked} directo a la Vida).`);

      // Daño por espinas del jugador
      if (this.player.buffs.thorns > 0) {
        const thornRes = this.enemy.takeDamage(this.player.buffs.thorns);
        this.log(`🌵 Tus Espinas devuelven ${thornRes.damageDealt} daño al atacante.`);
      }

      // Debuffs aplicados al jugador
      if (intent.debuff) {
        for (const [k, v] of Object.entries(intent.debuff)) {
          if (this.player.debuffs[k] !== undefined) {
            this.player.debuffs[k] += v;
            this.log(`💀 Sufres ${v} de ${k.toUpperCase()}.`);
          }
        }
      }
    } else if (intent.type === 'defend') {
      this.enemy.addBlock(intent.value);
      audio.playShield();
      this.log(`🛡️ ${this.enemy.name} levanta ${intent.value} de Bloqueo.`);
      if (intent.buff) {
        for (const [k, v] of Object.entries(intent.buff)) {
          this.enemy.applyBuff(k, v);
        }
      }
    } else if (intent.type === 'buff') {
      if (intent.buff) {
        for (const [k, v] of Object.entries(intent.buff)) {
          this.enemy.applyBuff(k, v);
          this.log(`💪 ${this.enemy.name} incrementa su ${k.toUpperCase()} en +${v}.`);
        }
      }
    } else if (intent.type === 'debuff') {
      if (intent.debuff) {
        for (const [k, v] of Object.entries(intent.debuff)) {
          if (this.player.debuffs[k] !== undefined) {
            this.player.debuffs[k] += v;
            this.log(`🕸️ ${this.enemy.name} te inflige ${v} de ${k.toUpperCase()}.`);
          }
        }
      }
    } else if (intent.type === 'special') {
      if (intent.heal) {
        this.enemy.hp = Math.min(this.enemy.maxHp, this.enemy.hp + intent.heal);
        this.log(`✨ ${this.enemy.name} se regenera ${intent.heal} de Vida.`);
      }
      if (intent.buff) {
        for (const [k, v] of Object.entries(intent.buff)) {
          this.enemy.applyBuff(k, v);
        }
      }
    }

    // Avanzar patrón de IA
    this.enemy.advanceTurn();
    this.enemy.tickTurnEnd();

    // Chequear si el jugador murió
    if (this.player.hp <= 0) {
      this.handleDefeat();
      return;
    }

    // Iniciar nuevo turno de jugador
    this.turn++;
    this.player.block = 0; // El bloqueo del jugador se reinicia
    this.player.aether = this.player.maxAether;
    this.deck.draw(5);
    this.phase = 'PLAYER_TURN';
    this.log(`🌟 Turno ${this.turn}: Éter restaurado y 5 cartas robadas.`);
  }

  handleVictory() {
    this.isOver = true;
    this.winner = 'player';
    this.phase = 'ENDED';
    audio.playVictory();
    this.log(`🏆 ¡Victoria Alquímica! ${this.enemy.name} ha sido derrotado.`);

    // Reliquia Vial de Rocío
    if (this.player.hasRelic('relic_dew_vial')) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 4);
      this.log(`🧪 El Vial de Rocío Celestial te cura 4 HP al concluir el combate.`);
    }
  }

  handleDefeat() {
    this.isOver = true;
    this.winner = 'enemy';
    this.phase = 'ENDED';
    audio.playDefeat();
    this.log(`💀 Has sucumbido al influjo elemental. Tu viaje termina aquí.`);
  }
}
