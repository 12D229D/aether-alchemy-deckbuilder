// Generador Procedimental de Árbol de Nodos de Aventura (Estilo Slay the Spire / FTL)

export const NODE_TYPES = {
  COMBAT: {
    type: 'combat',
    name: 'Combate Elemental',
    icon: '⚔️',
    color: '#ef4444',
    desc: 'Criaturas menores y homúnculos descarriados.'
  },
  ELITE: {
    type: 'elite',
    name: 'Encuentro Élite',
    icon: '👹',
    color: '#f97316',
    desc: 'Peligrosos seres arcanos. Otorga valiosas reliquias y oro.'
  },
  EVENT: {
    type: 'event',
    name: 'Evento Alquímico',
    icon: '❓',
    color: '#8b5cf6',
    desc: 'Un cruce misterioso donde tomar decisiones de transmutación.'
  },
  SHOP: {
    type: 'shop',
    name: 'Bazar de Transmutación',
    icon: '🪙',
    color: '#eab308',
    desc: 'Comercia con alquimistas errantes por cartas, reliquias y pociones.'
  },
  REST: {
    type: 'rest',
    name: 'Atanor de Descanso',
    icon: '🔥',
    color: '#10b981',
    desc: 'Reposa para sanar tus heridas o forjar una nueva receta de mazo.'
  },
  BOSS: {
    type: 'boss',
    name: 'Guardián del Atanor',
    icon: '👑',
    color: '#dc2626',
    desc: 'El desafío definitivo del reino elemental.'
  }
};

export class AdventureMap {
  constructor(floorsCount = 8) {
    this.floorsCount = floorsCount;
    this.nodes = [];
    this.currentNodeId = null;
    this.currentFloor = 0;
  }

  generateMap() {
    this.nodes = [];
    const widthPerFloor = 3;

    // Piso 0: 3 nodos iniciales de combate
    const startNodes = [];
    for (let col = 0; col < widthPerFloor; col++) {
      startNodes.push({
        id: `node_0_${col}`,
        floor: 0,
        col: col,
        ...NODE_TYPES.COMBAT,
        status: 'available', // 'locked' | 'available' | 'visited'
        connections: []
      });
    }
    this.nodes.push(startNodes);

    // Pisos intermedios
    for (let f = 1; f < this.floorsCount - 1; f++) {
      const floorNodes = [];
      for (let col = 0; col < widthPerFloor; col++) {
        const rand = Math.random();
        let selectedType = NODE_TYPES.COMBAT;

        if (f === 3 || f === 5) {
          if (rand < 0.4) selectedType = NODE_TYPES.ELITE;
          else if (rand < 0.7) selectedType = NODE_TYPES.EVENT;
          else selectedType = NODE_TYPES.SHOP;
        } else if (f === this.floorsCount - 2) {
          // Último piso antes del Boss siempre es de Descanso
          selectedType = NODE_TYPES.REST;
        } else {
          if (rand < 0.45) selectedType = NODE_TYPES.COMBAT;
          else if (rand < 0.7) selectedType = NODE_TYPES.EVENT;
          else if (rand < 0.85) selectedType = NODE_TYPES.SHOP;
          else selectedType = NODE_TYPES.REST;
        }

        floorNodes.push({
          id: `node_${f}_${col}`,
          floor: f,
          col: col,
          ...selectedType,
          status: 'locked',
          connections: []
        });
      }
      this.nodes.push(floorNodes);
    }

    // Piso Final: Boss Node único
    const bossFloor = this.floorsCount - 1;
    const bossNode = {
      id: `node_${bossFloor}_1`,
      floor: bossFloor,
      col: 1,
      ...NODE_TYPES.BOSS,
      status: 'locked',
      connections: []
    };
    this.nodes.push([bossNode]);

    // Generar conexiones lógicas entre pisos
    for (let f = 0; f < this.nodes.length - 1; f++) {
      const currentLayer = this.nodes[f];
      const nextLayer = this.nodes[f + 1];

      currentLayer.forEach(node => {
        if (nextLayer.length === 1) {
          // Si el siguiente es el Boss único, todos convergen
          node.connections.push(nextLayer[0].id);
        } else {
          // Conectar con nodos de columna adyacente o misma columna
          nextLayer.forEach(nextNode => {
            if (Math.abs(node.col - nextNode.col) <= 1) {
              node.connections.push(nextNode.id);
            }
          });
          // Asegurar al menos una conexión si quedó huérfana
          if (node.connections.length === 0) {
            node.connections.push(nextLayer[0].id);
          }
        }
      });
    }

    this.currentFloor = 0;
    this.currentNodeId = null;
    return this.nodes;
  }

  getAvailableNodes() {
    if (!this.currentNodeId) {
      // Al inicio, todos los nodos del piso 0 están disponibles
      return this.nodes[0] || [];
    }

    // Buscar el nodo actual y retornar sus conexiones
    let currentNode = null;
    for (const floor of this.nodes) {
      const found = floor.find(n => n.id === this.currentNodeId);
      if (found) {
        currentNode = found;
        break;
      }
    }

    if (!currentNode) return [];

    const availableIds = new Set(currentNode.connections);
    const available = [];
    for (const floor of this.nodes) {
      for (const node of floor) {
        if (availableIds.has(node.id)) {
          available.push(node);
        }
      }
    }
    return available;
  }

  visitNode(nodeId) {
    for (const floor of this.nodes) {
      for (const node of floor) {
        if (node.id === nodeId) {
          node.status = 'visited';
          this.currentNodeId = nodeId;
          this.currentFloor = node.floor;
        } else if (node.status === 'available') {
          node.status = 'locked';
        }
      }
    }

    // Habilitar siguientes nodos conectados
    const nextAvailable = this.getAvailableNodes();
    nextAvailable.forEach(n => {
      n.status = 'available';
    });

    return this.getNodeById(nodeId);
  }

  getNodeById(nodeId) {
    for (const floor of this.nodes) {
      const n = floor.find(x => x.id === nodeId);
      if (n) return n;
    }
    return null;
  }
}
