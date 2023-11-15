import type {HistoryEntry, HistorySnapshot} from 'boring-router';
import {
  AbstractHistory,
  getActiveHistoryEntryIndex,
  isHistoryEntryEqual,
} from 'boring-router';
import Debug from 'debug';

const debug = Debug('boring-router:react:browser-history');

export type BrowserHistoryNavigateAwayHandler = (href: string) => void;

const NAVIGATE_AWAY_HANDLER_DEFAULT: BrowserHistoryNavigateAwayHandler =
  href => {
    location.href = href;
  };

type BrowserHistoryEntry<TData> = HistoryEntry<number, TData>;

type BrowserHistorySnapshot<TData> = HistorySnapshot<number, TData>;

type BrowserHistoryState<TData> = {
  id: number;
  data: TData;
};

export type BrowserHistoryOptions = {
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
};

export class BrowserHistory<TData = any> extends AbstractHistory<
  number,
  TData
> {
  private _snapshot: BrowserHistorySnapshot<TData>;

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

    const state = history.state as BrowserHistoryState<TData> | undefined;

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

    const entries: HistoryEntry<number, TData>[] = [
      {
        id,
        ref: this.getRefByHRef(this.url),
        data,
      },
    ];

    this._snapshot = this.tracked = {
      entries,
      active: id,
    };
  }

  get snapshot(): HistorySnapshot<number, TData> {
    return this._snapshot;
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
      const index = href.indexOf('#');

      if (index >= 0) {
        const ref = href.slice(index + 1);

        if (ref) {
          return ref;
        }
      }

      return '/';
    } else {
      const prefix = this.prefix;

      let ref = href.startsWith(prefix) ? href.slice(prefix.length) : href;

      const hashIndex = ref.indexOf('#');

      if (hashIndex >= 0) {
        ref = ref.slice(0, hashIndex);
      }

      return ref;
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
    return this._push(ref, data, true);
  }

  async replace(ref: string, data?: TData): Promise<void> {
    await this.restoringPromise;

    const {active: id} = this.tracked;

    const snapshot = this.replaceEntry({
      id,
      ref,
      data,
    });

    debug('replace', snapshot);

    this._snapshot = snapshot;

    this.emitChange(snapshot);
  }

  async restore(
    snapshot: BrowserHistorySnapshot<TData>,
    toEmitChange = false,
  ): Promise<void> {
    debug('restore', snapshot);

    this._snapshot = snapshot;

    if (this.restoring) {
      return;
    }

    debug('restore start');

    this.restoring = true;

    const promise = new Promise<void>(resolve => {
      this.restoringPromiseResolver = resolve;
    });

    this.restoringPromise = promise;

    this.stepRestoration();

    await promise;

    if (toEmitChange) {
      this.emitChange(this._snapshot);
    }
  }

  async navigate(
    href: string,
    navigateAwayHandler = NAVIGATE_AWAY_HANDLER_DEFAULT,
  ): Promise<void> {
    const originalHRef = href;

    const groups = /^([\w\d]+:)?\/\/([^/?]+)(.*)/.exec(href);

    if (groups) {
      const [, protocol, host, rest] = groups;

      if (
        (protocol && protocol !== location.protocol) ||
        host !== location.host
      ) {
        navigateAwayHandler(originalHRef);
        return;
      }

      href = rest.startsWith('/') ? rest : `/${rest}`;
    }

    const prefix = this.prefix;

    if (!href.startsWith(prefix)) {
      navigateAwayHandler(originalHRef);
      return;
    }

    const ref = href.slice(prefix.length);

    await this.push(ref);
  }

  private onPopState = (event: PopStateEvent): void => {
    const {entries: trackedEntries} = this.tracked;

    const state = event.state as BrowserHistoryState<TData> | null;

    // When using hash mode, entering a new hash directly in the browser will
    // also trigger popstate. And in that case state is null.
    if (!state) {
      void this._push(this.getRefByHRef(location.href), undefined, false);
      return;
    }

    const {id, data} = state;

    if (id > this.lastUsedId) {
      this.lastUsedId = id;
    }

    const entries = [...trackedEntries];

    const index = entries.findIndex(entry => entry.id >= id);

    if (index < 0 || entries[index].id > id) {
      entries.splice(index < 0 ? entries.length : index, 0, {
        id,
        ref: this.getRefByHRef(this.url),
        data,
      });
    }

    const snapshot: BrowserHistorySnapshot<TData> = {
      entries,
      active: id,
    };

    this.tracked = snapshot;

    if (this.restoring) {
      this.stepRestoration();
      return;
    }

    this._snapshot = snapshot;

    debug('pop', snapshot);

    this.emitChange(snapshot);
  };

  private stepRestoration(): void {
    debug('step restoration');
    debug('expected', this._snapshot);
    debug('tracked', this.tracked);

    const expected = this._snapshot;
    const tracked = this.tracked;

    const {entries: expectedEntries} = expected;
    const {entries: trackedEntries} = tracked;

    const lastExpectedIndex = expectedEntries.length - 1;
    const lastTrackedIndex = trackedEntries.length - 1;

    const trackedActiveIndex = getActiveHistoryEntryIndex(tracked);

    const minLength = Math.min(expectedEntries.length, trackedEntries.length);

    let firstMismatchedIndex = 0;

    for (
      firstMismatchedIndex;
      firstMismatchedIndex < minLength;
      firstMismatchedIndex++
    ) {
      const expectedEntry = expectedEntries[firstMismatchedIndex];
      const trackedEntry = trackedEntries[firstMismatchedIndex];

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

    for (const entry of expectedEntries.slice(trackedActiveIndex + 1)) {
      this.pushEntry(entry, true);
    }

    this.restoreActive();
  }

  private restoreActive(): void {
    const expectedActiveIndex = getActiveHistoryEntryIndex(this._snapshot);
    const trackedActiveIndex = getActiveHistoryEntryIndex(this.tracked);

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
    debug('expected', this._snapshot);
    debug('tracked', this.tracked);
  }

  private async _push(
    ref: string,
    data: TData | undefined,
    toPushState: boolean,
  ): Promise<void> {
    if (ref === this.ref) {
      return this.replace(ref, data);
    }

    await this.restoringPromise;

    const snapshot = this.pushEntry(
      {
        id: this.getNextId(),
        ref,
        data,
      },
      toPushState,
    );

    debug('push', snapshot);

    this._snapshot = snapshot;

    this.emitChange(snapshot);
  }

  private pushEntry(
    {id, ref, data}: BrowserHistoryEntry<TData>,
    toPushState: boolean,
  ): BrowserHistorySnapshot<TData> {
    const tracked = this.tracked;

    const {entries} = tracked;

    const activeIndex = getActiveHistoryEntryIndex(tracked);

    const snapshot: BrowserHistorySnapshot<TData> = {
      entries: [...entries.slice(0, activeIndex + 1), {id, ref, data}],
      active: id,
    };

    this.tracked = snapshot;

    if (toPushState) {
      const href = this.getHRefByRef(ref);

      try {
        history.pushState({id, data}, '', href);
      } catch (error) {
        history.pushState({id}, '', href);
      }
    }

    return snapshot;
  }

  private replaceEntry(
    {id, ref, data}: BrowserHistoryEntry<TData>,
    index?: number,
  ): BrowserHistorySnapshot<TData> {
    const {entries} = this.tracked;

    if (index === undefined) {
      index = entries.findIndex(entry => entry.id === id);

      if (index < 0) {
        throw new Error(`Cannot find entry with id ${id} to replace`);
      }
    }

    const snapshot: BrowserHistorySnapshot<TData> = {
      entries: [
        ...entries.slice(0, index),
        {id, ref, data},
        ...entries.slice(index + 1),
      ],
      active: id,
    };

    this.tracked = snapshot;

    const href = this.getHRefByRef(ref);

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
