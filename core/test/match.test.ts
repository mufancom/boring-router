import {createMemoryHistory} from 'history';
import {configure} from 'mobx';

import {RouteMatch, Router} from '../bld/library';

import {nap} from './@utils';

configure({
  enforceActions: 'observed',
});

let history = createMemoryHistory();

let router = new Router<'popup' | 'sidebar'>(history);

let rootRoute = router.route({
  default: {
    $match: '',
  },
  account: {
    $query: {
      callback: true,
    },
    $exact: true,
    $children: {
      id: {
        $match: /\d+/,
        $exact: true,
        $children: {
          settings: true,
          billings: true,
        },
      },
    },
  },
  onlySidebar: {
    $exact: true,
    $children: {
      onlyChat: true,
    },
  },
  onlyFriends: {
    $exact: true,
    $children: {
      onlyTransfer: true,
    },
  },
  onlyPopup: true,
  multiple: {
    $children: {
      number: {
        $match: /\d+/,
      },
      mixed: {
        $match: RouteMatch.segment,
      },
    },
  },
  notFound: {
    $match: RouteMatch.rest,
  },
});

let popupRoute = router.route('popup', {
  invite: {
    $exact: true,
  },
});

let sidebarRoute = router.route('sidebar', {
  groups: {
    $exact: true,
    $children: {
      chat: true,
      call: true,
    },
  },
  friends: {
    $exact: true,
    $children: {
      chat: true,
      transfer: true,
      call: true,
    },
  },
});

rootRoute.onlySidebar.$parallel({groups: ['sidebar']});

rootRoute.onlySidebar.onlyChat.$parallel({
  matches: [sidebarRoute.friends.chat, sidebarRoute.groups.chat],
});

rootRoute.onlyFriends.$parallel({matches: [sidebarRoute.friends]});
rootRoute.onlyFriends.onlyTransfer.$parallel({
  matches: [sidebarRoute.friends.transfer],
});

rootRoute.onlyPopup.$parallel({groups: ['popup']});

test('should match `default`', async () => {
  await nap();

  expect(rootRoute.default.$matched).toBe(true);
  expect(rootRoute.default.$exact).toBe(true);
  expect<object>({...rootRoute.default.$params}).toEqual({});
});

test('should match `notFound`', async () => {
  history.push('/boring');

  await nap();

  expect(rootRoute.notFound.$matched).toBe(true);
  expect(rootRoute.notFound.$exact).toBe(true);
  expect({...rootRoute.notFound.$params}).toEqual({notFound: 'boring'});

  history.push('/boring/router?foo=bar');

  await nap();

  expect(rootRoute.notFound.$matched).toBe(true);
  expect(rootRoute.notFound.$exact).toBe(true);
  expect({...rootRoute.notFound.$params}).toEqual({notFound: 'boring/router'});
});

test('should match `account`', async () => {
  history.push('/account');

  await nap();

  expect(rootRoute.default.$matched).toBe(false);
  expect(rootRoute.default.$exact).toBe(false);

  expect(rootRoute.account.$matched).toBe(true);
  expect(rootRoute.account.$exact).toBe(true);
  expect({...rootRoute.account.$params}).toEqual({});

  expect(rootRoute.account.$ref()).toBe('/account');
  expect(() => rootRoute.account.id.$ref()).toThrow(
    'Parameter "id" is required',
  );
  expect(() => rootRoute.account.id.settings.$ref()).toThrow(
    'Parameter "id" is required',
  );
});

test('should match `notFound`', async () => {
  history.push('/account/boring');

  await nap();

  expect(rootRoute.account.$matched).toBe(false);
  expect(rootRoute.account.$exact).toBe(false);

  expect(rootRoute.notFound.$matched).toBe(true);
  expect(rootRoute.notFound.$exact).toBe(true);
});

test('should match `account.id`', async () => {
  history.push('/account/123');

  await nap();

  expect(rootRoute.account.$matched).toBe(true);
  expect(rootRoute.account.id.$matched).toBe(true);
  expect(rootRoute.account.id.$exact).toBe(true);

  expect({...rootRoute.account.$params}).toEqual({});
  expect({...rootRoute.account.id.$params}).toEqual({id: '123'});

  expect(rootRoute.account.id.$ref()).toBe('/account/123');
  expect(rootRoute.account.id.$ref({id: '456'})).toBe('/account/456');
});

test('should match `account.id.settings`', async () => {
  history.push('/account/123/settings');

  await nap();

  expect(rootRoute.account.$matched).toBe(true);
  expect(rootRoute.account.id.$matched).toBe(true);
  expect(rootRoute.account.id.settings.$matched).toBe(true);
  expect(rootRoute.account.id.settings.$exact).toBe(true);

  expect({...rootRoute.account.$params}).toEqual({});
  expect({...rootRoute.account.id.$params}).toEqual({id: '123'});
  expect({...rootRoute.account.id.settings.$params}).toEqual({id: '123'});

  expect(rootRoute.account.id.settings.$ref()).toBe('/account/123/settings');
  expect(rootRoute.account.id.settings.$ref({id: '456'})).toBe(
    '/account/456/settings',
  );
});

