import type {IRouteService, RouteUpdateContext} from 'boring-router';
import {MemoryHistory, RouteMatch, Router} from 'boring-router';
import {computed, configure, observable} from 'mobx';

import {nap} from './@utils';

configure({
  enforceActions: 'observed',
});

const history = new MemoryHistory();

class Account {
  constructor(readonly id: string) {}
}

const router = new Router(history);

const primaryRoute = router.$route({
  $children: {
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
  },
});

const beforeUpdate = jest.fn();
const beforeEnter = jest.fn();
const beforeLeave = jest.fn();

const willUpdate = jest.fn();
const willEnter = jest.fn();
const willLeave = jest.fn();

const update = jest.fn();
const enter = jest.fn();
const leave = jest.fn();

const afterUpdate = jest.fn();
const afterEnter = jest.fn();
const afterLeave = jest.fn();

type AccountIdRouteMatch = typeof primaryRoute.account.accountId;

interface AccountRouteServiceEnterData {
  foo: string;
}

interface AccountRouteServiceUpdateData {
  bar: number;
}

class AccountRouteService
  implements
    IRouteService<
      AccountIdRouteMatch,
      AccountRouteServiceEnterData,
      AccountRouteServiceUpdateData
    >
{
  @observable
  account!: Account;

  constructor(private match: AccountIdRouteMatch) {}

  @computed
  get name(): string {
    return `[${this.match.$params.accountId}]`;
  }

  beforeEnter(
    next: AccountIdRouteMatch['$next'],
  ): AccountRouteServiceEnterData {
    beforeEnter();

    expect(next).toEqual(this.match.$next);

    return {
      foo: 'abc',
    };
  }

  willEnter(
    next: AccountIdRouteMatch['$next'],
    data: AccountRouteServiceEnterData,
  ): void {
    willEnter();

    expect(next).toEqual(this.match.$next);
    expect(data).toEqual({
      foo: 'abc',
    });

    this.account = new Account(next.$params.accountId);
  }

  enter(data: AccountRouteServiceEnterData): void {
    expect(data).toEqual({
      foo: 'abc',
    });

    enter();
  }

  afterEnter(): void {
    afterEnter();
  }

  beforeUpdate(
    next: AccountIdRouteMatch['$next'],
    context: RouteUpdateContext,
  ): AccountRouteServiceUpdateData {
    beforeUpdate();

    expect(next).toEqual(this.match.$next);
    expect(context).toHaveProperty('descendants');

    return {
      bar: 123,
    };
  }

  willUpdate(
    match: AccountIdRouteMatch['$next'],
    context: RouteUpdateContext,
    data: AccountRouteServiceUpdateData,
  ): void {
    willUpdate();

    expect(match).toEqual(this.match.$next);
    expect(context).toHaveProperty('descendants');
    expect(data).toEqual({
      bar: 123,
    });

    this.willEnter(match, {
      foo: 'abc',
    });
  }

  update(
    context: RouteUpdateContext,
    data: AccountRouteServiceUpdateData,
  ): void {
    update();

    expect(context).toHaveProperty('descendants');
    expect(data).toEqual({
      bar: 123,
    });
  }

  afterUpdate(context: RouteUpdateContext): void {
    afterUpdate();

    expect(context).toHaveProperty('descendants');
  }

  beforeLeave(): void {
    beforeLeave();
  }

  willLeave(): void {
    willLeave();
  }

  leave(): void {
    leave();
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

  const id = 'abc';
  const path = `/account/${encodeURIComponent(id)}`;

  await history.push(path);

  await nap();

  expect(await router.$ref()).toBe(path);
  expect(primaryRoute.account.accountId.account.id).toBe(id);
  expect(primaryRoute.account.accountId.name).toBe(`[${id}]`);

  expect(beforeEnter).toHaveBeenCalled();
  expect(willEnter).toHaveBeenCalled();
  expect(enter).toHaveBeenCalled();
  expect(afterEnter).toHaveBeenCalled();
  expect(beforeUpdate).not.toHaveBeenCalled();
  expect(willUpdate).not.toHaveBeenCalled();
  expect(update).not.toHaveBeenCalled();
  expect(afterUpdate).not.toHaveBeenCalled();
});

test('should navigate from `default` to `account` and triggers `$beforeUpdate`', async () => {
  await nap();

  const id = 'def';
  const path = `/account/${encodeURIComponent(id)}`;

  await history.push(path);

  await nap();

  expect(await router.$ref()).toBe(path);
  expect(primaryRoute.account.accountId.account.id).toBe(id);
  expect(primaryRoute.account.accountId.name).toBe(`[${id}]`);

  expect(afterEnter).not.toHaveBeenCalled();
  expect(beforeUpdate).toHaveBeenCalled();
  expect(willUpdate).toHaveBeenCalled();
  expect(update).toHaveBeenCalled();
  expect(afterUpdate).toHaveBeenCalled();
});

test('should navigate from `account` to `default`', async () => {
  primaryRoute.$push();

  await nap();

  expect(await router.$ref()).toBe('/');
  expect(primaryRoute.account.accountId.account).toBeUndefined();
  expect(primaryRoute.account.accountId.name).toBeUndefined();

  expect(beforeLeave).toHaveBeenCalled();
  expect(willLeave).toHaveBeenCalled();
  expect(leave).toHaveBeenCalled();
  expect(afterLeave).toHaveBeenCalled();
});
