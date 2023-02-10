import {MemoryHistory, Router} from 'boring-router';
import {action, configure, observable} from 'mobx';

import {nap} from './@utils';

configure({
  enforceActions: 'observed',
});

const history = new MemoryHistory();

const router = new Router(history);

const primaryRoute = router.$route({
  $children: {
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
  },
});

const redirectBeforeEnter = jest.fn(() => {
  primaryRoute.about.$push();
});
const redirectWillEnter = jest.fn();
const redirectEnter = jest.fn();
const redirectAfterEnter = jest.fn();
const redirectAutorun = jest.fn();
const redirectReaction = jest.fn();

primaryRoute.redirect.$beforeEnter(redirectBeforeEnter);
primaryRoute.redirect.$willEnter(redirectWillEnter);
primaryRoute.redirect.$enter(redirectEnter);
primaryRoute.redirect.$afterEnter(redirectAfterEnter);
primaryRoute.redirect.$autorun(redirectAutorun);
primaryRoute.redirect.$reaction(() => {}, redirectReaction);

const revertBeforeEnter = jest.fn(() => false);
const revertEnter = jest.fn();
const revertAfterEnter = jest.fn();

primaryRoute.revert.$beforeEnter(revertBeforeEnter);
primaryRoute.revert.$enter(revertEnter);
primaryRoute.revert.$afterEnter(revertAfterEnter);

const persistBeforeLeave = jest.fn(() => false);

primaryRoute.persist.$beforeLeave(persistBeforeLeave);

const parentBeforeEnter = jest.fn();
const parentBeforeUpdate = jest.fn();
const parentWillUpdate = jest.fn();
const parentUpdate = jest.fn();

primaryRoute.parent.$beforeEnter(parentBeforeEnter);
primaryRoute.parent.$beforeUpdate(parentBeforeUpdate);
primaryRoute.parent.$willUpdate(parentWillUpdate);
primaryRoute.parent.$willUpdate(parentUpdate);

const aboutBeforeEnter = jest.fn();
const aboutWillEnter = jest.fn();
const aboutEnter = jest.fn();
const aboutAfterEnter = jest.fn();
const aboutBeforeLeave = jest.fn();
const aboutWillLeave = jest.fn();
const aboutLeave = jest.fn();
const aboutAfterLeave = jest.fn(() => {
  increaseAboutObserveChangeTestNumber();
});
const aboutAfterEnterAutorun = jest.fn();
const aboutAfterEnterReactionExpression = jest.fn();
const aboutAfterEnterReactionEffect = jest.fn();

const aboutObserveChangeTestNumber = observable.box(0);

let increaseAboutObserveChangeTestNumber = action(() => {
  aboutObserveChangeTestNumber.set(aboutObserveChangeTestNumber.get() + 1);
});

const aboutAutorun = jest.fn(() => {
  aboutObserveChangeTestNumber.get();
});

const aboutReactionExpression = jest.fn(() => {
  return aboutObserveChangeTestNumber.get();
});
const aboutReactionEffect = jest.fn();

primaryRoute.about.$autorun(aboutAutorun);
primaryRoute.about.$reaction(aboutReactionExpression, aboutReactionEffect);

primaryRoute.about.$beforeEnter(aboutBeforeEnter);
primaryRoute.about.$willEnter(aboutWillEnter);
primaryRoute.about.$enter(aboutEnter);
primaryRoute.about.$afterEnter(aboutAfterEnter);
primaryRoute.about.$beforeLeave(aboutBeforeLeave);
primaryRoute.about.$willLeave(aboutWillLeave);
primaryRoute.about.$leave(aboutLeave);
primaryRoute.about.$afterLeave(aboutAfterLeave);

const routingBeforeEnter = jest.fn();

primaryRoute.routing.$beforeEnter(routingBeforeEnter);

const removedAboutAfterEnter = jest.fn();

const removalCallback = primaryRoute.about.$afterEnter(removedAboutAfterEnter);

removalCallback();

test('should navigate from `redirect` to `about`', async () => {
  await history.push('/redirect');

  await nap();

  expect(router.$ref()).toBe('/about');
  expect(primaryRoute.about.$matched).toBe(true);
  expect(primaryRoute.redirect.$matched).toBe(false);

  expect(redirectBeforeEnter).toHaveBeenCalled();
  expect(redirectWillEnter).not.toHaveBeenCalled();
  expect(redirectEnter).not.toHaveBeenCalled();
  expect(redirectAfterEnter).not.toHaveBeenCalled();
  expect(redirectAutorun).not.toHaveBeenCalled();
  expect(redirectReaction).not.toHaveBeenCalled();

  expect(aboutBeforeEnter).toHaveBeenCalled();
  expect(aboutWillEnter).toHaveBeenCalled();
  expect(aboutEnter).toHaveBeenCalled();
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
  expect(revertEnter).not.toHaveBeenCalled();
  expect(revertAfterEnter).not.toHaveBeenCalled();

  expect(aboutBeforeEnter).not.toHaveBeenCalled();
  expect(aboutAfterEnter).not.toHaveBeenCalled();
  expect(aboutBeforeLeave).toHaveBeenCalled();
  expect(aboutWillLeave).not.toHaveBeenCalled();
  expect(aboutLeave).not.toHaveBeenCalled();
  expect(aboutAfterLeave).not.toHaveBeenCalled();
});

test('should trigger `parent.$beforeUpdate` on `$exact` change', async () => {
  await history.push('/parent/nested');

  await nap();

  expect(parentBeforeEnter).toHaveBeenCalled();
  expect(parentBeforeUpdate).not.toHaveBeenCalled();
  expect(parentWillUpdate).not.toHaveBeenCalled();
  expect(parentUpdate).not.toHaveBeenCalled();

  await history.push('/parent');

  await nap();

  expect(parentBeforeUpdate).toHaveBeenCalled();
  expect(parentWillUpdate).toHaveBeenCalled();
  expect(parentUpdate).toHaveBeenCalled();
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
