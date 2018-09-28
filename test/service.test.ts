import {createMemoryHistory} from 'history';

import {Router} from '../bld/library';

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
      },
    },
  },
  history,
);

let afterEnter = jest.fn();

let beforeLeave = jest.fn();

router.account.$service(match => {
  return {
    beforeEnter: ({$params: {id}}) => {
      match.account = new Account(id!);
    },
    afterEnter,
    beforeLeave,
    afterLeave: () => {
      match.account = undefined!;
    },
  };
});

test('should navigate from `default` to `account`', async () => {
  let id = 'abc';

  await nap();

  expect(router.account.account).toBeUndefined();

  history.push(`/account?id=${encodeURIComponent(id)}`);

  await nap();

  expect(history.location.pathname).toBe('/account');
  expect(router.account.account.id).toBe(id);

  expect(afterEnter).toHaveBeenCalled();
});

test('should navigate from `account` to `default`', async () => {
  router.default.$push();

  await nap();

  expect(history.location.pathname).toBe('/');
  expect(router.account.account).toBeUndefined();

  expect(beforeLeave).toHaveBeenCalled();
});
