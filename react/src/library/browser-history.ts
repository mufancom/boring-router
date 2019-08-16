import {
  AbstractHistory,
  HistoryEntry,
  HistorySnapshot,
  isHistoryEntryEqual,
} from 'boring-router';

export interface BrowserHistoryOptions {
  /**
   * URL prefix, ignored if `hash` is enabled.
   */
  prefix?: string;
  /**
   * Use hash (#) for location pathname and search.
   *
   * This is not a compatibility option and does not make it compatible with
   * obsolete browsers.
   */
  hash?: boolean;
}

export class BrowserHistory<TData = any> extends AbstractHistory<
  number,
  TData
> {
  protected snapshot: HistorySnapshot<number, TData>;

  private tracked: HistorySnapshot<number, TData>;

  private restoring = false;

  private restoringPromise = Promise.resolve();
  private restoringPromiseResolver: (() => void) | undefined;

  private lastId: number;

  private prefix: string;
  private hash: boolean;

  constructor({prefix = '', hash = false}: BrowserHistoryOptions = {}) {
    super();

    this.prefix = prefix;
    this.hash = hash;

    window.addEventListener('popstate', this.onPopState);

    let id = 0;
    let data: TData | undefined;

    history.replaceState({id}, '');

    let url = `${location.pathname}${location.search}${location.hash}`;

    let entries: HistoryEntry<number, TData>[] = [
      {
        id,
        ref: this.getRefByHRef(url),
        data,
      },
    ];

    this.snapshot = this.tracked = {
      entries,
      active: id,
    };

    this.lastId = id;
  }

  private get hashPrefix(): string {
    return `${location.pathname}${location.search}`;
  }

  getHRefByRef(ref: string): string {
    if (this.hash) {
      return `${this.hashPrefix}#${ref}`;
    } else {
      return `${this.prefix}${ref}`;
    }
  }

  getRefByHRef(href: string): string {
    if (this.hash) {
      let index = href.indexOf('#');

      return (index >= 0 && href.slice(index + 1)) || '/';
    } else {
      let prefix = this.prefix;

      return href.startsWith(prefix) ? href.slice(prefix.length) : href;
    }
  }

  async back(): Promise<void> {
    await this.restoringPromise;

    history.back();
  }

  async forward(): Promise<void> {
    await this.restoringPromise;

    history.forward();
  }

  async push(ref: string, data?: TData): Promise<void> {
    await this.restoringPromise;

    let id = ++this.lastId;

    let snapshot = this.pushEntry({
      id,
      ref,
      data,
    });

    this.snapshot = snapshot;

    this.emitChange(snapshot);
  }

  async replace(ref: string, data?: TData): Promise<void> {
    await this.restoringPromise;

    let id = this.tracked.active;

    let snapshot = this.replaceEntry({
      id,
      ref,
      data,
    });

    this.snapshot = snapshot;

    this.emitChange(snapshot);
  }

  async restore(snapshot: HistorySnapshot<number, TData>): Promise<void> {
    this.snapshot = snapshot;

    if (this.restoring) {
      return;
    }

    console.debug('restore start');

    this.restoring = true;

    let promise = new Promise<void>(resolve => {
      this.restoringPromiseResolver = resolve;
    });

    this.restoringPromise = promise;

    this.stepRestoration();

    await promise;
  }

  private stepRestoration(): void {
    let {entries: expectedEntries, active: expectedActiveId} = this.snapshot;
    let {entries: trackedEntries, active: trackedActiveId} = this.tracked;

    console.debug('step restoration');
    console.debug(this.snapshot, this.tracked);

    let lastExpectedIndex = expectedEntries.length - 1;
    let lastTrackedIndex = trackedEntries.length - 1;

    let expectedActiveIndex = expectedEntries.findIndex(
      entry => entry.id === expectedActiveId,
    );
    let trackedActiveIndex = trackedEntries.findIndex(
      entry => entry.id === trackedActiveId,
    );

    if (
      // expected  a -> b
      // tracked   a -> c -> d
      //                     ^ active
      trackedActiveIndex > lastExpectedIndex ||
      // expected  a -> b
      // tracked   a -> c -> d
      //                ^ active
      (trackedActiveIndex === lastExpectedIndex &&
        trackedActiveIndex < lastTrackedIndex &&
        // exclude:
        // expected  a
        // tracked   b -> c
        //           ^ active
        trackedActiveIndex > 0)
    ) {
      history.back();
      return;
    }

    let minLength = Math.min(expectedEntries.length, trackedEntries.length);

    let firstMismatchingIndex = 0;

    for (
      firstMismatchingIndex;
      firstMismatchingIndex < minLength;
      firstMismatchingIndex++
    ) {
      let expectedEntry = expectedEntries[firstMismatchingIndex];
      let trackedEntry = trackedEntries[firstMismatchingIndex];

      if (!isHistoryEntryEqual(expectedEntry, trackedEntry)) {
        break;
      }
    }

    if (
      // expected  a -> b -> c
      // tracked   a -> e -> e
      //                ^ mismatch
      //                     ^ active
      trackedActiveIndex > firstMismatchingIndex
    ) {
      history.back();
      return;
    }

    if (
      // If the tracked entries is not identical to expected entries, there are
      // two situations:
      // 1. The first mismatch is within the range of expected entries, thus
      //    they are certainly not identical.
      firstMismatchingIndex <= lastExpectedIndex ||
      // 2. If the tracked entries is longer than the expected entries (if it's
      //    short it would satisfy the first test). But we need to exclude a
      //    special case that cannot be fully restored:
      //
      //    ```
      //    expected  a
      //    tracked   a -> b
      //    ```
      //
      //    In this case it's already the best shape.
      (lastTrackedIndex > lastExpectedIndex && lastExpectedIndex > 0)
    ) {
      if (trackedActiveIndex === firstMismatchingIndex) {
        this.replaceEntry(expectedEntries[trackedActiveIndex]);
      }

      for (let entry of expectedEntries.slice(trackedActiveIndex + 1)) {
        this.pushEntry(entry);
      }

      trackedActiveIndex = lastExpectedIndex;
    }

    if (trackedActiveIndex < expectedActiveIndex) {
      history.forward();
    } else if (trackedActiveIndex > expectedActiveIndex) {
      history.back();
    } else {
      this.restoring = false;
      this.restoringPromiseResolver!();
      this.restoringPromiseResolver = undefined;

      console.debug('restore end');
    }
  }

  private pushEntry({
    id,
    ref,
    data,
  }: HistoryEntry<number, TData>): HistorySnapshot<number, TData> {
    let {entries, active: activeId} = this.tracked;

    let activeIndex = entries.findIndex(entry => entry.id === activeId);

    let snapshot: HistorySnapshot<number, TData> = {
      entries: [...entries.slice(0, activeIndex + 1), {id, ref, data}],
      active: id,
    };

    this.tracked = snapshot;

    history.pushState({id}, '', this.getHRefByRef(ref));

    return snapshot;
  }

  private replaceEntry({
    id,
    ref,
    data,
  }: HistoryEntry<number, TData>): HistorySnapshot<number, TData> {
    let {entries, active: activeId} = this.tracked;

    let index = entries.findIndex(entry => entry.id === id);

    if (index < 0) {
      throw new Error(`Cannot find entry with id ${id} to replace`);
    }

    let snapshot: HistorySnapshot<number, TData> = {
      entries: [...entries].splice(index, 1, {id, ref, data}),
      active: activeId,
    };

    this.tracked = snapshot;

    history.replaceState({id}, '', this.getHRefByRef(ref));

    return snapshot;
  }

  private onPopState = (event: PopStateEvent): void => {
    let {entries} = this.tracked;

    let activeId = event.state.id as number;

    let index = entries.findIndex(entry => entry.id === activeId);

    if (index < 0) {
      console.info('Unknown pop state ID, will reload the current page');
      location.reload();
      return;
    }

    let snapshot: HistorySnapshot<number, TData> = {
      entries,
      active: activeId,
    };

    this.tracked = snapshot;

    if (this.restoring) {
      this.stepRestoration();
      return;
    }

    this.snapshot = snapshot;

    this.emitChange(snapshot);
  };
}
