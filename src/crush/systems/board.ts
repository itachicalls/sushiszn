export const COLS = 8;
export const ROWS = 8;

export type Special = 'none' | 'row' | 'col' | 'bomb' | 'color';
export type Fx = 'pop' | 'row' | 'col' | 'bomb' | 'color';

export interface Tile {
  id: number;
  kind: string;
  special: Special;
}

export interface Cell {
  tile: Tile | null;
  crust: number;
  crustId: number;
  jelly: boolean;
  fuse: number;
}

export interface Pos {
  c: number;
  r: number;
}

export type Goal =
  | { type: 'score'; target: number }
  | { type: 'collect'; kind: string; target: number }
  | { type: 'jelly' }
  | { type: 'crust' }
  | { type: 'fuse' };

export interface LevelRecipe {
  kinds: string[];
  moves: number;
  goal: Goal;
  crust: number;
  crustHp: number;
  jelly: number;
  fuses: number;
  fuseTimer: number;
  seed: number;
}

export interface Pop {
  c: number;
  r: number;
  id: number;
  kind: string;
  special: Special;
  fx: Fx;
}

export interface Fall {
  id: number;
  kind: string;
  special: Special;
  fromC: number;
  fromR: number;
  toC: number;
  toR: number;
  spawn: boolean;
}

export interface CrustHit {
  id: number;
  c: number;
  r: number;
  left: number;
}

export interface Born {
  c: number;
  r: number;
  tile: Tile;
}

export interface Frame {
  pops: Pop[];
  born: Born[];
  falls: Fall[];
  crustHits: CrustHit[];
  jellyCleared: Pos[];
  fusesCleared: Pos[];
  scoreGain: number;
  combo: number;
}

export interface SwapResult {
  frames: Frame[];
  reverted: boolean;
}

interface Seed {
  c: number;
  r: number;
  power: number;
  force?: Fx;
}

interface Run {
  cells: Pos[];
  horizontal: boolean;
  kind: string;
}

interface Group {
  cells: Pos[];
  runs: Run[];
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function keyOf(p: Pos): string {
  return `${p.c},${p.r}`;
}

function findRuns(cells: Cell[][]): Run[] {
  const runs: Run[] = [];
  const kindAt = (c: number, r: number): string | null => {
    const tile = cells[r][c].tile;
    if (!tile || tile.special === 'color') return null;
    return tile.kind;
  };
  for (let r = 0; r < ROWS; r++) {
    let start = 0;
    for (let c = 1; c <= COLS; c++) {
      const prev = kindAt(c - 1, r);
      const cur = c < COLS ? kindAt(c, r) : null;
      if (cur !== prev) {
        if (prev && c - start >= 3) {
          const line: Pos[] = [];
          for (let i = start; i < c; i++) line.push({ c: i, r });
          runs.push({ cells: line, horizontal: true, kind: prev });
        }
        start = c;
      }
    }
  }
  for (let c = 0; c < COLS; c++) {
    let start = 0;
    for (let r = 1; r <= ROWS; r++) {
      const prev = kindAt(c, r - 1);
      const cur = r < ROWS ? kindAt(c, r) : null;
      if (cur !== prev) {
        if (prev && r - start >= 3) {
          const line: Pos[] = [];
          for (let i = start; i < r; i++) line.push({ c, r: i });
          runs.push({ cells: line, horizontal: false, kind: prev });
        }
        start = r;
      }
    }
  }
  return runs;
}

function findGroups(cells: Cell[][]): Group[] {
  const runs = findRuns(cells);
  if (runs.length === 0) return [];
  const parent = new Map<string, string>();
  const find = (k: string): string => {
    let p = parent.get(k) ?? k;
    if (p !== k) {
      p = find(p);
      parent.set(k, p);
    }
    return p;
  };
  const union = (a: string, b: string) => {
    const pa = find(a);
    const pb = find(b);
    if (pa !== pb) parent.set(pa, pb);
  };
  for (const run of runs) {
    const first = keyOf(run.cells[0]);
    if (!parent.has(first)) parent.set(first, first);
    for (let i = 1; i < run.cells.length; i++) {
      const k = keyOf(run.cells[i]);
      if (!parent.has(k)) parent.set(k, k);
      union(first, k);
    }
  }
  const groups = new Map<string, Group>();
  for (const run of runs) {
    const root = find(keyOf(run.cells[0]));
    let group = groups.get(root);
    if (!group) {
      group = { cells: [], runs: [] };
      groups.set(root, group);
    }
    group.runs.push(run);
    for (const p of run.cells) {
      if (!group.cells.some((q) => q.c === p.c && q.r === p.r)) group.cells.push(p);
    }
  }
  return [...groups.values()];
}

export class Board {
  readonly cells: Cell[][];
  score = 0;
  movesLeft: number;
  collected: Record<string, number> = {};
  jellyTotal = 0;
  crustTotal = 0;
  fuseTotal = 0;

