import {createMemoryHistory} from 'history';

import {Router} from '../bld/library';

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

beforeAll(async () => {});

test('should navigate from `default` to `account`', () => {
  let id = 'abc';

  expect(router.account.account).toBeUndefined();

  history.push(`/account?id=${encodeURIComponent(id)}`);

  expect(history.location.pathname).toBe('/account');
  expect(router.account.account.id).toBe(id);

  expect(afterEnter).toHaveBeenCalled();
});

test('should navigate from `account` to `default`', () => {
  router.default.$push();

  expect(history.location.pathname).toBe('/');
  expect(router.account.account).toBeUndefined();

  expect(beforeLeave).toHaveBeenCalled();
});
