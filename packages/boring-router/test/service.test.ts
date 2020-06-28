import {
  IRouteService,
  MemoryHistory,
  RouteMatch,
  RouteUpdateCallbackData,
  Router,
} from 'boring-router';
import {computed, configure, observable} from 'mobx';

import {nap} from './@utils';

configure({
  enforceActions: 'observed',
});

let history = new MemoryHistory();

class Account {
  constructor(readonly id: string) {}
}

let router = new Router(history);

let primaryRoute = router.$route({
  default: {
    $match: '',
  },
  account: {
    $children: {
      accountId: {
        $match: RouteMatch.SEGMENT,
        $extension: {
          account: undefined! as Account,
          name: undefined! as string,
        },
      },
    },
  },
});

let beforeUpdate = jest.fn();
let beforeEnter = jest.fn();

let willUpdate = jest.fn();
let willEnter = jest.fn();

let afterUpdate = jest.fn();
let afterEnter = jest.fn();

let beforeLeave = jest.fn();
let willLeave = jest.fn();
let afterLeave = jest.fn();

type AccountIdRouteMatch = typeof primaryRoute.account.accountId;

class AccountRouteService implements IRouteService<AccountIdRouteMatch> {
  @observable
  account!: Account;

  constructor(private match: AccountIdRouteMatch) {}

  @computed
  get name(): string {
    return `[${this.match.$params.accountId}]`;
  }

  beforeEnter(next: AccountIdRouteMatch['$next']): void {
    beforeEnter();

    expect(next).toEqual(this.match.$next);
  }

  willEnter(next: AccountIdRouteMatch['$next']): void {
    willEnter();

    expect(next).toEqual(this.match.$next);

    this.account = new Account(next.$params.accountId);
  }

  afterEnter(): void {
    afterEnter();
  }

  beforeUpdate(
    next: AccountIdRouteMatch['$next'],
    data: RouteUpdateCallbackData,
  ): void {
    beforeUpdate();

    expect(next).toEqual(this.match.$next);
    expect(data).toHaveProperty('descendants');
  }

  willUpdate(
    match: AccountIdRouteMatch['$next'],
    data: RouteUpdateCallbackData,
  ): void {
    willUpdate();

    expect(match).toEqual(this.match.$next);
    expect(data).toHaveProperty('descendants');

    this.willEnter(match);
  }

  afterUpdate(data: RouteUpdateCallbackData): void {
    afterUpdate();

    expect(data).toHaveProperty('descendants');
  }

  beforeLeave(): void {
    beforeLeave();
  }

  willLeave(): void {
    willLeave();
  }

  afterLeave(): void {
    afterLeave();

    this.account = undefined!;
  }
}

primaryRoute.account.accountId.$service(
  match => new AccountRouteService(match),
);

test('should navigate from `default` to `account` and triggers `$beforeEnter`', async () => {
  await nap();

  expect(primaryRoute.account.accountId.account).toBeUndefined();

  let id = 'abc';
  let path = `/account/${encodeURIComponent(id)}`;

  await history.push(path);

  await nap();

  expect(await router.$ref()).toBe(path);
  expect(primaryRoute.account.accountId.account.id).toBe(id);
  expect(primaryRoute.account.accountId.name).toBe(`[${id}]`);

  expect(willEnter).toHaveBeenCalled();
  expect(afterEnter).toHaveBeenCalled();
  expect(beforeUpdate).not.toHaveBeenCalled();
  expect(willUpdate).not.toHaveBeenCalled();
  expect(afterUpdate).not.toHaveBeenCalled();
});

test('should navigate from `default` to `account` and triggers `$beforeUpdate`', async () => {
  await nap();

  let id = 'def';
  let path = `/account/${encodeURIComponent(id)}`;

  await history.push(path);

  await nap();

  expect(await router.$ref()).toBe(path);
  expect(primaryRoute.account.accountId.account.id).toBe(id);
  expect(primaryRoute.account.accountId.name).toBe(`[${id}]`);

  expect(afterEnter).not.toHaveBeenCalled();
  expect(beforeUpdate).toHaveBeenCalled();
  expect(willUpdate).toHaveBeenCalled();
  expect(afterUpdate).toHaveBeenCalled();
});

test('should navigate from `account` to `default`', async () => {
  primaryRoute.default.$push();

  await nap();

  expect(await router.$ref()).toBe('/');
  expect(primaryRoute.account.accountId.account).toBeUndefined();
  expect(primaryRoute.account.accountId.name).toBeUndefined();

  expect(beforeLeave).toHaveBeenCalled();
  expect(willLeave).toHaveBeenCalled();
  expect(afterLeave).toHaveBeenCalled();
});
