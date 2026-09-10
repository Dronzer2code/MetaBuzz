import { ActivePlayers } from 'boardgame.io/core';

function resetBuzzers(G) {
  G.queue = {};
}

function resetBuzzer(G, ctx, id) {
  const newQueue = { ...G.queue };
  delete newQueue[id];
  G.queue = newQueue;
}

function toggleLock(G) {
  G.locked = !G.locked;
}

function activateBuzzer(G) {
  G.locked = false;
}

function deactivateBuzzer(G) {
  G.locked = true;
}

function resetAndActivate(G) {
  G.queue = {};
  G.locked = false;
}

function resetAndDeactivate(G) {
  G.queue = {};
  G.locked = true;
}

function buzz(G, ctx, id) {
  if (G.locked) {
    return;
  }
  const newQueue = {
    ...G.queue,
  };
  if (!newQueue[id]) {
    // buzz on server will overwrite the client provided timestamp
    newQueue[id] = { id, timestamp: new Date().getTime() };
  }
  G.queue = newQueue;
}

export const Buzzer = {
  name: 'buzzer',
  minPlayers: 2,
  maxPlayers: 150,
  setup: () => ({ queue: {}, locked: true }),
  phases: {
    play: {
      start: true,
      moves: {
        buzz,
        resetBuzzer,
        resetBuzzers,
        toggleLock,
        activateBuzzer,
        deactivateBuzzer,
        resetAndActivate,
        resetAndDeactivate,
      },
      turn: {
        activePlayers: ActivePlayers.ALL,
      },
    },
  },
};
