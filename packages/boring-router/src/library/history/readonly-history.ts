import {AbstractHistory, HistorySnapshot} from './history';

export interface ReadOnlyHistoryOptions {
  prefix?: string;
}

export class ReadOnlyHistory<TData = any> extends AbstractHistory<
  number,
  TData
> {
  protected snapshot: HistorySnapshot<number, TData>;

  private prefix: string;

  constructor({prefix = ''}: ReadOnlyHistoryOptions = {}) {
    super();

    this.prefix = prefix;

    let id = 0;

    this.snapshot = {
      entries: [
        {
          id,
          ref: '/',
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
    let prefix = this.prefix;

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
