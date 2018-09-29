import {createMemoryHistory} from 'history';
import {computed, observable} from 'mobx';

import {IRouteService, NextRouteMatchType, Router} from '../bld/library';

import {nap} from './@utils';

let history = createMemoryHistory();

class Account {
  constructor(readonly id: string) {}
}

let router = Router.create(
  {
    default: {
      $match: '',
    },
    account: {
      $exact: true,
      $query: {
        id: true,
      },
      $extension: {
        account: undefined! as Account,
        name: undefined! as string,
      },
      $children: {
        foo: true,
      },
    },
  },
  history,
);

let afterEnter = jest.fn();

let beforeLeave = jest.fn();

type AccountRouteMatch = typeof router.account;

class AccountRouteService implements IRouteService<AccountRouteMatch> {
  @observable
  account!: Account;

  constructor(private match: AccountRouteMatch) {}

  @computed
  get name() {
    return `[${this.match.$params.id}]`;
  }

  beforeEnter({$params: {id}}: NextRouteMatchType<AccountRouteMatch>): void {
    this.account = new Account(id!);
  }

  afterEnter(): void {
    afterEnter();
  }

  beforeLeave(): void {
    beforeLeave();
  }

  afterLeave(): void {
    this.account = undefined!;
  }
}

router.account.$service(match => new AccountRouteService(match));

test('should navigate from `default` to `account`', async () => {
  let id = 'abc';

  await nap();

  expect(router.account.account).toBeUndefined();

  history.push(`/account?id=${encodeURIComponent(id)}`);

  await nap();

  expect(history.location.pathname).toBe('/account');
  expect(router.account.account.id).toBe(id);
  expect(router.account.name).toBe(`[${id}]`);

  expect(afterEnter).toHaveBeenCalled();
});

test('should navigate from `account` to `default`', async () => {
  router.default.$push();

  await nap();

  expect(history.location.pathname).toBe('/');
  expect(router.account.account).toBeUndefined();
  expect(router.account.name).toBeUndefined();

  expect(beforeLeave).toHaveBeenCalled();
});
