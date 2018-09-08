import {createMemoryHistory} from 'history';

import {Router} from '../bld/library';

let history = createMemoryHistory();

let router = Router.create(
  {
    default: {
      $match: '',
    },
    account: {
      $children: {
        settings: true,
        billings: true,
      },
    },
  },
  history,
);

router.default.$react(() => {
  router.account.settings.$push();
});

router.account.$react(() => {
  router.account.billings.$push();
}, true);

beforeAll(async () => {});

test('should navigate from `default` to `account.settings`', () => {
  expect(history.location.pathname).toBe('/account/settings');
});

test('should navigate from `account` to `account.billings`', async () => {
  router.account.$push();

  await Promise.resolve();

  expect(history.location.pathname).toBe('/account/billings');
});
