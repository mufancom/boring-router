import {
  AbstractHistory,
  HistoryEntry,
  HistorySnapshot,
  getActiveHistoryEntryIndex,
  isHistoryEntryEqual,
} from 'boring-router';
import Debug from 'debug';

const debug = Debug('boring-router:react:browser-history');

type BrowserHistoryEntry<TData> = HistoryEntry<number, TData>;

type BrowserHistorySnapshot<TData> = HistorySnapshot<number, TData>;

interface BrowserHistoryState<TData> {
  id: number;
  data: TData;
}

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
  protected snapshot: BrowserHistorySnapshot<TData>;

  private tracked: BrowserHistorySnapshot<TData>;

  private restoring = false;

  private restoringPromise = Promise.resolve();
  private restoringPromiseResolver: (() => void) | undefined;

  private lastUsedId = 0;

  private prefix: string;
  private hash: boolean;

  constructor({prefix = '', hash = false}: BrowserHistoryOptions = {}) {
    super();

    this.prefix = prefix;
    this.hash = hash;

    window.addEventListener('popstate', this.onPopState);

    let state = history.state as BrowserHistoryState<TData> | undefined;

    let id: number;
    let data: TData | undefined;

    if (state) {
      id = state.id;
      data = state.data;

      this.lastUsedId = id;
    } else {
      id = this.getNextId();

      history.replaceState({id}, '');
    }

    let entries: HistoryEntry<number, TData>[] = [
      {
        id,
        ref: this.getRefByHRef(this.url),
        data,
      },
    ];

    this.snapshot = this.tracked = {
      entries,
      active: id,
    };
  }

  get url(): string {
    return `${location.pathname}${location.search}${location.hash}`;
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
    if (ref === this.ref) {
      return this.replace(ref, data);
    }

    await this.restoringPromise;

    let snapshot = this.pushEntry({
      id: this.getNextId(),
      ref,
      data,
    });

    debug('push', snapshot);

    this.snapshot = snapshot;

    this.emitChange(snapshot);
  }

  async replace(ref: string, data?: TData): Promise<void> {
    await this.restoringPromise;

    let {active: id} = this.tracked;

    let snapshot = this.replaceEntry({
      id,
      ref,
      data,
    });

    debug('replace', snapshot);

    this.snapshot = snapshot;

    this.emitChange(snapshot);
  }

  async restore(snapshot: BrowserHistorySnapshot<TData>): Promise<void> {
    debug('restore', snapshot);

    this.snapshot = snapshot;

    if (this.restoring) {
      return;
    }

    debug('restore start');

    this.restoring = true;

    let promise = new Promise<void>(resolve => {
      this.restoringPromiseResolver = resolve;
    });

    this.restoringPromise = promise;

    this.stepRestoration();

    await promise;
  }

  async navigate(href: string): Promise<void> {
    let prefix = this.prefix;

    if (/^[\w\d]+:\/\//.test(href) || !href.startsWith(prefix)) {
      location.href = href;
      return;
    }

    let ref = href.slice(prefix.length);

    await this.push(ref);
  }

  private onPopState = async (event: PopStateEvent): Promise<void> => {
    let {entries: trackedEntries} = this.tracked;

    let {id, data} = event.state as BrowserHistoryState<TData>;

    if (id > this.lastUsedId) {
      this.lastUsedId = id;
    }

    let entries = [...trackedEntries];

    let index = entries.findIndex(entry => entry.id >= id);

    if (index < 0 || entries[index].id > id) {
      entries.splice(index < 0 ? entries.length : index, 0, {
        id,
        ref: this.getRefByHRef(this.url),
        data,
      });
    }

    let snapshot: BrowserHistorySnapshot<TData> = {
      entries,
      active: id,
    };

    this.tracked = snapshot;

    if (this.restoring) {
      this.stepRestoration();
      return;
    }

    this.snapshot = snapshot;

    debug('pop', snapshot);

    this.emitChange(snapshot);
  };

  private stepRestoration(): void {
    debug('step restoration');
    debug('expected', this.snapshot);
    debug('tracked', this.tracked);

    this.restoreEntries();
  }

  private restoreEntries(): void {
    let expected = this.snapshot;
    let tracked = this.tracked;

    let {entries: expectedEntries} = expected;
    let {entries: trackedEntries} = tracked;

    let lastExpectedIndex = expectedEntries.length - 1;
    let lastTrackedIndex = trackedEntries.length - 1;

    let trackedActiveIndex = getActiveHistoryEntryIndex(tracked);

    let minLength = Math.min(expectedEntries.length, trackedEntries.length);

    let firstMismatchedIndex = 0;

    for (
      firstMismatchedIndex;
      firstMismatchedIndex < minLength;
      firstMismatchedIndex++
    ) {
      let expectedEntry = expectedEntries[firstMismatchedIndex];
      let trackedEntry = trackedEntries[firstMismatchedIndex];

      if (!isHistoryEntryEqual(expectedEntry, trackedEntry)) {
        break;
      }
    }

    if (
      firstMismatchedIndex > lastExpectedIndex &&
      (lastExpectedIndex === lastTrackedIndex || lastExpectedIndex === 0)
    ) {
      // 1. Exactly identical.
      // 2. Not exactly identical but there's not much that can be done:
      //    ```
      //    expected  a
      //    tracked   a -> b
      //                   ^ mismatch
      //    ```
      //    In this case we cannot remove the extra entries.

      this.restoreActive();
      return;
    }

    if (
      // expected  a -> b -> c
      // tracked   a -> d -> e
      //                ^ mismatch
      //                     ^ active
      trackedActiveIndex > firstMismatchedIndex ||
      // expected  a -> b
      // tracked   a -> b -> c
      //                     ^ mismatch
      //                     ^ active
      trackedActiveIndex > lastExpectedIndex ||
      // expected  a -> b
      // tracked   a -> b -> c
      //                     ^ mismatch
      //                ^ active
      // expected  a -> b
      // tracked   a -> c -> d
      //                ^ mismatch
      //                ^ active
      (trackedActiveIndex === lastExpectedIndex &&
        trackedActiveIndex < lastTrackedIndex)
    ) {
      history.back();
      return;
    }

    if (trackedActiveIndex === firstMismatchedIndex) {
      this.replaceEntry(
        expectedEntries[trackedActiveIndex],
        trackedActiveIndex,
      );
    }

    for (let entry of expectedEntries.slice(trackedActiveIndex + 1)) {
      this.pushEntry(entry);
    }

    this.restoreActive();
  }

  private restoreActive(): void {
    let expectedActiveIndex = getActiveHistoryEntryIndex(this.snapshot);
    let trackedActiveIndex = getActiveHistoryEntryIndex(this.tracked);

    if (trackedActiveIndex < expectedActiveIndex) {
      history.forward();
    } else if (trackedActiveIndex > expectedActiveIndex) {
      history.back();
    } else {
      this.completeRestoration();
    }
  }

  private completeRestoration(): void {
    this.restoring = false;

    if (this.restoringPromiseResolver) {
      this.restoringPromiseResolver();
    }

    this.restoringPromiseResolver = undefined;

    debug('restore end');
    debug('expected', this.snapshot);
    debug('tracked', this.tracked);
  }

  private pushEntry({
    id,
    ref,
    data,
  }: BrowserHistoryEntry<TData>): BrowserHistorySnapshot<TData> {
    let tracked = this.tracked;

    let {entries} = tracked;

    let activeIndex = getActiveHistoryEntryIndex(tracked);

    let snapshot: BrowserHistorySnapshot<TData> = {
      entries: [...entries.slice(0, activeIndex + 1), {id, ref, data}],
      active: id,
    };

    this.tracked = snapshot;

    let href = this.getHRefByRef(ref);

    try {
      history.pushState({id, data}, '', href);
    } catch (error) {
      history.pushState({id}, '', href);
    }

    return snapshot;
  }

  private replaceEntry(
    {id, ref, data}: BrowserHistoryEntry<TData>,
    index?: number,
  ): BrowserHistorySnapshot<TData> {
    let {entries} = this.tracked;

    if (index === undefined) {
      index = entries.findIndex(entry => entry.id === id);

      if (index < 0) {
        throw new Error(`Cannot find entry with id ${id} to replace`);
      }
    }

    let snapshot: BrowserHistorySnapshot<TData> = {
      entries: [
        ...entries.slice(0, index),
        {id, ref, data},
        ...entries.slice(index + 1),
      ],
      active: id,
    };

    this.tracked = snapshot;

    let href = this.getHRefByRef(ref);

    try {
      history.replaceState({id, data}, '', href);
    } catch (error) {
      history.replaceState({id}, '', href);
    }

    return snapshot;
  }

  private getNextId(): number {
    return ++this.lastUsedId;
  }
}
