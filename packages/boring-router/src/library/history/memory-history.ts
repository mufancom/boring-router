import {
  AbstractHistory,
  HistoryEntry,
  HistorySnapshot,
  getActiveHistoryEntryIndex,
} from './history';

const SNAP_PROMISE = Promise.resolve();

export interface MemoryHistoryOptions {
  /**
   * URL prefix.
   */
  prefix?: string;
  /**
   * initial ref, defaults to '/'
   */
  initialRef?: string;
}

export class MemoryHistory<TData = any> extends AbstractHistory<number, TData> {
  protected snapshot: HistorySnapshot<number, TData>;

  private lastId: number;
  private prefix: string;

  constructor(options: MemoryHistoryOptions = {}) {
    super();

    let {initialRef = '/', prefix = ''} = options;
    this.prefix = prefix;

    if (!initialRef.startsWith('/')) {
      initialRef = `/${initialRef}`;
    }

    let id = 0;
    let data: TData | undefined;

    let entries: HistoryEntry<number, TData>[] = [
      {
        id,
        ref: this.getRefByHRef(initialRef),
        data,
      },
    ];

    this.snapshot = {
      entries,
      active: id,
    };

    this.lastId = id;
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

    let snapshot = this.snapshot;

    let {entries} = snapshot;

    let index = getActiveHistoryEntryIndex(snapshot);

    if (index <= 0) {
      return;
    }

    snapshot = {
      entries,
      active: entries[index - 1].id,
    };

    this.snapshot = snapshot;

    this.emitChange(snapshot);
  }

  async forward(): Promise<void> {
    await SNAP_PROMISE;

    let snapshot = this.snapshot;

    let {entries} = snapshot;

    let index = getActiveHistoryEntryIndex(snapshot);

    if (index >= entries.length - 1) {
      return;
    }

    snapshot = {
      entries,
      active: entries[index + 1].id,
    };

    this.snapshot = snapshot;

    this.emitChange(snapshot);
  }

  async push(ref: string, data?: TData): Promise<void> {
    let id = ++this.lastId;

    let snapshot = this.snapshot;

    let {entries} = snapshot;

    let index = getActiveHistoryEntryIndex(snapshot);

    snapshot = {
      entries: [...entries.slice(0, index + 1), {id, ref, data}],
      active: id,
    };

    this.snapshot = snapshot;

    this.emitChange(snapshot);
  }

  async replace(ref: string, data?: TData): Promise<void> {
    let snapshot = this.snapshot;

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

    this.snapshot = snapshot;

    this.emitChange(snapshot);
  }

  async restore(snapshot: HistorySnapshot<number, TData>): Promise<void> {
    this.snapshot = snapshot;
  }
}
