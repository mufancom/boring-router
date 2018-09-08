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
        settings: {
          $match: /.*/,
        },
        billings: true,
      },
    },
    about: true,
  },
  history,
);

router.default.$intercept(() => router.about.$ref());

router.account.settings.$intercept(() => false);

beforeAll(async () => {});

test('should navigate from `default` to `about`', () => {
  expect(history.location.pathname).toBe('/about');
  expect(router.about.$matched).toBe(true);
});

test('should match `account.billings` instead of `account.settings`', async () => {
  router.account.settings.$push({settings: 'billings'});

  await Promise.resolve();

  expect(router.account.settings.$matched).toBe(false);
  expect(router.account.billings.$matched).toBe(true);
  expect(history.location.pathname).toBe('/account/billings');
});
