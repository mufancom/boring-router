import {AbstractHistory, HistorySnapshot} from './history';

export class ReadOnlyHistory<TData = any> extends AbstractHistory<
  number,
  TData
> {
  protected snapshot: HistorySnapshot<number, TData>;

  constructor(private prefix = '') {
    super();

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
