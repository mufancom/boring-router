---
menu: References
name: Lifecycle Hooks
route: /references/lifecycle-hooks
---

# Lifecycle Hooks

## Overview

Boring Router is a state-first router of which the core has nothing to do with React components. This makes Boring Router fundamentally different with [React Router](https://github.com/ReactTraining/react-router) and removes the first barrier providing full lifecycle hooks.

The second barrier of full lifecycle hooks support is browser history stack. As navigation can happen without accessing the router managed by us (e.g., user clicking "back", "forward" and even "goto"), it is unavoidable for lifecycle hooks like `beforeEnter` to be called after the navigation actually happens. To support `before` hooks, we need to acquire the ability to restore history stack to a previous state. Otherwise, we will have broken browser navigation behavior. To solve this problem, we choose to implement our own `BrowserHistory` with the ability to track and restore history stack instead of using the popular [history](https://github.com/ReactTraining/history) package.

Those make it possible for Boring Router to support full lifecycle hooks: `before/will/after` x `enter/update/leave`.

> Check out an example <a href="https://codesandbox.io/s/github/makeflow/boring-router/tree/master/packages/examples/lifecycle-hooks?file=/main.tsx&amp;expanddevtools=1" target="_blank" >here</a>.

## Hook Phases

### Before Hooks

"Before hooks" (`beforeEnter`/`beforeUpdate`/`beforeLeave`) are called before applying a navigation. All of the "before hooks" support asynchronous callbacks and allow cancellation or interruption in between. This means if another navigation is queued before "before" phase completes, the current navigation will be interrupted.

So besides returning `false` in a "before hook" to cancel a navigation, it is designed to allow additional navigation within a "before hook" to interrupt current navigation:

```ts
route.task.numericId.$beforeEnter(async next => {
  let id = await getTaskIdByNumericId(next.$params.numericId);
  route.task.id.$replace({id});
});
```

### Will Hooks

"Will hooks" (`willEnter`/`willUpdate`/`willLeave`) are called once all the "before hooks" are called and the navigation has not been cancelled or interrupted. "Will hooks" can also be asynchronous. But unlike "before hooks", it cannot cancel or interrupt a happening navigation. If another navigation is queued before "will" phase completes, it will be processed after the current navigation completes.

### After Hooks

"After hooks" (`afterEnter`/`afterUpdate`/`afterLeave`) are called just before navigation completes. The wording "after" is still considered accurate, because at this phase the route states have already been updated. "After hooks" are synchronous hooks, you can do anything you want in those hooks as it's no longer within the scope of Boring Router.

## Hook Types

### Enter Hooks

"Enter hooks" (`beforeEnter`/`willEnter`/`afterEnter`) are called during a navigation that turns specific routes from not matched to matched (`$matched`). Entering a child route will also enter its parent route. E.g.:

- `/account` -> `/settings/security` will have "enter hooks" correspondent to `/settings` and `/settings/security` be called.
- `/settings/security` -> `/settings/notification` will only have "enter hooks" correspondent to `/settings/notification` be called.

### Update Hooks

"Update hooks" (`beforeUpdate`/`willUpdate`/`afterUpdate`) are called during a navigation that updates specific routes. There are several situations:

- `/account/123` -> `/account/456` will have "update hooks" correspondent to `/account/:account-id` be called. "Update hooks" on route `/account` are not called, because its own states or parameters are not changed.
- `/account/123/profile` -> `/account/456/profile` will have "update hooks" correspondent to `/account/:account-id` and `/account/:account-id/profile` be called. Because the `profile` route inherits parameters from its parent.
- `/account` -> `/account/123` (or vice versa) will have "update hooks" correspondent to `/account` be called. This is because the state `$exact` of route `/account` changes from `true` to `false`.

Note that query changes **WILL NOT** trigger "update hooks", however `$params` are of course observable.

### Leave Hooks

"Leave hooks" (`beforeLeave`/`willLeave`/`afterLeave`) are called during a navigation that turns specific routes from matched (`$matched`) to the other way.
