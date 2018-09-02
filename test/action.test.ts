import {createMemoryHistory} from 'history';

import {Router} from '../bld/library';

(global as any).requestAnimationFrame = (callback: () => void) => callback();

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

router.default.$action(() => {
  router.account.settings.$push();
});

router.account.$action(() => {
  router.account.billings.$push();
}, true);

test('should navigate from `default` to `account.settings`', () => {
  expect(history.location.pathname).toBe('/account/settings');
});

test('should navigate from `account` to `account.billings`', () => {
  router.account.$push();

  expect(history.location.pathname).toBe('/account/billings');
});
