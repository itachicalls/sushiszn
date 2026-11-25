import { Board, COLS, ROWS, type Pos, type Tile } from '../src/crush/systems/board.ts';
import { TOTAL_LEVELS, getLevel } from '../src/crush/config/levels.ts';

function assert(cond: unknown, message: string): void {
  if (!cond) throw new Error(message);
}

const KINDS = ['salmon', 'tuna', 'tamago', 'onigiri'];

function paint(board: Board): void {
  let id = 1000;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = board.cells[r][c];
      cell.crust = 0;
      cell.crustId = 0;
      cell.jelly = false;
      cell.fuse = 0;
      cell.tile = { id, kind: KINDS[(c + r * 2) % KINDS.length], special: 'none' };
      id += 1;
    }
  }
}

function setTile(board: Board, c: number, r: number, kind: string, special: Tile['special'] = 'none'): number {
  const id = 5000 + r * COLS + c;
  board.cells[r][c].tile = { id, kind, special };
  board.cells[r][c].crust = 0;
  board.cells[r][c].crustId = 0;
  return id;
}

function run(): void {
  for (let id = 1; id <= TOTAL_LEVELS; id++) {
    const level = getLevel(id);
    const board = new Board(level);
    assert(!board.hasMatch(), `level ${id} starts with a match`);
    assert(board.possibleMove(), `level ${id} has no move`);
    assert(board.movesLeft === level.moves, `level ${id} move count`);
    if (level.goal.type === 'crust') assert(board.countCrust() > 0, `level ${id} crust goal is empty`);
    if (level.goal.type === 'jelly') assert(board.countJelly() > 0, `level ${id} jelly goal is empty`);
    if (level.goal.type === 'fuse') assert(board.countFuse() > 0, `level ${id} fuse goal is empty`);
    const sushi = ['salmon', 'tuna', 'tamago', 'onigiri', 'maki'];
    const boba = ['taro', 'sugar', 'mango', 'berry', 'lychee'];
    assert(level.kinds.some((kind) => sushi.includes(kind)), `level ${id} is missing sushi`);
    assert(level.kinds.some((kind) => boba.includes(kind)), `level ${id} is missing boba`);
    if (level.goal.type === 'collect') {
      assert(level.kinds.includes(level.goal.kind), `level ${id} collects a missing kind`);
    }
  }

  const board = new Board(getLevel(1));
  paint(board);
  board.score = 0;
  const beforeMoves = board.movesLeft;
  setTile(board, 0, 0, 'salmon');
  setTile(board, 1, 0, 'salmon');
  setTile(board, 2, 0, 'tuna');
  setTile(board, 3, 0, 'salmon');
  const reverted = board.swap({ c: 0, r: 0 }, { c: 0, r: 1 });
  assert(reverted?.reverted, 'bad swap should revert');
  assert(board.movesLeft === beforeMoves, 'reverted swap spends a move');

  const match = board.swap({ c: 2, r: 0 }, { c: 3, r: 0 });
  assert(match && !match.reverted, 'line of 3 should clear');
  assert(match.frames[0].pops.length >= 3, 'line of 3 pops three tiles');
  assert(board.score > 0, 'match scores');
  assert(board.movesLeft === beforeMoves - 1, 'match spends one move');

  paint(board);
  setTile(board, 0, 0, 'salmon');
  setTile(board, 1, 0, 'salmon');
  setTile(board, 2, 0, 'salmon');
  setTile(board, 3, 0, 'tuna');
  setTile(board, 4, 0, 'salmon');
  const four = board.swap({ c: 3, r: 0 }, { c: 4, r: 0 });
  assert(four && four.frames[0].born.some((item) => item.tile.special === 'col'), '4-match makes a column stripe');

  paint(board);
  for (const c of [0, 1, 2, 3, 5]) setTile(board, c, 0, 'salmon');
  setTile(board, 4, 0, 'tuna');
  const five = board.swap({ c: 4, r: 0 }, { c: 5, r: 0 });
  assert(five && five.frames[0].born.some((item) => item.tile.special === 'color'), '5-match makes a color bomb');

  paint(board);
  setTile(board, 0, 0, 'salmon');
  setTile(board, 1, 0, 'salmon');
  setTile(board, 2, 0, 'tuna');
  setTile(board, 3, 0, 'salmon');
  setTile(board, 2, 1, 'salmon');
  setTile(board, 2, 2, 'salmon');
  setTile(board, 2, 3, 'tuna');
  const elbow = board.swap({ c: 2, r: 0 }, { c: 3, r: 0 });
  assert(elbow && elbow.frames[0].born.some((item) => item.tile.special === 'bomb'), 'L match makes a wrapper');

  paint(board);
  board.cells[0][1].jelly = true;
  board.cells[0][3].crust = 1;
  board.cells[0][3].crustId = -9;
  board.cells[0][3].tile = null;
  board.cells[5][5].fuse = 4;
  setTile(board, 0, 0, 'salmon');
  setTile(board, 1, 0, 'salmon');
  setTile(board, 2, 0, 'tuna');
  const cleared = board.swap({ c: 2, r: 0 }, { c: 2, r: 1 });
  assert(cleared && cleared.frames[0].jellyCleared.some((p: Pos) => p.c === 1 && p.r === 0), 'match clears jelly');
  assert(board.countCrust() === 0, 'adjacent match melts crust');
  assert(board.cells[5][5].fuse === 4, 'unmatched fuse waits for the tick');
  const expiredStart = board.tickFuses();
  assert(expiredStart.length === 0 && board.cells[5][5].fuse === 3, 'fuse ticks down');

  paint(board);
  let tuna = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if ((c + r) % 3 === 0) {
        setTile(board, c, r, 'tuna');
        tuna += 1;
      }
    }
  }
  setTile(board, 0, 0, 'salmon', 'color');
  setTile(board, 1, 0, 'tuna');
  tuna += 1;
  const color = board.swap({ c: 0, r: 0 }, { c: 1, r: 0 });
  const poppedTuna = color?.frames[0].pops.filter((pop) => pop.kind === 'tuna').length ?? 0;
  assert(poppedTuna >= tuna - 1, `color bomb clears tuna (${poppedTuna} vs ${tuna})`);

  const lesson = new Board(getLevel(1));
  let guard = 0;
  while (!lesson.won() && lesson.movesLeft > 0 && guard++ < 40) {
    const move = lesson.possibleMove();
    if (!move) break;
    const result = lesson.swap(move[0], move[1]);
    assert(result && !result.reverted, 'hint move should clear');
    if (lesson.won()) break;
    assert(lesson.tickFuses().length === 0, 'level 1 has no fuses');
  }
  assert(lesson.won(), `level 1 should be winnable, score ${lesson.score}`);

  console.log(`ok ${TOTAL_LEVELS} levels, matches, specials, obstacles, level 1 bot score ${lesson.score}`);
}

run();
