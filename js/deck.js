// Lógica de Mazo, Robo, Mano, Descarte y Desvanecimiento (Exhaust)
import { audio } from './audio.js';

export const CARD_TYPES = {
  ELEMENT: 'element',
  SPELL: 'spell',
  TRANSMUTED: 'transmuted',
  CURSE: 'curse'
};

export const ELEMENTS = {
  FIRE: 'fire',
  WATER: 'water',
  EARTH: 'earth',
  AIR: 'air',
  AETHER: 'aether',
  VOID: 'void'
};

export class DeckManager {
  constructor() {
    this.drawPile = [];
    this.hand = [];
    this.discardPile = [];
    this.exhaustPile = [];
    this.maxHandSize = 8;
  }

  // Inicializa el mazo de robo a partir de una lista de cartas del jugador
  initCombatDeck(masterDeck) {
    this.drawPile = masterDeck.map((card, idx) => ({
      ...card,
      instanceId: `card_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`
    }));
    this.shuffle(this.drawPile);
    this.hand = [];
    this.discardPile = [];
    this.exhaustPile = [];
  }

  // Barajar array (Fisher-Yates)
  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Robar N cartas
  draw(count = 1) {
    const drawn = [];
    for (let i = 0; i < count; i++) {
      if (this.hand.length >= this.maxHandSize) {
        break; // Mano llena
      }

      if (this.drawPile.length === 0) {
        if (this.discardPile.length === 0) {
          break; // No hay más cartas disponibles
        }
        // Reciclar la pila de descarte en el mazo de robo
        this.drawPile = [...this.discardPile];
        this.discardPile = [];
        this.shuffle(this.drawPile);
      }

      const card = this.drawPile.pop();
      if (card) {
        this.hand.push(card);
        drawn.push(card);
        audio.playCardDraw();
      }
    }
    return drawn;
  }

  // Jugar una carta de la mano
  playCard(instanceId) {
    const cardIndex = this.hand.findIndex(c => c.instanceId === instanceId);
    if (cardIndex === -1) return null;

    const [card] = this.hand.splice(cardIndex, 1);

    if (card.exhaust || card.type === CARD_TYPES.TRANSMUTED) {
      // Las cartas transmutadas efímeras o con exhaust van al mazo de agotadas
      this.exhaustPile.push(card);
    } else {
      this.discardPile.push(card);
    }
    audio.playCardPlay();
    return card;
  }

  // Remover carta de la mano para fusión en el crisol
  removeFromHand(instanceId) {
    const cardIndex = this.hand.findIndex(c => c.instanceId === instanceId);
    if (cardIndex === -1) return null;
    return this.hand.splice(cardIndex, 1)[0];
  }

  // Agregar carta sintetizada directamente a la mano
  addToHand(card) {
    const newCard = {
      ...card,
      instanceId: `card_syn_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    };
    if (this.hand.length < this.maxHandSize) {
      this.hand.push(newCard);
    } else {
      this.discardPile.push(newCard);
    }
    return newCard;
  }

  // Devolver carta a la mano (si se cancela crisol)
  returnToHand(card) {
    this.hand.push(card);
  }

  // Fin del turno: descartar la mano no retenida
  discardHand() {
    while (this.hand.length > 0) {
      const card = this.hand.pop();
      if (card.retain) {
        // Carta con retención permanece
        continue;
      }
      if (card.ephemeral) {
        this.exhaustPile.push(card);
      } else {
        this.discardPile.push(card);
      }
    }
  }

  getStats() {
    return {
      drawCount: this.drawPile.length,
      handCount: this.hand.length,
      discardCount: this.discardPile.length,
      exhaustCount: this.exhaustPile.length
    };
  }
}
