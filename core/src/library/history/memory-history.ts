import {
  AbstractHistory,
  HistoryEntry,
  HistorySnapshot,
  getActiveHistoryEntryIndex,
} from './history';

const SNAP_PROMISE = Promise.resolve();

export class MemoryHistory<TData = any> extends AbstractHistory<number, TData> {
  protected snapshot: HistorySnapshot<number, TData>;

  private lastId: number;

  constructor(initialRef = '/') {
    super();

    if (!initialRef.startsWith('/')) {
      initialRef = `/${initialRef}`;
    }

    let id = 0;
    let data: TData | undefined;

    let entries: HistoryEntry<number, TData>[] = [
      {
        id,
        ref: initialRef,
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
    return ref;
  }

  getRefByHRef(href: string): string {
    return href;
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
      entries: [...entries].splice(index, 1, {id: activeId, ref, data}),
      active: activeId,
    };

    this.snapshot = snapshot;

    this.emitChange(snapshot);
  }

  async restore(snapshot: HistorySnapshot<number, TData>): Promise<void> {
    this.snapshot = snapshot;
  }
}