  readonly level: LevelRecipe;
  private rng: () => number;
  private nextId = 1;
  private nextCrust = -1;
  private lastSwap: Pos[] = [];

  constructor(level: LevelRecipe) {
    this.level = level;
    this.rng = mulberry32(level.seed);
    this.movesLeft = level.moves;
    this.cells = [];
    for (let r = 0; r < ROWS; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < COLS; c++) {
        row.push({ tile: null, crust: 0, crustId: 0, jelly: false, fuse: 0 });
      }
      this.cells.push(row);
    }
    this.fill();
    this.placeObstacles();
    if (this.hasMatch() || !this.possibleMove()) this.reshuffle();
    this.ensurePlayable();
    this.jellyTotal = this.countJelly();
    this.crustTotal = this.countCrust();
    this.fuseTotal = this.countFuse();
  }

  hasMatch(): boolean {
    return findRuns(this.cells).length > 0;
  }

  canSwap(p: Pos): boolean {
    if (!this.inBounds(p)) return false;
    const cell = this.cells[p.r][p.c];
    return !!cell.tile && cell.crust <= 0;
  }

  swap(a: Pos, b: Pos): SwapResult | null {
    if (!this.canSwap(a) || !this.canSwap(b)) return null;
    if (Math.abs(a.c - b.c) + Math.abs(a.r - b.r) !== 1) return null;

    this.exchange(a, b);
    this.lastSwap = [a, b];
    const ta = this.cells[a.r][a.c].tile!;
    const tb = this.cells[b.r][b.c].tile!;

    let frames: Frame[];
    if (ta.special === 'color' || tb.special === 'color') {
      frames = [this.colorFrame(a, b, 1), ...this.resolve(2)];
    } else if (ta.special !== 'none' && tb.special !== 'none') {
      frames = [this.comboFrame(a, b, 1), ...this.resolve(2)];
    } else if (findRuns(this.cells).length === 0) {
      this.exchange(a, b);
      this.lastSwap = [];
      return { frames: [], reverted: true };
    } else {
      frames = this.resolve(1);
    }

    this.movesLeft -= 1;
    this.lastSwap = [];
    return { frames, reverted: false };
  }

  /** Spend leftover moves as stripe and wrapper blasts. */
  sugarRush(): Frame[] {
    const lumps = Math.max(0, this.movesLeft - 6);
    this.score += lumps * 280;
    const bursts = this.movesLeft - lumps;
    this.movesLeft = 0;
    const frames: Frame[] = [];
    for (let i = 0; i < bursts; i++) {
      const spots = this.tileSpots();
      if (spots.length === 0) break;
      const p = spots[Math.floor(this.rng() * spots.length)];
      const tile = this.cells[p.r][p.c].tile;
      if (!tile) break;
      tile.special = i % 2 === 0 ? 'row' : 'bomb';
      frames.push(this.finishFrame([{ c: p.c, r: p.r, power: 2 }], [], i + 1));
      frames.push(...this.resolve(i + 2));
    }
    return frames.filter((frame) => frame.pops.length > 0 || frame.falls.length > 0 || frame.scoreGain > 0);
  }

  won(): boolean {
    const goal = this.level.goal;
    if (goal.type === 'score') return this.score >= goal.target;
    if (goal.type === 'collect') return (this.collected[goal.kind] ?? 0) >= goal.target;
    if (goal.type === 'jelly') return this.countJelly() === 0;
    if (goal.type === 'crust') return this.countCrust() === 0;
    return this.countFuse() === 0;
  }

