// Orquestador General del Juego, Máquina de Estados FSM y Persistencia Local
import { audio } from './audio.js';
import { DeckManager, ELEMENTS } from './deck.js';
import { AlchemyLab, ELEMENTAL_CARDS, TRANSMUTATION_RECIPES } from './alchemy.js';
import { EnemyInstance, ENEMY_DEFINITIONS } from './enemies.js';
import { CombatManager, RELICS_CATALOG } from './combat.js';
import { AdventureMap } from './map.js';

// Estados del Juego
export const GAME_STATES = {
  MENU: 'MENU',
  MAP: 'MAP',
  COMBAT: 'COMBAT',
  REWARD: 'REWARD',
  EVENT: 'EVENT',
  SHOP: 'SHOP',
  REST: 'REST',
  GAME_OVER: 'GAME_OVER',
  VICTORY: 'VICTORY'
};

export class GameApp {
  constructor() {
    this.state = GAME_STATES.MENU;
    
    // Entidades principales
    this.deckManager = new DeckManager();
    this.alchemyLab = new AlchemyLab();
    this.adventureMap = new AdventureMap(8);
    this.currentCombat = null;

    // Estado del Jugador
    this.player = {
      maxHp: 60,
      hp: 60,
      maxAether: 3,
      aether: 3,
      block: 0,
      gold: 50,
      relics: [],
      masterDeck: [],
      buffs: { strength: 0, thorns: 0 },
      debuffs: { vulnerable: 0, weak: 0 },
      hasRelic: (id) => this.player.relics.some(r => r.id === id)
    };

    // Datos de eventos aleatorios
    this.currentEvent = null;

    // Inicializar elementos DOM y listeners
    this.dom = {};
  }

  init() {
    this.cacheDOMElements();
    this.bindEvents();
    this.tryLoadSavedGame();
    this.updateHUD();
    console.log('🔮 Aether Alchemy Deckbuilder iniciado con éxito.');
  }

  cacheDOMElements() {
    this.dom = {
      // Pantallas / Vistas
      screens: {
        menu: document.getElementById('screen-menu'),
        map: document.getElementById('screen-map'),
        combat: document.getElementById('screen-combat'),
        reward: document.getElementById('screen-reward'),
        event: document.getElementById('screen-event'),
        shop: document.getElementById('screen-shop'),
        rest: document.getElementById('screen-rest'),
        end: document.getElementById('screen-end')
      },
      // HUD Superior
      hud: {
        container: document.getElementById('game-hud'),
        hpText: document.getElementById('hud-hp-text'),
        hpBar: document.getElementById('hud-hp-fill'),
        aetherText: document.getElementById('hud-aether-text'),
        goldText: document.getElementById('hud-gold-text'),
        relicsList: document.getElementById('hud-relics-list'),
        deckCountText: document.getElementById('hud-deck-count')
      },
      // Combate
      combat: {
        enemyAvatar: document.getElementById('combat-enemy-avatar'),
        enemyName: document.getElementById('combat-enemy-name'),
        enemyHpText: document.getElementById('combat-enemy-hp-text'),
        enemyHpBar: document.getElementById('combat-enemy-hp-fill'),
        enemyBlockBadge: document.getElementById('combat-enemy-block'),
        enemyIntent: document.getElementById('combat-enemy-intent'),
        enemyStatuses: document.getElementById('combat-enemy-statuses'),
        playerAvatar: document.getElementById('combat-player-avatar'),
        playerHpText: document.getElementById('combat-player-hp-text'),
        playerHpBar: document.getElementById('combat-player-hp-fill'),
        playerBlockBadge: document.getElementById('combat-player-block'),
        playerStatuses: document.getElementById('combat-player-statuses'),
        playerAetherOrb: document.getElementById('combat-aether-orb'),
        crucibleSlots: document.getElementById('crucible-slots'),
        cruciblePreview: document.getElementById('crucible-preview'),
        btnTransmute: document.getElementById('btn-transmute'),
        btnClearCrucible: document.getElementById('btn-clear-crucible'),
        playerHand: document.getElementById('player-hand'),
        drawPileCount: document.getElementById('draw-pile-count'),
        discardPileCount: document.getElementById('discard-pile-count'),
        btnEndTurn: document.getElementById('btn-end-turn'),
        combatLog: document.getElementById('combat-log-content')
      },
      // Mapa
      map: {
        treeContainer: document.getElementById('map-tree'),
        floorInfo: document.getElementById('map-floor-info')
      },
      // Tienda
      shop: {
        itemsContainer: document.getElementById('shop-items'),
        btnLeave: document.getElementById('btn-leave-shop')
      },
      // Eventos
      event: {
        title: document.getElementById('event-title'),
        desc: document.getElementById('event-desc'),
        optionsContainer: document.getElementById('event-options')
      },
      // Descanso
      rest: {
        btnHeal: document.getElementById('btn-rest-heal'),
        btnTransmuteCard: document.getElementById('btn-rest-forge')
      },
      // Recompensas
      reward: {
        goldAmount: document.getElementById('reward-gold-amount'),
        cardsContainer: document.getElementById('reward-cards-container'),
        btnSkipReward: document.getElementById('btn-skip-reward')
      },
      // Fin de partida
      end: {
        title: document.getElementById('end-title'),
        desc: document.getElementById('end-desc'),
        btnRestart: document.getElementById('btn-restart-game')
      },
      // Modales y Controles
      btnNewRun: document.getElementById('btn-new-run'),
      btnContinue: document.getElementById('btn-continue-run'),
      btnDeckViewer: document.getElementById('btn-view-deck'),
      deckModal: document.getElementById('deck-modal'),
      deckModalList: document.getElementById('deck-modal-list'),
      btnCloseDeckModal: document.getElementById('btn-close-deck-modal'),
      btnSoundToggle: document.getElementById('btn-sound-toggle'),
      btnRecipeBook: document.getElementById('btn-recipe-book'),
      recipesModal: document.getElementById('recipes-modal'),
      recipesModalList: document.getElementById('recipes-modal-list'),
      btnCloseRecipesModal: document.getElementById('btn-close-recipes-modal')
    };
  }