test('should match `account.id.billings`', async () => {
  history.push('/account/123/billings?callback=/redirect');

  await nap();

  expect(rootRoute.account.$matched).toBe(true);
  expect(rootRoute.account.id.$matched).toBe(true);
  expect(rootRoute.account.id.billings.$matched).toBe(true);
  expect(rootRoute.account.id.billings.$exact).toBe(true);

  expect({...rootRoute.account.$params}).toEqual({callback: '/redirect'});
  expect({...rootRoute.account.id.$params}).toEqual({
    id: '123',
    callback: '/redirect',
  });
  expect({...rootRoute.account.id.billings.$params}).toEqual({
    id: '123',
    callback: '/redirect',
  });

  expect(rootRoute.account.$ref({})).toBe('/account?callback=%2Fredirect');
  expect(rootRoute.account.id.billings.$ref({}, {preserveQuery: false})).toBe(
    '/account/123/billings',
  );
  expect(rootRoute.account.id.billings.$ref({})).toBe(
    '/account/123/billings?callback=%2Fredirect',
  );
  expect(rootRoute.account.id.billings.$ref({callback: undefined})).toBe(
    '/account/123/billings',
  );
});

test('should match `multiple.number`', async () => {
  history.push('/multiple/123');

  await nap();

  expect(rootRoute.multiple.number.$matched).toBe(true);
  expect(rootRoute.multiple.number.$exact).toBe(true);

  expect(rootRoute.multiple.mixed.$matched).toBe(false);
});

test('should match `multiple.mixed`', async () => {
  history.push('/multiple/123abc');

  await nap();

  expect(rootRoute.multiple.mixed.$matched).toBe(true);
  expect(rootRoute.multiple.mixed.$exact).toBe(true);

  expect(rootRoute.multiple.number.$matched).toBe(false);

  history.push('/multiple/abc123');

  await nap();

  expect(rootRoute.multiple.mixed.$matched).toBe(true);
  expect(rootRoute.multiple.mixed.$exact).toBe(true);

  expect(rootRoute.multiple.number.$matched).toBe(false);
});

test('should match `$group`', async () => {
  expect(rootRoute.default.$group).toBe(undefined);
  expect(rootRoute.account.id.$group).toBe(undefined);
  expect(popupRoute.$group).toBe('popup');
  expect(popupRoute.invite.$group).toBe('popup');
});

test('should match parallel `account`, `friends` and `invite`', async () => {
  history.push('/account');

  await nap();

  expect(rootRoute.account.$matched).toBe(true);
  expect(sidebarRoute.friends.$matched).toBe(false);

  sidebarRoute.friends.$push();

  await nap();

  expect(rootRoute.account.$matched).toBe(true);
  expect(sidebarRoute.friends.$matched).toBe(true);
  expect(rootRoute.account.$ref()).toBe('/account?_sidebar=/friends');

  popupRoute.invite.$push();

  await nap();

  expect(rootRoute.account.$matched).toBe(true);
  expect(sidebarRoute.friends.$matched).toBe(true);
  expect(popupRoute.invite.$matched).toBe(true);
  expect(rootRoute.account.$ref()).toBe(
    '/account?_sidebar=/friends&_popup=/invite',
  );
});

test('should match `friends.chat` then `friends.transfer`', async () => {
  history.push('/account/123');

  await nap();

  sidebarRoute.friends.$push();

  await nap();

  sidebarRoute.friends.chat.$push();

  await nap();

  expect(rootRoute.account.id.$matched).toBe(true);
  expect(sidebarRoute.friends.chat.$matched).toBe(true);
  expect(rootRoute.account.id.$ref()).toBe(
    '/account/123?_sidebar=/friends/chat',
  );

  sidebarRoute.friends.transfer.$replace();

  await nap();

  expect(rootRoute.account.id.$matched).toBe(true);
  expect(sidebarRoute.friends.chat.$matched).toBe(false);
  expect(sidebarRoute.friends.transfer.$matched).toBe(true);
  expect(rootRoute.account.id.$ref()).toBe(
    '/account/123?_sidebar=/friends/transfer',
  );
});

test('should switch from `friends.call` to `groups`', async () => {
  history.push('/account/123');

  await nap();

  sidebarRoute.friends.call.$push();

  await nap();

  sidebarRoute.groups.$push();

  await nap();

  expect(sidebarRoute.friends.call.$matched).toBe(false);
  expect(sidebarRoute.groups.$matched).toBe(true);
  expect(router.$ref()).toBe('/account/123?_sidebar=/groups');
});