  tickFuses(): Pos[] {
    const expired: Pos[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = this.cells[r][c];
        if (cell.fuse <= 0) continue;
        cell.fuse -= 1;
        if (cell.fuse <= 0) {
          cell.fuse = 0;
          expired.push({ c, r });
        }
      }
    }
    return expired;
  }

  possibleMove(): [Pos, Pos] | null {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const here = { c, r };
        if (!this.canSwap(here)) continue;
        const neighbors = [
          { c: c + 1, r },
          { c, r: r + 1 },
        ];
        for (const next of neighbors) {
          if (!this.canSwap(next)) continue;
          if (this.wouldClear(here, next)) return [here, next];
        }
      }
    }
    return null;
  }

  reshuffle(): void {
    for (let attempt = 0; attempt < 30; attempt++) {
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const cell = this.cells[r][c];
          if (!cell.tile) continue;
          cell.tile.kind = this.pickKind(c, r);
          cell.tile.special = 'none';
        }
      }
      if (!this.hasMatch() && this.possibleMove()) return;
    }
  }

  goalProgress(): { current: number; total: number } {
    const goal = this.level.goal;
    if (goal.type === 'score') return { current: Math.min(this.score, goal.target), total: goal.target };
    if (goal.type === 'collect') {
      return { current: Math.min(this.collected[goal.kind] ?? 0, goal.target), total: goal.target };
    }
    if (goal.type === 'jelly') return { current: this.jellyTotal - this.countJelly(), total: this.jellyTotal };
    if (goal.type === 'crust') return { current: this.crustTotal - this.countCrust(), total: this.crustTotal };
    return { current: this.fuseTotal - this.countFuse(), total: this.fuseTotal };
  }

  countJelly(): number {
    return this.cells.flat().filter((cell) => cell.jelly).length;
  }

  countCrust(): number {
    return this.cells.flat().filter((cell) => cell.crust > 0).length;
  }

  countFuse(): number {
    return this.cells.flat().filter((cell) => cell.fuse > 0).length;
  }

  private ensurePlayable(): void {
    if (this.possibleMove()) return;
    for (let r = 0; r < ROWS && !this.possibleMove(); r++) {
      for (let c = 0; c < COLS && !this.possibleMove(); c++) {
        const cell = this.cells[r][c];
        if (cell.crust <= 0) continue;
        cell.crust = 0;
        cell.crustId = 0;
        cell.tile = this.makeTile(this.pickKind(c, r));
      }
    }
    if (this.hasMatch() || !this.possibleMove()) this.reshuffle();
  }

  private fill(): void {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        this.cells[r][c].tile = this.makeTile(this.pickKind(c, r));
      }
    }
  }

  private placeObstacles(): void {
    const spots = (): Pos[] => {
      const list: Pos[] = [];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (this.cells[r][c].tile) list.push({ c, r });
        }
      }
      return this.shuffle(list);
    };

    let crustLeft = this.level.crust;
    const perCol = new Array<number>(COLS).fill(0);
    for (const p of spots()) {
      if (crustLeft <= 0) break;
      if (perCol[p.c] >= 3) continue;
      const cell = this.cells[p.r][p.c];
      cell.tile = null;
      cell.fuse = 0;
      cell.crust = this.level.crustHp;
      cell.crustId = this.nextCrust;
      this.nextCrust -= 1;
      perCol[p.c] += 1;
      crustLeft -= 1;
    }

    let jellyLeft = this.level.jelly;
    for (const p of spots()) {
      if (jellyLeft <= 0) break;
      this.cells[p.r][p.c].jelly = true;
      jellyLeft -= 1;
    }

    let fuseLeft = this.level.fuses;
    for (const p of spots()) {
      if (fuseLeft <= 0) break;
      this.cells[p.r][p.c].fuse = this.level.fuseTimer;
      fuseLeft -= 1;
    }
  }

  private wouldClear(a: Pos, b: Pos): boolean {
    const copy = this.cells.map((row) =>
      row.map((cell) => ({
        ...cell,
        tile: cell.tile ? { ...cell.tile } : null,
      })),
    );
    const ca = copy[a.r][a.c];
    const cb = copy[b.r][b.c];
    const tile = ca.tile;
    const fuse = ca.fuse;
    ca.tile = cb.tile;
    ca.fuse = cb.fuse;
    cb.tile = tile;
    cb.fuse = fuse;
    const ta = ca.tile;
    const tb = cb.tile;
    if (!ta || !tb) return false;
    if (ta.special === 'color' || tb.special === 'color') return true;
    if (ta.special !== 'none' && tb.special !== 'none') return true;
    return findRuns(copy).length > 0;
  }

  private resolve(comboStart: number): Frame[] {
    const frames: Frame[] = [];
    let combo = comboStart;
    for (let guard = 0; guard < 30; guard++) {
      const groups = findGroups(this.cells);
      if (groups.length === 0) break;
      frames.push(this.matchFrame(groups, combo));
      combo += 1;
    }
    return frames;
  }

  private matchFrame(groups: Group[], combo: number): Frame {
    const born: Born[] = [];
    const seeds: Seed[] = [];
    for (const group of groups) {
      const special = this.specialFor(group);
      if (special) {
        const pivot = this.pickPivot(group);
        const kind = this.cells[pivot.r][pivot.c].tile?.kind ?? group.runs[0].kind;
        born.push({
          c: pivot.c,
          r: pivot.r,
          tile: { id: this.nextId++, kind, special },
        });
      }
      for (const p of group.cells) seeds.push({ c: p.c, r: p.r, power: 1 });
    }
    return this.finishFrame(seeds, born, combo);
  }

  private specialFor(group: Group): Special | null {
    const longest = Math.max(...group.runs.map((run) => run.cells.length));
    if (longest >= 5) return 'color';
    const horizontal = new Set<string>();
    const vertical = new Set<string>();
    for (const run of group.runs) {
      const bag = run.horizontal ? horizontal : vertical;
      for (const p of run.cells) bag.add(keyOf(p));
    }
    for (const p of group.cells) {
      if (horizontal.has(keyOf(p)) && vertical.has(keyOf(p))) return 'bomb';
    }
    if (longest === 4) {
      const run = group.runs.find((item) => item.cells.length === 4) ?? group.runs[0];
      return run.horizontal ? 'col' : 'row';
    }
    return null;
  }

  private pickPivot(group: Group): Pos {
    for (const p of this.lastSwap) {
      if (group.cells.some((q) => q.c === p.c && q.r === p.r)) return p;
    }
    let best = group.runs[0];
    for (const run of group.runs) {
      if (run.cells.length > best.cells.length) best = run;
    }
    return best.cells[Math.floor(best.cells.length / 2)];
  }

  private colorFrame(a: Pos, b: Pos, combo: number): Frame {
    const ta = this.cells[a.r][a.c].tile!;
    const colorPos = ta.special === 'color' ? a : b;
    const otherPos = ta.special === 'color' ? b : a;
    const other = this.cells[otherPos.r][otherPos.c].tile!;
    const seeds: Seed[] = [];

    if (other.special === 'color') {
      for (const p of this.tileSpots()) seeds.push({ c: p.c, r: p.r, power: 2 });
    } else if (other.special === 'none') {
      seeds.push({ c: colorPos.c, r: colorPos.r, power: 2 });
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const tile = this.cells[r][c].tile;
          if (tile && tile.kind === other.kind) seeds.push({ c, r, power: 2 });
        }
      }
    } else {
      const fx: Fx = other.special;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const tile = this.cells[r][c].tile;
          const isColor = c === colorPos.c && r === colorPos.r;
          if (!tile || (!isColor && tile.kind !== other.kind)) continue;
          tile.special = fx;
          seeds.push({ c, r, power: 2, force: fx });
        }
      }
    }
    return this.finishFrame(seeds, [], combo);
  }

  private comboFrame(a: Pos, b: Pos, combo: number): Frame {
    const sa = this.cells[a.r][a.c].tile!.special;
    const sb = this.cells[b.r][b.c].tile!.special;
    const seeds: Seed[] = [];
    const addLine = (c: number, r: number, orientation: 'row' | 'col') => {
      if (orientation === 'row') {
        if (r < 0 || r >= ROWS) return;
        for (let i = 0; i < COLS; i++) seeds.push({ c: i, r, power: 2 });
      } else {
        if (c < 0 || c >= COLS) return;
        for (let i = 0; i < ROWS; i++) seeds.push({ c, r: i, power: 2 });
      }
    };
    const addBox = (c: number, r: number, rad: number) => {
      for (let dr = -rad; dr <= rad; dr++) {
        for (let dc = -rad; dc <= rad; dc++) seeds.push({ c: c + dc, r: r + dr, power: 2 });
      }
    };
    const stripe = (s: Special) => s === 'row' || s === 'col';
    if (stripe(sa) && stripe(sb)) {
      addLine(a.c, a.r, 'row');
      addLine(a.c, a.r, 'col');
      addLine(b.c, b.r, 'row');
      addLine(b.c, b.r, 'col');
    } else if ((sa === 'bomb' && stripe(sb)) || (sb === 'bomb' && stripe(sa))) {
      const orient = stripe(sa) ? sa : sb;
      const pos = stripe(sa) ? a : b;
      for (let d = -1; d <= 1; d++) {
        if (orient === 'row') addLine(pos.c, pos.r + d, 'row');
        else addLine(pos.c + d, pos.r, 'col');
      }
    } else {
      addBox(a.c, a.r, 2);
      addBox(b.c, b.r, 2);
    }
    return this.finishFrame(seeds, [], combo);
  }

  private finishFrame(seeds: Seed[], born: Born[], combo: number): Frame {
    const det = this.detonate(seeds);
    for (const item of born) {
      const cell = this.cells[item.r][item.c];
      cell.tile = item.tile;
      cell.fuse = 0;
    }
    const falls = this.gravity();
    const scoreGain = (det.pops.length * 50 + born.length * 100) * combo;
    this.score += scoreGain;
    for (const pop of det.pops) {
      this.collected[pop.kind] = (this.collected[pop.kind] ?? 0) + 1;
    }
    return {
      pops: det.pops,
      born,
      falls,
      crustHits: det.crustHits,
      jellyCleared: det.jelly,
      fusesCleared: det.fuses,
      scoreGain,
      combo,
    };
  }

  private detonate(seeds: Seed[]): { pops: Pop[]; crustHits: CrustHit[]; jelly: Pos[]; fuses: Pos[] } {
    const popped = new Set<string>();
    const queue = [...seeds];
    const pops: Pop[] = [];
    const crustHits: CrustHit[] = [];
    const jelly: Pos[] = [];
    const fuses: Pos[] = [];
    let guard = 0;

    while (queue.length > 0 && guard++ < 400) {
      const job = queue.shift()!;
      if (!this.inBounds(job)) continue;
      const cell = this.cells[job.r][job.c];
      const mark = keyOf(job);

      if (cell.crust > 0 && !cell.tile) {
        const next = Math.max(0, cell.crust - job.power);
        if (next === cell.crust) continue;
        cell.crust = next;
        crustHits.push({ id: cell.crustId, c: job.c, r: job.r, left: next });
        if (next === 0) {
          cell.crustId = 0;
          popped.add(mark);
        }
        continue;
      }

      if (!cell.tile || popped.has(mark)) continue;
      popped.add(mark);
      const tile = cell.tile;
      const fx: Fx = job.force && job.force !== 'pop' ? job.force : this.fxFor(tile.special);
      pops.push({ c: job.c, r: job.r, id: tile.id, kind: tile.kind, special: tile.special, fx });
      if (cell.jelly) {
        cell.jelly = false;
        jelly.push({ c: job.c, r: job.r });
      }
      if (cell.fuse > 0) {
        cell.fuse = 0;
        fuses.push({ c: job.c, r: job.r });
      }
      cell.tile = null;

      for (const p of this.area(job.c, job.r, fx, tile.kind)) {
        queue.push({ c: p.c, r: p.r, power: 2 });
      }
      if (fx === 'pop') {
        for (const p of this.ortho(job.c, job.r)) {
          const neighbor = this.cells[p.r][p.c];
          if (neighbor.crust > 0 && !neighbor.tile) queue.push({ c: p.c, r: p.r, power: 1 });
        }
      }
    }
    return { pops, crustHits, jelly, fuses };
  }

  private area(c: number, r: number, fx: Fx, kind: string): Pos[] {
    const out: Pos[] = [];
    if (fx === 'row') {
      for (let i = 0; i < COLS; i++) if (i !== c) out.push({ c: i, r });
    } else if (fx === 'col') {
      for (let i = 0; i < ROWS; i++) if (i !== r) out.push({ c, r: i });
    } else if (fx === 'bomb') {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr !== 0 || dc !== 0) out.push({ c: c + dc, r: r + dr });
        }
      }
    } else if (fx === 'color') {
      for (let rr = 0; rr < ROWS; rr++) {
        for (let cc = 0; cc < COLS; cc++) {
          const tile = this.cells[rr][cc].tile;
          if (tile && tile.kind === kind) out.push({ c: cc, r: rr });
        }
      }
    }
    return out;
  }

  private gravity(): Fall[] {
    const falls: Fall[] = [];
    for (let c = 0; c < COLS; c++) {
      const stack: Array<{ tile: Tile | null; crust: number; crustId: number; fuse: number; fromR: number }> = [];
      for (let r = ROWS - 1; r >= 0; r--) {
        const cell = this.cells[r][c];
        if (cell.tile || cell.crust > 0) {
          stack.push({
            tile: cell.tile,
            crust: cell.crust,
            crustId: cell.crustId,
            fuse: cell.fuse,
            fromR: r,
          });
        }
        cell.tile = null;
        cell.crust = 0;
        cell.crustId = 0;
        cell.fuse = 0;
      }
      for (let i = 0; i < stack.length; i++) {
        const toR = ROWS - 1 - i;
        const item = stack[i];
        const cell = this.cells[toR][c];
        cell.tile = item.tile;
        cell.crust = item.crust;
        cell.crustId = item.crustId;
        cell.fuse = item.tile ? item.fuse : 0;
        if (item.fromR === toR) continue;
        if (item.tile) {
          falls.push({
            id: item.tile.id,
            kind: item.tile.kind,
            special: item.tile.special,
            fromC: c,
            fromR: item.fromR,
            toC: c,
            toR,
            spawn: false,
          });
        } else {
          falls.push({
            id: item.crustId,
            kind: 'crust',
            special: 'none',
            fromC: c,
            fromR: item.fromR,
            toC: c,
            toR,
            spawn: false,
          });
        }
      }
      const empty = ROWS - stack.length;
      for (let r = empty - 1; r >= 0; r--) {
        const tile = this.makeTile();
        this.cells[r][c].tile = tile;
        falls.push({
          id: tile.id,
          kind: tile.kind,
          special: tile.special,
          fromC: c,
          fromR: r - empty,
          toC: c,
          toR: r,
          spawn: true,
        });
      }
    }
    return falls;
  }

  private tileSpots(): Pos[] {
    const list: Pos[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.cells[r][c].tile) list.push({ c, r });
      }
    }
    return list;
  }

  private exchange(a: Pos, b: Pos): void {
    const ca = this.cells[a.r][a.c];
    const cb = this.cells[b.r][b.c];
    const tile = ca.tile;
    const fuse = ca.fuse;
    ca.tile = cb.tile;
    ca.fuse = cb.fuse;
    cb.tile = tile;
    cb.fuse = fuse;
  }

  private makeTile(kind?: string): Tile {
    const picked = kind ?? this.level.kinds[Math.floor(this.rng() * this.level.kinds.length)];
    const tile: Tile = { id: this.nextId, kind: picked, special: 'none' };
    this.nextId += 1;
    return tile;
  }

  private pickKind(c: number, r: number): string {
    const ban = new Set<string>();
    if (c >= 2) {
      const left = this.cells[r][c - 1].tile?.kind;
      const further = this.cells[r][c - 2].tile?.kind;
      if (left && left === further) ban.add(left);
    }
    if (r >= 2) {
      const up = this.cells[r - 1][c].tile?.kind;
      const further = this.cells[r - 2][c].tile?.kind;
      if (up && up === further) ban.add(up);
    }
    const options = this.level.kinds.filter((kind) => !ban.has(kind));
    const pool = options.length > 0 ? options : this.level.kinds;
    return pool[Math.floor(this.rng() * pool.length)];
  }

  private shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  private fxFor(special: Special): Fx {
    return special === 'none' ? 'pop' : special;
  }

  private ortho(c: number, r: number): Pos[] {
    return [
      { c: c + 1, r },
      { c: c - 1, r },
      { c, r: r + 1 },
      { c, r: r - 1 },
    ].filter((p) => this.inBounds(p));
  }

  private inBounds(p: Pos): boolean {
    return p.c >= 0 && p.r >= 0 && p.c < COLS && p.r < ROWS;
  }
}
