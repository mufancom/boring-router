export type HistoryChangeCallbackRemovalHandler = () => void;

export interface HistoryEntry<TId, TData> {
  readonly id: TId;
  readonly ref: string;
  readonly data: TData | undefined;
}

export interface HistorySnapshot<TEntryId, TData> {
  readonly entries: readonly HistoryEntry<TEntryId, TData>[];
  readonly active: TEntryId;
}

export type HistoryChangeCallback<TEntryId, TData> = (
  snapshot: HistorySnapshot<TEntryId, TData>,
) => void;

abstract class History<TEntryId, TData> {
  private changeCallbackSet = new Set<HistoryChangeCallback<TEntryId, TData>>();

  abstract get snapshot(): HistorySnapshot<TEntryId, TData>;

  get ref(): string {
    return getActiveHistoryEntry(this.snapshot).ref;
  }

  get index(): number {
    return getActiveHistoryEntryIndex(this.snapshot);
  }

  get length(): number {
    return this.snapshot.entries.length;
  }

  listen(
    callback: HistoryChangeCallback<TEntryId, TData>,
  ): HistoryChangeCallbackRemovalHandler {
    callback(this.snapshot);

    this.changeCallbackSet.add(callback);

    return () => {
      this.changeCallbackSet.delete(callback);
    };
  }

  abstract getHRefByRef(ref: string): string;

  abstract getRefByHRef(href: string): string;

  abstract back(): Promise<void>;

  abstract forward(): Promise<void>;

  abstract push(ref: string, data?: unknown): Promise<void>;

  abstract replace(ref: string, data?: unknown): Promise<void>;

  abstract restore(
    snapshot: HistorySnapshot<TEntryId, TData>,
    toEmitChange?: boolean,
  ): Promise<void>;

  protected emitChange(snapshot: HistorySnapshot<TEntryId, TData>): void {
    for (const callback of this.changeCallbackSet) {
      try {
        callback(snapshot);
      } catch (error) {
        console.error(error);
      }
    }
  }
}

export const AbstractHistory = History;

export interface IHistory<TEntryId = unknown, TData = unknown>
  extends History<TEntryId, TData> {}

export function isHistoryEntryEqual<TEntryId, TData>(
  x: HistoryEntry<TEntryId, TData>,
  y: HistoryEntry<TEntryId, TData>,
): boolean {
  return x.id === y.id && x.ref === y.ref && x.data === y.data;
}

export function getActiveHistoryEntryIndex<TEntryId, TData>({
  entries,
  active: activeId,
}: HistorySnapshot<TEntryId, TData>): number {
  let index = entries.findIndex(entry => entry.id === activeId);

  if (index < 0) {
    console.error('Invalid history snapshot');
    index = entries.length - 1;
  }

  return index;
}

export function getActiveHistoryEntry<TEntryId, TData>({
  entries,
  active: activeId,
}: HistorySnapshot<TEntryId, TData>): HistoryEntry<TEntryId, TData> {
  let entry = entries.find(entry => entry.id === activeId);

  if (!entry) {
    console.error('Invalid history snapshot');
    entry = entries[entries.length - 1];
  }

  return entry;
}
