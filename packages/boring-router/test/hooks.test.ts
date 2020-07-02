import {MemoryHistory, Router} from 'boring-router';
import {action, configure, observable} from 'mobx';

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
let redirectWillEnter = jest.fn();
let redirectAfterEnter = jest.fn();
let redirectAutorun = jest.fn();
let redirectReaction = jest.fn();

primaryRoute.redirect.$beforeEnter(redirectBeforeEnter);
primaryRoute.redirect.$willEnter(redirectWillEnter);
primaryRoute.redirect.$afterEnter(redirectAfterEnter);
primaryRoute.redirect.$autorun(redirectAutorun);
primaryRoute.redirect.$reaction(() => {}, redirectReaction);

let revertBeforeEnter = jest.fn(() => false);
let revertAfterEnter = jest.fn();

primaryRoute.revert.$beforeEnter(revertBeforeEnter);
primaryRoute.revert.$afterEnter(revertAfterEnter);

let persistBeforeLeave = jest.fn(() => false);

primaryRoute.persist.$beforeLeave(persistBeforeLeave);

let parentBeforeEnter = jest.fn();
let parentBeforeUpdate = jest.fn();
let parentWillUpdate = jest.fn();

primaryRoute.parent.$beforeEnter(parentBeforeEnter);
primaryRoute.parent.$beforeUpdate(parentBeforeUpdate);
primaryRoute.parent.$willUpdate(parentWillUpdate);

let aboutBeforeEnter = jest.fn();
let aboutWillEnter = jest.fn();
let aboutAfterEnter = jest.fn();
let aboutBeforeLeave = jest.fn();
let aboutWillLeave = jest.fn();
let aboutAfterLeave = jest.fn(() => {
  increaseAboutObserveChangeTestNumber();
});
let aboutAfterEnterAutorun = jest.fn();
let aboutAfterEnterReactionExpression = jest.fn();
let aboutAfterEnterReactionEffect = jest.fn();

let aboutObserveChangeTestNumber = observable.box(0);

let increaseAboutObserveChangeTestNumber = action(() => {
  aboutObserveChangeTestNumber.set(aboutObserveChangeTestNumber.get() + 1);
});

let aboutAutorun = jest.fn(() => {
  aboutObserveChangeTestNumber.get();
});

let aboutReactionExpression = jest.fn(() => {
  return aboutObserveChangeTestNumber.get();
});
let aboutReactionEffect = jest.fn();

primaryRoute.about.$autorun(aboutAutorun);
primaryRoute.about.$reaction(aboutReactionExpression, aboutReactionEffect);

primaryRoute.about.$beforeEnter(aboutBeforeEnter);
primaryRoute.about.$willEnter(aboutWillEnter);
primaryRoute.about.$afterEnter(aboutAfterEnter);
primaryRoute.about.$beforeLeave(aboutBeforeLeave);
primaryRoute.about.$willLeave(aboutWillLeave);
primaryRoute.about.$afterLeave(aboutAfterLeave);

let routingBeforeEnter = jest.fn();

primaryRoute.routing.$beforeEnter(routingBeforeEnter);

let removedAboutAfterEnter = jest.fn();

let removalCallback = primaryRoute.about.$afterEnter(removedAboutAfterEnter);

removalCallback();

test('should navigate from `redirect` to `about`', async () => {
  await history.push('/redirect');

  await nap();

  expect(router.$ref()).toBe('/about');
  expect(primaryRoute.about.$matched).toBe(true);
  expect(primaryRoute.redirect.$matched).toBe(false);

  expect(redirectBeforeEnter).toHaveBeenCalled();
  expect(redirectWillEnter).not.toHaveBeenCalled();
  expect(redirectAfterEnter).not.toHaveBeenCalled();
  expect(redirectAutorun).not.toHaveBeenCalled();
  expect(redirectReaction).not.toHaveBeenCalled();

  expect(aboutBeforeEnter).toHaveBeenCalled();
  expect(aboutWillEnter).toHaveBeenCalled();
  expect(aboutAfterEnter).toHaveBeenCalled();
  expect(aboutAutorun).toHaveBeenCalled();
  expect(aboutReactionExpression).toHaveBeenCalled();
  expect(aboutReactionEffect).not.toHaveBeenCalled();

  primaryRoute.about.$autorun(aboutAfterEnterAutorun);
  primaryRoute.about.$reaction(
    aboutAfterEnterReactionExpression,
    aboutAfterEnterReactionEffect,
  );

  increaseAboutObserveChangeTestNumber();

  expect(aboutReactionEffect).toHaveBeenCalled();

  expect(aboutAfterEnterAutorun).toHaveBeenCalled();
  expect(aboutAfterEnterReactionExpression).toHaveBeenCalled();
  expect(aboutAfterEnterReactionEffect).not.toHaveBeenCalled();

  expect(aboutAutorun).toHaveBeenCalledTimes(2);
  expect(aboutReactionExpression).toHaveBeenCalledTimes(2);
  expect(aboutReactionEffect).toHaveBeenCalledTimes(1);

  expect(aboutObserveChangeTestNumber.get()).toEqual(1);
  expect(aboutReactionEffect.mock.calls[0][0]).toBe(1);

  await history.push('/');

  await nap();

  expect(aboutAutorun).toHaveBeenCalledTimes(2);
  expect(aboutReactionExpression).toHaveBeenCalledTimes(2);
  expect(aboutReactionEffect).toHaveBeenCalledTimes(1);
  expect(aboutObserveChangeTestNumber.get()).toEqual(2);

  await history.push('/about');

  await nap();
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
  expect(parentWillUpdate).not.toHaveBeenCalled();

  await history.push('/parent');

  await nap();

  expect(parentBeforeUpdate).toHaveBeenCalled();
  expect(parentWillUpdate).toHaveBeenCalled();
});

test('should not call hooks that have been removed.', async () => {
  await history.push('/about');

  await nap();

  expect(router.$ref()).toBe('/about');
  expect(primaryRoute.about.$matched).toBe(true);

  expect(removedAboutAfterEnter).not.toHaveBeenCalled();
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
