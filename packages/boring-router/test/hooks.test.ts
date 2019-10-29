import {action, configure, observable} from 'mobx';

import {MemoryHistory, Router} from '../bld/library';

import {nap} from './@utils';

configure({
  enforceActions: 'observed',
});

let history = new MemoryHistory();

let router = new Router(history);

let primaryRoute = router.$route({
  default: {
    $match: '',
  },
  about: true,
  redirect: true,
  revert: true,
  persist: true,
  routing: true,
  parent: {
    $exact: true,
    $children: {
      nested: true,
    },
  },
});

let redirectBeforeEnter = jest.fn(() => {
  primaryRoute.about.$push();
});
let redirectAfterEnter = jest.fn();
let redirectAutorun = jest.fn();

primaryRoute.redirect.$beforeEnter(redirectBeforeEnter);
primaryRoute.redirect.$afterEnter(redirectAfterEnter);
primaryRoute.redirect.$autorun(redirectAutorun);

let revertBeforeEnter = jest.fn(() => false);
let revertAfterEnter = jest.fn();

primaryRoute.revert.$beforeEnter(revertBeforeEnter);
primaryRoute.revert.$afterEnter(revertAfterEnter);

let persistBeforeLeave = jest.fn(() => false);

primaryRoute.persist.$beforeLeave(persistBeforeLeave);

let parentBeforeEnter = jest.fn();
let parentBeforeUpdate = jest.fn();

primaryRoute.parent.$beforeEnter(parentBeforeEnter);
primaryRoute.parent.$beforeUpdate(parentBeforeUpdate);

let aboutBeforeEnter = jest.fn();
let aboutAfterEnter = jest.fn();
let aboutBeforeLeave = jest.fn();
let aboutAfterLeave = jest.fn();
let aboutAfterEnterAutorun = jest.fn();

let aboutAutorunChangeTestNumber = observable.box(0);

let aboutAutorunChangeTestValues: number[] = [];

let aboutAutorunChangeAction = action(() => {
  aboutAutorunChangeTestNumber.set(1);
});

let aboutAutorun = jest.fn(() => {
  aboutAutorunChangeTestValues.push(aboutAutorunChangeTestNumber.get());
});

primaryRoute.about.$autorun(aboutAutorun);

primaryRoute.about.$beforeEnter(aboutBeforeEnter);
primaryRoute.about.$afterEnter(aboutAfterEnter);
primaryRoute.about.$beforeLeave(aboutBeforeLeave);
primaryRoute.about.$afterLeave(aboutAfterLeave);

let routingBeforeEnter = jest.fn();

primaryRoute.routing.$beforeEnter(routingBeforeEnter);

let canceledAboutAfterEnter = jest.fn();

let removalCallback = primaryRoute.about.$afterEnter(canceledAboutAfterEnter);

removalCallback();

test('should navigate from `redirect` to `about`', async () => {
  await history.push('/redirect');

  await nap();

  expect(router.$ref()).toBe('/about');
  expect(primaryRoute.about.$matched).toBe(true);
  expect(primaryRoute.redirect.$matched).toBe(false);

  expect(redirectBeforeEnter).toHaveBeenCalled();
  expect(redirectAfterEnter).not.toHaveBeenCalled();
  expect(redirectAutorun).not.toHaveBeenCalled();

  expect(aboutBeforeEnter).toHaveBeenCalled();
  expect(aboutAfterEnter).toHaveBeenCalled();
  expect(aboutAutorun).toHaveBeenCalled();

  primaryRoute.about.$autorun(aboutAfterEnterAutorun);

  aboutAutorunChangeAction();

  expect(aboutAfterEnterAutorun).toHaveBeenCalled();
  expect(aboutAutorun).toHaveBeenCalledTimes(2);
  expect(aboutAutorunChangeTestValues).toEqual([0, 1]);
});

test('should revert navigation from `about` to `revert` by `revert.$beforeEnter`', async () => {
  await history.push('/revert');

  await nap();

  expect(router.$ref()).toBe('/about');
  expect(primaryRoute.about.$matched).toBe(true);
  expect(primaryRoute.revert.$matched).toBe(false);

  expect(revertBeforeEnter).toHaveBeenCalled();
  expect(revertAfterEnter).not.toHaveBeenCalled();

  expect(aboutBeforeEnter).not.toHaveBeenCalled();
  expect(aboutAfterEnter).not.toHaveBeenCalled();
  expect(aboutBeforeLeave).toHaveBeenCalled();
  expect(aboutAfterLeave).not.toHaveBeenCalled();
});

test('should trigger `parent.$beforeUpdate` on `$exact` change', async () => {
  await history.push('/parent/nested');

  await nap();

  expect(parentBeforeEnter).toHaveBeenCalled();
  expect(parentBeforeUpdate).not.toHaveBeenCalled();

  await history.push('/parent');

  await nap();

  expect(parentBeforeUpdate).toHaveBeenCalled();
});

test('should not call hooks that have been canceled.', async () => {
  await history.push('/about');

  await nap();

  expect(router.$ref()).toBe('/about');
  expect(primaryRoute.about.$matched).toBe(true);

  expect(canceledAboutAfterEnter).not.toHaveBeenCalled();
});

test('property routing should be true before beforeEnter ended', async () => {
  expect(router.$routing).toBe(false);

  await history.push('/routing');

  expect(router.$routing).toBe(true);

  await nap();

  expect(router.$ref()).toBe('/routing');
  expect(routingBeforeEnter).toHaveBeenCalled();
  expect(router.$routing).toBe(false);
});

test('should revert navigation from `persist` to `about` by `persist.$beforeLeave`', async () => {
  await history.push('/persist');

  await nap();

  await history.push('/about');

  await nap();

  expect(router.$ref()).toBe('/persist');
  expect(primaryRoute.about.$matched).toBe(false);
  expect(primaryRoute.persist.$matched).toBe(true);

  expect(persistBeforeLeave).toHaveBeenCalled();

  expect(aboutBeforeEnter).not.toHaveBeenCalled();
});
