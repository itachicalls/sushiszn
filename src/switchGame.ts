export type GameId = 'sushi' | 'boba';

let launch: ((id: GameId) => void) | null = null;

export function registerLauncher(fn: (id: GameId) => void): void {
  launch = fn;
}

/** Swap the running game. Sushi Szn and Boba Hour share this page. */
export function openGame(id: GameId): void {
  launch?.(id);
}