test('parallel whitelist should take effect', async () => {
  history.push('/account?_sidebar=/friends/call&_popup=/invite');

  await nap();

  rootRoute.onlySidebar.$push();

  await nap();

  expect(rootRoute.onlySidebar.$matched).toBe(true);
  expect(sidebarRoute.friends.call.$matched).toBe(true);
  expect(popupRoute.invite.$matched).toBe(false);
  expect(router.$ref()).toBe(
    '/only-sidebar?_sidebar=/friends/call&_popup=/invite',
  );

  rootRoute.onlySidebar.onlyChat.$push();

  await nap();

  expect(rootRoute.onlySidebar.onlyChat.$matched).toBe(true);
  expect(sidebarRoute.friends.call.$matched).toBe(false);
  expect(popupRoute.invite.$matched).toBe(false);
  expect(router.$ref()).toBe(
    '/only-sidebar/only-chat?_sidebar=/friends/call&_popup=/invite',
  );

  sidebarRoute.groups.chat.$push();

  await nap();

  expect(rootRoute.onlySidebar.onlyChat.$matched).toBe(true);
  expect(sidebarRoute.groups.chat.$matched).toBe(true);
  expect(popupRoute.invite.$matched).toBe(false);
  expect(router.$ref()).toBe(
    '/only-sidebar/only-chat?_sidebar=/groups/chat&_popup=/invite',
  );

  rootRoute.onlyFriends.$push();

  await nap();

  expect(rootRoute.onlyFriends.$matched).toBe(true);
  expect(sidebarRoute.groups.chat.$matched).toBe(false);
  expect(popupRoute.invite.$matched).toBe(false);

  sidebarRoute.friends.chat.$replace();

  await nap();

  expect(sidebarRoute.friends.chat.$matched).toBe(true);

  rootRoute.onlyFriends.onlyTransfer.$replace();

  await nap();

  expect(sidebarRoute.friends.chat.$matched).toBe(false);

  sidebarRoute.friends.transfer.$replace();

  await nap();

  expect(sidebarRoute.friends.transfer.$matched).toBe(true);
  expect(router.$ref()).toBe(
    '/only-friends/only-transfer?_sidebar=/friends/transfer&_popup=/invite',
  );

  rootRoute.onlyPopup.$replace();

  await nap();

  expect(sidebarRoute.friends.transfer.$matched).toBe(false);
  expect(popupRoute.invite.$matched).toBe(true);
  expect(router.$ref()).toBe(
    '/only-popup?_sidebar=/friends/transfer&_popup=/invite',
  );
});

test("should leave and visit group 'sidebar' and 'popup' again", async () => {
  history.push('/account?_sidebar=/friends/call&_popup=/invite');

  await nap();

  rootRoute.$push(undefined, {leaves: ['sidebar'], rest: true});

  await nap();

  expect(router.$ref()).toBe('/account?_popup=/invite');

  popupRoute.invite.$replace({}, {leave: true});

  await nap();

  expect(router.$ref()).toBe('/account');

  popupRoute.invite.$push();

  await nap();

  sidebarRoute.friends.$push();

  await nap();

  expect(router.$ref()).toBe('/account?_popup=/invite&_sidebar=/friends');
});

test("should leave parallel routes by 'leaves' options when push a new route", async () => {
  rootRoute.account.$push();

  await nap();

  sidebarRoute.friends.$push();

  await nap();

  popupRoute.invite.$push();

  await nap();

  expect(rootRoute.account.$matched).toBe(true);
  expect(sidebarRoute.friends.$matched).toBe(true);
  expect(popupRoute.invite.$matched).toBe(true);

  rootRoute.default.$push({}, {leaves: ['popup']});

  await nap();

  expect(rootRoute.default.$matched).toBe(true);
  expect(sidebarRoute.friends.$matched).toBe(true);
  expect(popupRoute.invite.$matched).toBe(false);

  rootRoute.account.$push({}, {leaves: ['sidebar']});

  await nap();

  popupRoute.invite.$push();

  await nap();

  expect(rootRoute.account.$matched).toBe(true);
  expect(sidebarRoute.friends.$matched).toBe(false);
  expect(popupRoute.invite.$matched).toBe(true);

  expect(router.$ref()).toBe('/account?_popup=/invite');
});

test('should leave all parallel routes', async () => {
  rootRoute.$push(undefined, {leaves: '*', rest: true});

  await nap();

  expect(router.$ref()).toBe('/account');
});

test('should build route with multiple matches', async () => {
  rootRoute.account.id.$push({id: '123'});

  await nap();

  router
    .$build(rootRoute.account, {callback: 'foo'}, {rest: true})
    .$and(popupRoute.invite)
    .$push();

  await nap();

  expect(router.$ref()).toBe('/account/123?_popup=/invite&callback=foo');
});
