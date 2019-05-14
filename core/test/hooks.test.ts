import {createMemoryHistory} from 'history';
import {configure} from 'mobx';

import {Router} from '../bld/library';

import {nap} from './@utils';

configure({
  enforceActions: 'observed',
});

let history = createMemoryHistory();

let router = Router.create(
  {
    default: {
      $match: '',
    },
    about: true,
    redirect: true,
    revert: true,
    persist: true,
    parent: {
      $exact: true,
      $children: {
        nested: true,
      },
    },
  },
  history,
);

let redirectBeforeEnter = jest.fn(() => {
  router.about.$push();
});
let redirectAfterEnter = jest.fn();

router.redirect.$beforeEnter(redirectBeforeEnter);
router.redirect.$afterEnter(redirectAfterEnter);

let revertBeforeEnter = jest.fn(() => false);
let revertAfterEnter = jest.fn();

router.revert.$beforeEnter(revertBeforeEnter);
router.revert.$afterEnter(revertAfterEnter);

let persistBeforeLeave = jest.fn(() => false);

router.persist.$beforeLeave(persistBeforeLeave);

let parentBeforeEnter = jest.fn();
let parentBeforeUpdate = jest.fn();

router.parent.$beforeEnter(parentBeforeEnter);
router.parent.$beforeUpdate(parentBeforeUpdate);

let aboutBeforeEnter = jest.fn();
let aboutAfterEnter = jest.fn();
let aboutBeforeLeave = jest.fn();
let aboutAfterLeave = jest.fn();

router.about.$beforeEnter(aboutBeforeEnter);
router.about.$afterEnter(aboutAfterEnter);
router.about.$beforeLeave(aboutBeforeLeave);
router.about.$afterLeave(aboutAfterLeave);

let canceledAboutAfterEnter = jest.fn();

let removalCallback = router.about.$afterEnter(canceledAboutAfterEnter);

removalCallback();

test('should navigate from `redirect` to `about`', async () => {
  history.push('/redirect');

  await nap();

  expect(history.location.pathname).toBe('/about');
  expect(router.about.$matched).toBe(true);
  expect(router.redirect.$matched).toBe(false);

  expect(redirectBeforeEnter).toHaveBeenCalled();
  expect(redirectAfterEnter).not.toHaveBeenCalled();

  expect(aboutBeforeEnter).toHaveBeenCalled();
  expect(aboutAfterEnter).toHaveBeenCalled();
});

test('should revert navigation from `about` to `revert` by `revert.$beforeEnter`', async () => {
  history.push('/revert');

  await nap();

  expect(history.location.pathname).toBe('/about');
  expect(router.about.$matched).toBe(true);
  expect(router.revert.$matched).toBe(false);

  expect(revertBeforeEnter).toHaveBeenCalled();
  expect(revertAfterEnter).not.toHaveBeenCalled();

  expect(aboutBeforeEnter).not.toHaveBeenCalled();
  expect(aboutAfterEnter).not.toHaveBeenCalled();
  expect(aboutBeforeLeave).toHaveBeenCalled();
  expect(aboutAfterLeave).not.toHaveBeenCalled();
});

test('should trigger `parent.$beforeUpdate` on `$exact` change', async () => {
  history.push('/parent/nested');

  await nap();

  expect(parentBeforeEnter).toHaveBeenCalled();
  expect(parentBeforeUpdate).not.toHaveBeenCalled();

  history.push('/parent');

  await nap();

  expect(parentBeforeUpdate).toHaveBeenCalled();
});

test('should not call hooks that have been canceled.', async () => {
  history.push('/about');

  await nap();

  expect(history.location.pathname).toBe('/about');
  expect(router.about.$matched).toBe(true);

  expect(canceledAboutAfterEnter).not.toHaveBeenCalled();
});

test('should revert navigation from `persist` to `about` by `persist.$beforeLeave`', async () => {
  history.push('/persist');

  await nap();

  history.push('/about');

  await nap();

  expect(history.location.pathname).toBe('/persist');
  expect(router.about.$matched).toBe(false);
  expect(router.persist.$matched).toBe(true);

  expect(persistBeforeLeave).toHaveBeenCalled();

  expect(aboutBeforeEnter).not.toHaveBeenCalled();
});
