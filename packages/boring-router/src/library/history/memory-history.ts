import {
  AbstractHistory,
  HistorySnapshot,
  getActiveHistoryEntryIndex,
} from './history';

const SNAP_PROMISE = Promise.resolve();

export interface MemoryHistoryOptions {
  /**
   * Initial ref, defaults to '/'.
   */
  initialRef?: string;
  /**
   * URL prefix.
   */
  prefix?: string;
}

export class MemoryHistory<TData = any> extends AbstractHistory<number, TData> {
  private _snapshot: HistorySnapshot<number, TData>;

  private lastId: number;
  private prefix: string;

  constructor({initialRef = '/', prefix = ''}: MemoryHistoryOptions = {}) {
    super();

    this.prefix = prefix;

    if (!initialRef.startsWith('/')) {
      initialRef = `/${initialRef}`;
    }

    let id = 0;

    this._snapshot = {
      entries: [
        {
          id,
          ref: initialRef,
          data: undefined,
        },
      ],
      active: id,
    };

    this.lastId = id;
  }

  get snapshot(): HistorySnapshot<number, TData> {
    return this._snapshot;
  }

  getHRefByRef(ref: string): string {
    return `${this.prefix}${ref}`;
  }

  getRefByHRef(href: string): string {
    let prefix = this.prefix;

    return href.startsWith(prefix) ? href.slice(prefix.length) : href;
  }

  async back(): Promise<void> {
    await SNAP_PROMISE;

    let snapshot = this._snapshot;

    let {entries} = snapshot;

    let index = getActiveHistoryEntryIndex(snapshot);

    if (index <= 0) {
      return;
    }

    snapshot = {
      entries,
      active: entries[index - 1].id,
    };

    this._snapshot = snapshot;

    this.emitChange(snapshot);
  }

  async forward(): Promise<void> {
    await SNAP_PROMISE;

    let snapshot = this._snapshot;

    let {entries} = snapshot;

    let index = getActiveHistoryEntryIndex(snapshot);

    if (index >= entries.length - 1) {
      return;
    }

    snapshot = {
      entries,
      active: entries[index + 1].id,
    };

    this._snapshot = snapshot;

    this.emitChange(snapshot);
  }

  async push(ref: string, data?: TData): Promise<void> {
    let id = ++this.lastId;

    let snapshot = this._snapshot;

    let {entries} = snapshot;

    let index = getActiveHistoryEntryIndex(snapshot);

    snapshot = {
      entries: [...entries.slice(0, index + 1), {id, ref, data}],
      active: id,
    };

    this._snapshot = snapshot;

    this.emitChange(snapshot);
  }

  async replace(ref: string, data?: TData): Promise<void> {
    let snapshot = this._snapshot;

    let {entries, active: activeId} = snapshot;

    let index = getActiveHistoryEntryIndex(snapshot);

    snapshot = {
      entries: [
        ...entries.slice(0, index),
        {id: activeId, ref, data},
        ...entries.slice(index + 1),
      ],
      active: activeId,
    };

    this._snapshot = snapshot;

    this.emitChange(snapshot);
  }

  async restore(
    snapshot: HistorySnapshot<number, TData>,
    toEmitChange = false,
  ): Promise<void> {
    this._snapshot = snapshot;

    if (toEmitChange) {
      this.emitChange(this._snapshot);
    }
  }
}
