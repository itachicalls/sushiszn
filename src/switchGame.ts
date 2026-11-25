export type GameId = 'sushi' | 'boba' | 'crush';

let launch: ((id: GameId) => void) | null = null;

export function registerLauncher(fn: (id: GameId) => void): void {
  launch = fn;
}

/** Swap the running game. Sushi Szn, Boba Hour, and Sushi Crush share this page. */
export function openGame(id: GameId): void {
  launch?.(id);
}