  bindEvents() {
    // Sonido
    if (this.dom.btnSoundToggle) {
      this.dom.btnSoundToggle.addEventListener('click', () => {
        const enabled = audio.toggleSound();
        this.dom.btnSoundToggle.textContent = enabled ? '🔊' : '🔇';
        this.dom.btnSoundToggle.title = enabled ? 'Sonido Activado' : 'Sonido Silenciado';
      });
    }

    // Nueva Partida
    if (this.dom.btnNewRun) {
      this.dom.btnNewRun.addEventListener('click', () => {
        audio.ensureContext();
        this.startNewRun();
      });
    }

    // Continuar Partida
    if (this.dom.btnContinue) {
      this.dom.btnContinue.addEventListener('click', () => {
        audio.ensureContext();
        this.loadGame();
      });
    }

    // Visor de Mazo
    if (this.dom.btnDeckViewer) {
      this.dom.btnDeckViewer.addEventListener('click', () => this.openDeckModal());
    }
    if (this.dom.btnCloseDeckModal) {
      this.dom.btnCloseDeckModal.addEventListener('click', () => this.closeDeckModal());
    }

    // Grimorio de Recetas
    if (this.dom.btnRecipeBook) {
      this.dom.btnRecipeBook.addEventListener('click', () => this.openRecipesModal());
    }
    if (this.dom.btnCloseRecipesModal) {
      this.dom.btnCloseRecipesModal.addEventListener('click', () => this.closeRecipesModal());
    }

    // Botones de Combate
    if (this.dom.combat.btnEndTurn) {
      this.dom.combat.btnEndTurn.addEventListener('click', () => {
        if (this.currentCombat && this.currentCombat.phase === 'PLAYER_TURN') {
          this.currentCombat.endTurn();
          this.renderCombatUI();
        }
      });
    }

    if (this.dom.combat.btnTransmute) {
      this.dom.combat.btnTransmute.addEventListener('click', () => {
        if (this.currentCombat && this.currentCombat.phase === 'PLAYER_TURN') {
          const res = this.currentCombat.transmuteCrucible();
          if (res) {
            this.renderCombatUI();
          }
        }
      });
    }

    if (this.dom.combat.btnClearCrucible) {
      this.dom.combat.btnClearCrucible.addEventListener('click', () => {
        const returned = this.alchemyLab.clearCrucible();
        returned.forEach(c => this.deckManager.returnToHand(c));
        this.renderCombatUI();
      });
    }

    // Salir de la Tienda
    if (this.dom.shop.btnLeave) {
      this.dom.shop.btnLeave.addEventListener('click', () => {
        this.changeState(GAME_STATES.MAP);
      });
    }

    // Acciones de Descanso
    if (this.dom.rest.btnHeal) {
      this.dom.rest.btnHeal.addEventListener('click', () => {
        const healAmt = Math.round(this.player.maxHp * 0.35);
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + healAmt);
        audio.playHeal();
        this.saveGame();
        this.changeState(GAME_STATES.MAP);
      });
    }

    if (this.dom.rest.btnTransmuteCard) {
      this.dom.rest.btnTransmuteCard.addEventListener('click', () => {
        // Otorga una Esencia de Éter al mazo
        this.player.masterDeck.push({ ...ELEMENTAL_CARDS.aether });
        audio.playAlchemyFusion();
        this.saveGame();
        this.changeState(GAME_STATES.MAP);
      });
    }

