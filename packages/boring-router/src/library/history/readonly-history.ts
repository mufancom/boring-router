import type {HistorySnapshot} from './history.js';
import {AbstractHistory} from './history.js';

export type ReadOnlyHistoryOptions = {
  /**
   * Initial ref, defaults to '/'.
   */
  initialRef?: string;
  /**
   * URL prefix.
   */
  prefix?: string;
};

export class ReadOnlyHistory<TData = any> extends AbstractHistory<
  number,
  TData
> {
  readonly snapshot: HistorySnapshot<number, TData>;

  private prefix: string;

  constructor({initialRef = '/', prefix = ''}: ReadOnlyHistoryOptions = {}) {
    super();

    this.prefix = prefix;

    if (!initialRef.startsWith('/')) {
      initialRef = `/${initialRef}`;
    }

    const id = 0;

    this.snapshot = {
      entries: [
        {
          id,
          ref: initialRef,
          data: undefined,
        },
      ],
      active: id,
    };
  }

  getHRefByRef(ref: string): string {
    return `${this.prefix}${ref}`;
  }

  getRefByHRef(href: string): string {
    const prefix = this.prefix;

    return href.startsWith(prefix) ? href.slice(prefix.length) : href;
  }

  back(): Promise<void> {
    throw new Error('Method not implemented');
  }

  forward(): Promise<void> {
    throw new Error('Method not implemented');
  }

  push(): Promise<void> {
    throw new Error('Method not implemented');
  }

  replace(): Promise<void> {
    throw new Error('Method not implemented');
  }

  restore(): Promise<void> {
    throw new Error('Method not implemented');
  }
}
