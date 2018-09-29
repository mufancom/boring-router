import {createMemoryHistory} from 'history';
import {computed, observable} from 'mobx';

import {
  IRouteService,
  NextRouteMatchType,
  RouteMatch,
  Router,
} from '../bld/library';

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
      $children: {
        accountId: {
          $match: RouteMatch.fragment,
          $extension: {
            account: undefined! as Account,
            name: undefined! as string,
          },
        },
      },
    },
  },
  history,
);

let beforeUpdate = jest.fn();

let afterUpdate = jest.fn();
let afterEnter = jest.fn();

let beforeLeave = jest.fn();

type AccountIdRouteMatch = typeof router.account.accountId;

class AccountRouteService implements IRouteService<AccountIdRouteMatch> {
  @observable
  account!: Account;

  constructor(private match: AccountIdRouteMatch) {}

  @computed
  get name() {
    return `[${this.match.$params.accountId}]`;
  }

  beforeEnter({
    $params: {accountId},
  }: NextRouteMatchType<AccountIdRouteMatch>): void {
    this.account = new Account(accountId);
  }

  beforeUpdate(match: NextRouteMatchType<AccountIdRouteMatch>): void {
    beforeUpdate();

    this.beforeEnter(match);
  }

  afterUpdate(): void {
    afterUpdate();
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

router.account.accountId.$service(match => new AccountRouteService(match));

test('should navigate from `default` to `account` and triggers `$beforeEnter`', async () => {
  await nap();

  expect(router.account.accountId.account).toBeUndefined();

  let id = 'abc';
  let path = `/account/${encodeURIComponent(id)}`;

  history.push(path);

  await nap();

  expect(history.location.pathname).toBe(path);
  expect(router.account.accountId.account.id).toBe(id);
  expect(router.account.accountId.name).toBe(`[${id}]`);

  expect(afterEnter).toHaveBeenCalled();
  expect(beforeUpdate).not.toHaveBeenCalled();
  expect(afterUpdate).not.toHaveBeenCalled();
});

test('should navigate from `default` to `account` and triggers `$beforeUpdate`', async () => {
  await nap();

  let id = 'def';
  let path = `/account/${encodeURIComponent(id)}`;

  history.push(path);

  await nap();

  expect(history.location.pathname).toBe(path);
  expect(router.account.accountId.account.id).toBe(id);
  expect(router.account.accountId.name).toBe(`[${id}]`);

  expect(afterEnter).not.toHaveBeenCalled();
  expect(beforeUpdate).toHaveBeenCalled();
  expect(afterUpdate).toHaveBeenCalled();
});

test('should navigate from `account` to `default`', async () => {
  router.default.$push();

  await nap();

  expect(history.location.pathname).toBe('/');
  expect(router.account.accountId.account).toBeUndefined();
  expect(router.account.accountId.name).toBeUndefined();

  expect(beforeLeave).toHaveBeenCalled();
});