    // Omitir Recompensa
    if (this.dom.reward.btnSkipReward) {
      this.dom.reward.btnSkipReward.addEventListener('click', () => {
        this.changeState(GAME_STATES.MAP);
      });
    }

    // Reiniciar al perder/ganar
    if (this.dom.end.btnRestart) {
      this.dom.end.btnRestart.addEventListener('click', () => {
        this.startNewRun();
      });
    }
  }

  changeState(newState) {
    this.state = newState;

    // Ocultar todas las pantallas
    Object.values(this.dom.screens).forEach(s => {
      if (s) s.classList.add('hidden');
    });

    // Mostrar HUD general en estados in-game
    const inGame = [
      GAME_STATES.MAP,
      GAME_STATES.COMBAT,
      GAME_STATES.REWARD,
      GAME_STATES.EVENT,
      GAME_STATES.SHOP,
      GAME_STATES.REST
    ].includes(newState);

    if (this.dom.hud.container) {
      this.dom.hud.container.classList.toggle('hidden', !inGame);
    }

    // Mostrar pantalla activa y refrescar UI
    switch (newState) {
      case GAME_STATES.MENU:
        if (this.dom.screens.menu) this.dom.screens.menu.classList.remove('hidden');
        break;
      case GAME_STATES.MAP:
        if (this.dom.screens.map) this.dom.screens.map.classList.remove('hidden');
        this.renderMap();
        break;
      case GAME_STATES.COMBAT:
        if (this.dom.screens.combat) this.dom.screens.combat.classList.remove('hidden');
        this.renderCombatUI();
        break;
      case GAME_STATES.REWARD:
        if (this.dom.screens.reward) this.dom.screens.reward.classList.remove('hidden');
        this.renderRewardScreen();
        break;
      case GAME_STATES.EVENT:
        if (this.dom.screens.event) this.dom.screens.event.classList.remove('hidden');
        this.renderEventScreen();
        break;
      case GAME_STATES.SHOP:
        if (this.dom.screens.shop) this.dom.screens.shop.classList.remove('hidden');
        this.renderShopScreen();
        break;
      case GAME_STATES.REST:
        if (this.dom.screens.rest) this.dom.screens.rest.classList.remove('hidden');
        break;
      case GAME_STATES.GAME_OVER:
      case GAME_STATES.VICTORY:
        if (this.dom.screens.end) this.dom.screens.end.classList.remove('hidden');
        this.renderEndScreen(newState === GAME_STATES.VICTORY);
        break;
    }

    this.updateHUD();
    this.saveGame();
  }

  startNewRun() {
    // Configuración inicial del Alquimista
    this.player.maxHp = 60;
    this.player.hp = 60;
    this.player.maxAether = 3;
    this.player.aether = 3;
    this.player.block = 0;
    this.player.gold = 60;
    this.player.buffs = { strength: 0, thorns: 0 };
    this.player.debuffs = { vulnerable: 0, weak: 0 };

    // Reliquia inicial: Fragmento Filosofal
    this.player.relics = [{ ...RELICS_CATALOG[1] }];

    // Mazo inicial: 3 Fuego, 3 Agua, 3 Tierra, 2 Aire, 1 Éter
    this.player.masterDeck = [
      { ...ELEMENTAL_CARDS.fire },
      { ...ELEMENTAL_CARDS.fire },
      { ...ELEMENTAL_CARDS.fire },
      { ...ELEMENTAL_CARDS.water },
      { ...ELEMENTAL_CARDS.water },
      { ...ELEMENTAL_CARDS.water },
      { ...ELEMENTAL_CARDS.earth },
      { ...ELEMENTAL_CARDS.earth },
      { ...ELEMENTAL_CARDS.earth },
      { ...ELEMENTAL_CARDS.air },
      { ...ELEMENTAL_CARDS.air },
      { ...ELEMENTAL_CARDS.aether }
    ];

    // Generar mapa procedimental de 8 pisos
    this.adventureMap.generateMap();

    this.changeState(GAME_STATES.MAP);
  }

  updateHUD() {
    if (!this.dom.hud.hpText) return;

    // HP
    this.dom.hud.hpText.textContent = `${this.player.hp} / ${this.player.maxHp}`;
    const pct = Math.max(0, Math.min(100, (this.player.hp / this.player.maxHp) * 100));
    this.dom.hud.hpBar.style.width = `${pct}%`;

    // Éter y Oro
    this.dom.hud.aetherText.textContent = `${this.player.aether} / ${this.player.maxAether}`;
    this.dom.hud.goldText.textContent = `${this.player.gold} 🪙`;

    // Conteo de mazo
    this.dom.hud.deckCountText.textContent = `${this.player.masterDeck.length} 🃏`;

    // Reliquias
    this.dom.hud.relicsList.innerHTML = '';
    this.player.relics.forEach(relic => {
      const el = document.createElement('div');
      el.className = 'relic-icon-hud';
      el.textContent = relic.icon;
      el.title = `${relic.name}: ${relic.description}`;
      this.dom.hud.relicsList.appendChild(el);
    });
  }

  // Renderizar Árbol de Nodos de Aventura
  renderMap() {
    if (!this.dom.map.treeContainer) return;
    this.dom.map.treeContainer.innerHTML = '';

    const nodes = this.adventureMap.nodes;
    this.dom.map.floorInfo.textContent = `Piso Actual: ${this.adventureMap.currentFloor + 1} de ${this.adventureMap.floorsCount}`;

    // Dibujar pisos en orden vertical invertido (Piso 0 abajo, Boss arriba)
    for (let f = nodes.length - 1; f >= 0; f--) {
      const floorRow = document.createElement('div');
      floorRow.className = 'map-floor-row';

      const floorLabel = document.createElement('div');
      floorLabel.className = 'map-floor-label';
      floorLabel.textContent = f === nodes.length - 1 ? '👑 Cima' : `Piso ${f + 1}`;
      floorRow.appendChild(floorLabel);

      const nodesWrap = document.createElement('div');
      nodesWrap.className = 'map-floor-nodes';

      nodes[f].forEach(node => {
        const nodeBtn = document.createElement('button');
        nodeBtn.className = `map-node-btn node-status-${node.status} node-type-${node.type}`;
        nodeBtn.innerHTML = `<span class="node-icon">${node.icon}</span><span class="node-name">${node.name}</span>`;
        nodeBtn.title = `${node.name}\n${node.desc}`;

        if (node.status === 'available') {
          nodeBtn.classList.add('pulse-node');
          nodeBtn.addEventListener('click', () => {
            audio.playCardDraw();
            this.handleNodeSelect(node);
          });
        } else {
          nodeBtn.disabled = true;
        }

        nodesWrap.appendChild(nodeBtn);
      });

      floorRow.appendChild(nodesWrap);
      this.dom.map.treeContainer.appendChild(floorRow);
    }
  }

  handleNodeSelect(node) {
    this.adventureMap.visitNode(node.id);

    if (node.type === 'combat') {
      this.startCombatEncounter('normal');
    } else if (node.type === 'elite') {
      this.startCombatEncounter('elite');
    } else if (node.type === 'boss') {
      this.startCombatEncounter('boss');
    } else if (node.type === 'shop') {
      this.changeState(GAME_STATES.SHOP);
    } else if (node.type === 'rest') {
      this.changeState(GAME_STATES.REST);
    } else if (node.type === 'event') {
      this.startRandomEvent();
    }
  }

  startCombatEncounter(encounterType) {
    // Filtrar enemigos del tipo adecuado
    const pool = ENEMY_DEFINITIONS.filter(e => e.type === encounterType);
    const chosenDef = pool[Math.floor(Math.random() * pool.length)] || ENEMY_DEFINITIONS[0];
    
    const enemyInstance = new EnemyInstance(chosenDef, this.adventureMap.currentFloor + 1);
    this.currentCombat = new CombatManager(this.player, enemyInstance, this.deckManager, this.alchemyLab);
    this.currentCombat.startCombat();

    this.changeState(GAME_STATES.COMBAT);
  }

  renderCombatUI() {
    if (!this.currentCombat) return;

    const enemy = this.currentCombat.enemy;
    const player = this.player;

    // Verificar si el combate terminó
    if (this.currentCombat.isOver) {
      if (this.currentCombat.winner === 'player') {
        setTimeout(() => {
          if (enemy.type === 'boss') {
            this.changeState(GAME_STATES.VICTORY);
          } else {
            this.changeState(GAME_STATES.REWARD);
          }
        }, 1200);
      } else {
        setTimeout(() => {
          this.changeState(GAME_STATES.GAME_OVER);
        }, 1200);
      }
      return;
    }

    // Datos del enemigo
    this.dom.combat.enemyName.textContent = enemy.name;
    this.dom.combat.enemyAvatar.textContent = enemy.avatar;
    this.dom.combat.enemyHpText.textContent = `${enemy.hp} / ${enemy.maxHp}`;
    const enemyPct = Math.max(0, (enemy.hp / enemy.maxHp) * 100);
    this.dom.combat.enemyHpBar.style.width = `${enemyPct}%`;

    // Bloqueo enemigo
    if (enemy.block > 0) {
      this.dom.combat.enemyBlockBadge.classList.remove('hidden');
      this.dom.combat.enemyBlockBadge.textContent = `🛡️ ${enemy.block}`;
    } else {
      this.dom.combat.enemyBlockBadge.classList.add('hidden');
    }

    // Intención visible del enemigo (Slay the Spire Intent System)
    const intent = enemy.getCurrentIntent();
    let intentIcon = '⚔️';
    if (intent.type === 'defend') intentIcon = '🛡️';
    if (intent.type === 'buff') intentIcon = '💪';
    if (intent.type === 'debuff') intentIcon = '💀';
    if (intent.type === 'special') intentIcon = '✨';

    this.dom.combat.enemyIntent.innerHTML = `
      <div class="intent-badge intent-${intent.type}">
        <span class="intent-icon">${intentIcon}</span>
        <span class="intent-text">${intent.desc}</span>
      </div>
    `;

    // Statuses del enemigo
    this.dom.combat.enemyStatuses.innerHTML = '';
    if (enemy.debuffs.burn > 0) this.dom.combat.enemyStatuses.innerHTML += `<span class="status-tag burn">🔥 ${enemy.debuffs.burn} Quemadura</span>`;
    if (enemy.debuffs.vulnerable > 0) this.dom.combat.enemyStatuses.innerHTML += `<span class="status-tag vuln">⚡ ${enemy.debuffs.vulnerable} Vulnerable</span>`;
    if (enemy.debuffs.weak > 0) this.dom.combat.enemyStatuses.innerHTML += `<span class="status-tag weak">🌀 ${enemy.debuffs.weak} Débil</span>`;
    if (enemy.buffs.strength > 0) this.dom.combat.enemyStatuses.innerHTML += `<span class="status-tag str">🗡️ +${enemy.buffs.strength} Fuerza</span>`;
    if (enemy.buffs.thorns > 0) this.dom.combat.enemyStatuses.innerHTML += `<span class="status-tag thorns">🌵 ${enemy.buffs.thorns} Espinas</span>`;

    // Datos del jugador en combate
    this.dom.combat.playerHpText.textContent = `${player.hp} / ${player.maxHp}`;
    const playerPct = Math.max(0, (player.hp / player.maxHp) * 100);
    this.dom.combat.playerHpBar.style.width = `${playerPct}%`;

    // Bloqueo jugador
    if (player.block > 0) {
      this.dom.combat.playerBlockBadge.classList.remove('hidden');
      this.dom.combat.playerBlockBadge.textContent = `🛡️ ${player.block}`;
    } else {
      this.dom.combat.playerBlockBadge.classList.add('hidden');
    }

    // Orbe de Éter
    this.dom.combat.playerAetherOrb.textContent = `${player.aether}`;

    // Pila de robo y descarte
    this.dom.combat.drawPileCount.textContent = this.deckManager.drawPile.length;
    this.dom.combat.discardPileCount.textContent = this.deckManager.discardPile.length;

    // Renderizar Crisol Alquímico
    this.renderCrucible();

    // Renderizar Mano del Jugador
    this.renderHand();

    // Renderizar Bitácora de Combate
    this.renderCombatLog();

    // Control de botón de fin de turno
    this.dom.combat.btnEndTurn.disabled = (this.currentCombat.phase !== 'PLAYER_TURN');
  }

  renderCrucible() {
    this.dom.combat.crucibleSlots.innerHTML = '';
    const slotsCount = this.alchemyLab.maxCrucibleSlots;

    for (let i = 0; i < slotsCount; i++) {
      const slotEl = document.createElement('div');
      slotEl.className = 'crucible-slot';
      const card = this.alchemyLab.crucible[i];

      if (card) {
        slotEl.classList.add('occupied');
        slotEl.innerHTML = `
          <div class="crucible-card-mini element-${card.element}">
            <span class="crucible-card-icon">${card.icon}</span>
            <span class="crucible-card-name">${card.name}</span>
          </div>
        `;
        slotEl.title = 'Haz clic para retirar del crisol';
        slotEl.addEventListener('click', () => {
          const removed = this.alchemyLab.removeFromCrucible(i);
          if (removed) {
            this.deckManager.returnToHand(removed);
            this.renderCombatUI();
          }
        });
      } else {
        slotEl.innerHTML = `<span class="empty-slot-text">+ Reactivo</span>`;
      }

      this.dom.combat.crucibleSlots.appendChild(slotEl);
    }

    // Vista previa de la receta potencial
    const previewRecipe = this.alchemyLab.checkRecipe();
    if (previewRecipe) {
      this.dom.combat.cruciblePreview.innerHTML = `
        <div class="recipe-preview-box">
          <span class="preview-sparkle">✨ Síntesis Posible:</span>
          <strong>${previewRecipe.icon} ${previewRecipe.name}</strong> (${previewRecipe.description})
        </div>
      `;
      this.dom.combat.btnTransmute.disabled = false;
    } else {
      this.dom.combat.cruciblePreview.innerHTML = `
        <div class="recipe-preview-empty">Coloca al menos 2 esencias para descubrir su transmutación...</div>
      `;
      this.dom.combat.btnTransmute.disabled = true;
    }
  }

  renderHand() {
    this.dom.combat.playerHand.innerHTML = '';
    const hand = this.deckManager.hand;

    hand.forEach(card => {
      const cardEl = document.createElement('div');
      cardEl.className = `alchemical-card rarity-${card.rarity} type-${card.type} element-${card.element || 'neutral'}`;
      cardEl.setAttribute('data-id', card.instanceId);

      const canAfford = this.player.aether >= card.cost;
      if (!canAfford) {
        cardEl.classList.add('unaffordable');
      }

      cardEl.innerHTML = `
        <div class="card-inner">
          <div class="card-cost" title="Coste de Éter">${card.cost}</div>
          <div class="card-art">${card.icon}</div>
          <div class="card-name">${card.name}</div>
          <div class="card-type-tag">${card.type === 'element' ? 'Esencia' : 'Transmutado'}</div>
          <div class="card-desc">${card.description}</div>
          <div class="card-actions">
            <button class="btn-card-action btn-play" title="Invocar conjuro">Jugar</button>
            ${card.element ? `<button class="btn-card-action btn-crucible" title="Añadir al crisol">Crisol</button>` : ''}
          </div>
        </div>
      `;

      // Eventos de interacción
      const btnPlay = cardEl.querySelector('.btn-play');
      btnPlay.addEventListener('click', (e) => {
        e.stopPropagation();
        if (canAfford) {
          this.currentCombat.playCard(card.instanceId);
          this.renderCombatUI();
        } else {
          audio.playCardHover();
        }
      });

      const btnCrucible = cardEl.querySelector('.btn-crucible');
      if (btnCrucible) {
        btnCrucible.addEventListener('click', (e) => {
          e.stopPropagation();
          const removed = this.deckManager.removeFromHand(card.instanceId);
          if (removed) {
            const added = this.alchemyLab.addToCrucible(removed);
            if (!added) {
              this.deckManager.returnToHand(removed);
            }
            this.renderCombatUI();
          }
        });
      }

      cardEl.addEventListener('mouseenter', () => audio.playCardHover());

      this.dom.combat.playerHand.appendChild(cardEl);
    });
  }

  renderCombatLog() {
    if (!this.dom.combat.combatLog) return;
    this.dom.combat.combatLog.innerHTML = '';
    const logs = this.currentCombat.combatLog.slice(-8); // Últimos 8 registros
    logs.forEach(log => {
      const p = document.createElement('p');
      p.className = 'log-entry';
      p.textContent = log.message;
      this.dom.combat.combatLog.appendChild(p);
    });
    this.dom.combat.combatLog.scrollTop = this.dom.combat.combatLog.scrollHeight;
  }

  renderRewardScreen() {
    // Generar oro
    const goldEarned = 20 + Math.floor(Math.random() * 15);
    this.player.gold += goldEarned;
    this.dom.reward.goldAmount.textContent = `+${goldEarned} 🪙 Monedas de Alquimista`;

    // Ofrecer 3 cartas elementales/conjuros para el mazo
    this.dom.reward.cardsContainer.innerHTML = '';
    const pool = [
      ELEMENTAL_CARDS.fire,
      ELEMENTAL_CARDS.water,
      ELEMENTAL_CARDS.earth,
      ELEMENTAL_CARDS.air,
      ELEMENTAL_CARDS.aether,
      ELEMENTAL_CARDS.void
    ];

    for (let i = 0; i < 3; i++) {
      const card = pool[Math.floor(Math.random() * pool.length)];
      const cardEl = document.createElement('div');
      cardEl.className = `alchemical-card rarity-${card.rarity} type-${card.type} element-${card.element}`;
      cardEl.innerHTML = `
        <div class="card-inner">
          <div class="card-cost">${card.cost}</div>
          <div class="card-art">${card.icon}</div>
          <div class="card-name">${card.name}</div>
          <div class="card-desc">${card.description}</div>
          <button class="btn-primary btn-add-reward">Añadir al Mazo</button>
        </div>
      `;

      cardEl.querySelector('.btn-add-reward').addEventListener('click', () => {
        this.player.masterDeck.push({ ...card });
        audio.playCardPlay();
        this.changeState(GAME_STATES.MAP);
      });

      this.dom.reward.cardsContainer.appendChild(cardEl);
    }
  }

  startRandomEvent() {
    const events = [
      {
        title: 'El Santuario de Mercurio Hermético',
        desc: 'Encuentras un altar humeante donde el mercurio líquido flota desafiando la gravedad. Una voz susurra pidiendo una ofrenda.',
        options: [
          {
            text: 'Ofrecer 20 de Oro para bendecir tu Éter (+1 Éter Máximo)',
            action: () => {
              if (this.player.gold >= 20) {
                this.player.gold -= 20;
                this.player.maxAether += 1;
                this.player.aether = this.player.maxAether;
                audio.playVictory();
                this.changeState(GAME_STATES.MAP);
              }
            }
          },
          {
            text: 'Tocar el mercurio arriesgando tu cuerpo (Pierde 8 HP, gana Piedra de Vacío)',
            action: () => {
              this.player.hp = Math.max(1, this.player.hp - 8);
              this.player.masterDeck.push({ ...ELEMENTAL_CARDS.void });
              audio.playFireImpact();
              this.changeState(GAME_STATES.MAP);
            }
          },
          {
            text: 'Ignorar el altar y continuar con precaución',
            action: () => this.changeState(GAME_STATES.MAP)
          }
        ]
      },
      {
        title: 'El Mercader Errante del Éter',
        desc: 'Un anciano encapuchado abre su carromato de frascos fosforescentes con una sonrisa enigmática.',
        options: [
          {
            text: 'Comprar la reliquia "Alambique de Mercurio" por 45 de Oro',
            action: () => {
              if (this.player.gold >= 45 && !this.player.hasRelic('relic_alembic')) {
                this.player.gold -= 45;
                this.player.relics.push({ ...RELICS_CATALOG[0] });
                audio.playVictory();
                this.changeState(GAME_STATES.MAP);
              }
            }
          },
          {
            text: 'Beber una poción experimental (Cura 15 HP)',
            action: () => {
              this.player.hp = Math.min(this.player.maxHp, this.player.hp + 15);
              audio.playHeal();
              this.changeState(GAME_STATES.MAP);
            }
          },
          {
            text: 'Seguir tu camino sin detenerte',
            action: () => this.changeState(GAME_STATES.MAP)
          }
        ]
      }
    ];

    this.currentEvent = events[Math.floor(Math.random() * events.length)];
    this.changeState(GAME_STATES.EVENT);
  }

  renderEventScreen() {
    if (!this.currentEvent) return;
    this.dom.event.title.textContent = this.currentEvent.title;
    this.dom.event.desc.textContent = this.currentEvent.desc;
    this.dom.event.optionsContainer.innerHTML = '';

    this.currentEvent.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'btn-secondary event-choice-btn';
      btn.textContent = opt.text;
      btn.addEventListener('click', () => opt.action());
      this.dom.event.optionsContainer.appendChild(btn);
    });
  }

  renderShopScreen() {
    this.dom.shop.itemsContainer.innerHTML = '';

    // Cartas en venta
    const cardsForSale = [
      { item: ELEMENTAL_CARDS.aether, price: 35 },
      { item: ELEMENTAL_CARDS.void, price: 30 },
      { item: ELEMENTAL_CARDS.fire, price: 20 },
      { item: ELEMENTAL_CARDS.water, price: 20 }
    ];

    cardsForSale.forEach(({ item, price }) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'shop-item-card';
      const affordable = this.player.gold >= price;

      cardEl.innerHTML = `
        <div class="shop-card-preview element-${item.element}">
          <span class="shop-card-icon">${item.icon}</span>
          <span class="shop-card-name">${item.name}</span>
          <p class="shop-card-desc">${item.description}</p>
        </div>
        <button class="btn-primary btn-buy ${affordable ? '' : 'disabled'}" ${affordable ? '' : 'disabled'}>
          Comprar por ${price} 🪙
        </button>
      `;

      cardEl.querySelector('.btn-buy').addEventListener('click', () => {
        if (this.player.gold >= price) {
          this.player.gold -= price;
          this.player.masterDeck.push({ ...item });
          audio.playCardPlay();
          this.updateHUD();
          this.renderShopScreen();
        }
      });

      this.dom.shop.itemsContainer.appendChild(cardEl);
    });

    // Reliquias en venta
    const unownedRelics = RELICS_CATALOG.filter(r => !this.player.hasRelic(r.id));
    if (unownedRelics.length > 0) {
      const relic = unownedRelics[0];
      const price = 55;
      const affordable = this.player.gold >= price;

      const relicEl = document.createElement('div');
      relicEl.className = 'shop-item-card';
      relicEl.innerHTML = `
        <div class="shop-card-preview">
          <span class="shop-card-icon">${relic.icon}</span>
          <span class="shop-card-name">${relic.name}</span>
          <p class="shop-card-desc">${relic.description}</p>
        </div>
        <button class="btn-primary btn-buy ${affordable ? '' : 'disabled'}" ${affordable ? '' : 'disabled'}>
          Comprar Reliquia (${price} 🪙)
        </button>
      `;

      relicEl.querySelector('.btn-buy').addEventListener('click', () => {
        if (this.player.gold >= price) {
          this.player.gold -= price;
          this.player.relics.push({ ...relic });
          audio.playVictory();
          this.updateHUD();
          this.renderShopScreen();
        }
      });

      this.dom.shop.itemsContainer.appendChild(relicEl);
    }
  }

  renderEndScreen(isVictory) {
    if (isVictory) {
      this.dom.end.title.textContent = '👑 ¡Transmutación Magistral Completada!';
      this.dom.end.title.className = 'end-title victory-title';
      this.dom.end.desc.textContent = 'Has derrotado al Archimago del Atanor Eterno y develado los secretos de la Piedra Filosofal. Eres proclamado Gran Maestro Alquimista del Reino del Éter.';
    } else {
      this.dom.end.title.textContent = '💀 Tu Obra Ha Sido Destruida';
      this.dom.end.title.className = 'end-title defeat-title';
      this.dom.end.desc.textContent = 'Tus esencias se dispersaron en la nada y tu cuerpo físico sucumbió ante los homúnculos. La alquimia es un sendero implacable, pero la materia siempre puede reorganizarse.';
    }
    // Borrar partida guardada al terminar
    localStorage.removeItem('aether_alchemy_save');
  }

  openDeckModal() {
    if (!this.dom.deckModal) return;
    this.dom.deckModalList.innerHTML = '';

    this.player.masterDeck.forEach(card => {
      const el = document.createElement('div');
      el.className = `alchemical-card rarity-${card.rarity} element-${card.element || 'neutral'}`;
      el.innerHTML = `
        <div class="card-inner">
          <div class="card-cost">${card.cost}</div>
          <div class="card-art">${card.icon}</div>
          <div class="card-name">${card.name}</div>
          <div class="card-desc">${card.description}</div>
        </div>
      `;
      this.dom.deckModalList.appendChild(el);
    });

    this.dom.deckModal.classList.remove('hidden');
  }

  closeDeckModal() {
    if (this.dom.deckModal) {
      this.dom.deckModal.classList.add('hidden');
    }
  }

  openRecipesModal() {
    if (!this.dom.recipesModal) return;
    this.dom.recipesModalList.innerHTML = '';

    TRANSMUTATION_RECIPES.forEach(recipe => {
      const row = document.createElement('div');
      row.className = 'recipe-entry-card';

      const ingIcons = recipe.ingredients.map(ing => {
        const c = ELEMENTAL_CARDS[ing];
        return `<span class="ing-pill">${c ? c.icon : '✨'} ${c ? c.name : ing}</span>`;
      }).join(' + ');

      row.innerHTML = `
        <div class="recipe-formula">${ingIcons} ➔ <strong>${recipe.result.icon} ${recipe.result.name}</strong></div>
        <p class="recipe-result-desc">${recipe.result.description}</p>
      `;

      this.dom.recipesModalList.appendChild(row);
    });

    this.dom.recipesModal.classList.remove('hidden');
  }

  closeRecipesModal() {
    if (this.dom.recipesModal) {
      this.dom.recipesModal.classList.add('hidden');
    }
  }

  saveGame() {
    const data = {
      player: {
        hp: this.player.hp,
        maxHp: this.player.maxHp,
        aether: this.player.aether,
        maxAether: this.player.maxAether,
        gold: this.player.gold,
        relics: this.player.relics,
        masterDeck: this.player.masterDeck
      },
      map: {
        nodes: this.adventureMap.nodes,
        currentNodeId: this.adventureMap.currentNodeId,
        currentFloor: this.adventureMap.currentFloor,
        floorsCount: this.adventureMap.floorsCount
      },
      state: this.state === GAME_STATES.COMBAT ? GAME_STATES.MAP : this.state
    };
    try {
      localStorage.setItem('aether_alchemy_save', JSON.stringify(data));
    } catch (e) {
      console.warn('No se pudo guardar la partida:', e);
    }
  }

  tryLoadSavedGame() {
    const saved = localStorage.getItem('aether_alchemy_save');
    if (saved && this.dom.btnContinue) {
      this.dom.btnContinue.classList.remove('hidden');
    }
  }

  loadGame() {
    try {
      const raw = localStorage.getItem('aether_alchemy_save');
      if (!raw) return;
      const data = JSON.parse(raw);

      this.player.hp = data.player.hp;
      this.player.maxHp = data.player.maxHp;
      this.player.aether = data.player.aether;
      this.player.maxAether = data.player.maxAether;
      this.player.gold = data.player.gold;
      this.player.relics = data.player.relics || [];
      this.player.masterDeck = data.player.masterDeck || [];

      this.adventureMap.nodes = data.map.nodes;
      this.adventureMap.currentNodeId = data.map.currentNodeId;
      this.adventureMap.currentFloor = data.map.currentFloor;
      this.adventureMap.floorsCount = data.map.floorsCount;

      this.changeState(data.state || GAME_STATES.MAP);
    } catch (e) {
      console.error('Error cargando partida guardada:', e);
      this.startNewRun();
    }
  }
}

// Inicialización automática
window.addEventListener('DOMContentLoaded', () => {
  const game = new GameApp();
  game.init();
  window.AetherGame = game;
});
