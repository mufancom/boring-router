import {createMemoryHistory} from 'history';
import {configure} from 'mobx';

import {Router} from '../bld/library';

import {nap} from './@utils';

configure({
  enforceActions: 'observed',
});

let history = createMemoryHistory();

let router = new Router(history);

let rootRoute = router.route({
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
});

let redirectBeforeEnter = jest.fn(() => {
  rootRoute.about.$push();
});
let redirectAfterEnter = jest.fn();

rootRoute.redirect.$beforeEnter(redirectBeforeEnter);
rootRoute.redirect.$afterEnter(redirectAfterEnter);

let revertBeforeEnter = jest.fn(() => false);
let revertAfterEnter = jest.fn();

rootRoute.revert.$beforeEnter(revertBeforeEnter);
rootRoute.revert.$afterEnter(revertAfterEnter);

let persistBeforeLeave = jest.fn(() => false);

rootRoute.persist.$beforeLeave(persistBeforeLeave);

let parentBeforeEnter = jest.fn();
let parentBeforeUpdate = jest.fn();

rootRoute.parent.$beforeEnter(parentBeforeEnter);
rootRoute.parent.$beforeUpdate(parentBeforeUpdate);

let aboutBeforeEnter = jest.fn();
let aboutAfterEnter = jest.fn();
let aboutBeforeLeave = jest.fn();
let aboutAfterLeave = jest.fn();

rootRoute.about.$beforeEnter(aboutBeforeEnter);
rootRoute.about.$afterEnter(aboutAfterEnter);
rootRoute.about.$beforeLeave(aboutBeforeLeave);
rootRoute.about.$afterLeave(aboutAfterLeave);

let canceledAboutAfterEnter = jest.fn();

let removalCallback = rootRoute.about.$afterEnter(canceledAboutAfterEnter);

removalCallback();

test('should navigate from `redirect` to `about`', async () => {
  history.push('/redirect');

  await nap();

  expect(history.location.pathname).toBe('/about');
  expect(rootRoute.about.$matched).toBe(true);
  expect(rootRoute.redirect.$matched).toBe(false);

  expect(redirectBeforeEnter).toHaveBeenCalled();
  expect(redirectAfterEnter).not.toHaveBeenCalled();

  expect(aboutBeforeEnter).toHaveBeenCalled();
  expect(aboutAfterEnter).toHaveBeenCalled();
});

test('should revert navigation from `about` to `revert` by `revert.$beforeEnter`', async () => {
  history.push('/revert');

  await nap();

  expect(history.location.pathname).toBe('/about');
  expect(rootRoute.about.$matched).toBe(true);
  expect(rootRoute.revert.$matched).toBe(false);

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
  expect(rootRoute.about.$matched).toBe(true);

  expect(canceledAboutAfterEnter).not.toHaveBeenCalled();
});

test('should revert navigation from `persist` to `about` by `persist.$beforeLeave`', async () => {
  history.push('/persist');

  await nap();

  history.push('/about');

  await nap();

  expect(history.location.pathname).toBe('/persist');
  expect(rootRoute.about.$matched).toBe(false);
  expect(rootRoute.persist.$matched).toBe(true);

  expect(persistBeforeLeave).toHaveBeenCalled();

  expect(aboutBeforeEnter).not.toHaveBeenCalled();
});
