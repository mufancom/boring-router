import {createMemoryHistory} from 'history';
import {configure} from 'mobx';

import {RouteMatch, Router} from '../bld/library';

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
            billings: {
              $query: {
                callback: true,
              },
            },
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
  },
  {
    popup: {
      invite: {
        $exact: true,
      },
    },
    sidebar: {
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
    },
  },
  history,
);

router.onlySidebar.$parallel({groups: ['sidebar']});
router.onlySidebar.onlyChat.$parallel({
  matches: [router.$.sidebar.friends.chat, router.$.sidebar.groups.chat],
});

router.onlyFriends.$parallel({matches: [router.$.sidebar.friends]});
router.onlyFriends.onlyTransfer.$parallel({
  matches: [router.$.sidebar.friends.transfer],
});

router.onlyPopup.$parallel({groups: ['popup']});

test('should match `default`', async () => {
  await nap();

  expect(router.default.$matched).toBe(true);
  expect(router.default.$exact).toBe(true);
  expect<object>({...router.default.$params}).toEqual({});
});

test('should match `notFound`', async () => {
  history.push('/boring');

  await nap();

  expect(router.notFound.$matched).toBe(true);
  expect(router.notFound.$exact).toBe(true);
  expect({...router.notFound.$params}).toEqual({notFound: 'boring'});

  history.push('/boring/router?foo=bar');

  await nap();

  expect(router.notFound.$matched).toBe(true);
  expect(router.notFound.$exact).toBe(true);
  expect({...router.notFound.$params}).toEqual({notFound: 'boring/router'});
});

test('should match `account`', async () => {
  history.push('/account');

  await nap();

  expect(router.default.$matched).toBe(false);
  expect(router.default.$exact).toBe(false);

  expect(router.account.$matched).toBe(true);
  expect(router.account.$exact).toBe(true);
  expect({...router.account.$params}).toEqual({});

  expect(router.account.$ref()).toBe('/account');
  expect(() => router.account.id.$ref()).toThrow('Parameter "id" is required');
  expect(() => router.account.id.settings.$ref()).toThrow(
    'Parameter "id" is required',
  );
});

test('should match `notFound`', async () => {
  history.push('/account/boring');

  await nap();

  expect(router.account.$matched).toBe(false);
  expect(router.account.$exact).toBe(false);

  expect(router.notFound.$matched).toBe(true);
  expect(router.notFound.$exact).toBe(true);
});

test('should match `account.id`', async () => {
  history.push('/account/123');

  await nap();

  expect(router.account.$matched).toBe(true);
  expect(router.account.id.$matched).toBe(true);
  expect(router.account.id.$exact).toBe(true);

  expect({...router.account.$params}).toEqual({});
  expect({...router.account.id.$params}).toEqual({id: '123'});

  expect(router.account.id.$ref()).toBe('/account/123');
  expect(router.account.id.$ref({id: '456'})).toBe('/account/456');
});

test('should match `account.id.settings`', async () => {
  history.push('/account/123/settings');

  await nap();

  expect(router.account.$matched).toBe(true);
  expect(router.account.id.$matched).toBe(true);
  expect(router.account.id.settings.$matched).toBe(true);
  expect(router.account.id.settings.$exact).toBe(true);

  expect({...router.account.$params}).toEqual({});
  expect({...router.account.id.$params}).toEqual({id: '123'});
  expect({...router.account.id.settings.$params}).toEqual({id: '123'});

  expect(router.account.id.settings.$ref()).toBe('/account/123/settings');
  expect(router.account.id.settings.$ref({id: '456'})).toBe(
    '/account/456/settings',
  );
});

test('should match `account.id.billings`', async () => {
  history.push('/account/123/billings?callback=/redirect');

  await nap();

  expect(router.account.$matched).toBe(true);
  expect(router.account.id.$matched).toBe(true);
  expect(router.account.id.billings.$matched).toBe(true);
  expect(router.account.id.billings.$exact).toBe(true);

  expect({...router.account.$params}).toEqual({callback: '/redirect'});
  expect({...router.account.id.$params}).toEqual({id: '123'});
  expect({...router.account.id.billings.$params}).toEqual({
    id: '123',
    callback: '/redirect',
  });

  expect(router.account.$ref({}, true)).toBe('/account?callback=%2Fredirect');
  expect(router.account.id.billings.$ref()).toBe('/account/123/billings');
  expect(router.account.id.billings.$ref({}, true)).toBe(
    '/account/123/billings?callback=%2Fredirect',
  );
});

test('should match `multiple.number`', async () => {
  history.push('/multiple/123');

  await nap();

  expect(router.multiple.number.$matched).toBe(true);
  expect(router.multiple.number.$exact).toBe(true);

  expect(router.multiple.mixed.$matched).toBe(false);
});

test('should match `multiple.mixed`', async () => {
  history.push('/multiple/123abc');

  await nap();

  expect(router.multiple.mixed.$matched).toBe(true);
  expect(router.multiple.mixed.$exact).toBe(true);

  expect(router.multiple.number.$matched).toBe(false);

  history.push('/multiple/abc123');

  await nap();

  expect(router.multiple.mixed.$matched).toBe(true);
  expect(router.multiple.mixed.$exact).toBe(true);

  expect(router.multiple.number.$matched).toBe(false);
});

test('should match `$group`', async () => {
  expect(router.default.$group).toBe(undefined);
  expect(router.account.id.$group).toBe(undefined);
  expect(router.$.popup.$group).toBe('popup');
  expect(router.$.popup.invite.$group).toBe('popup');
});

test('should match parallel `account`, `friends` and `invite`', async () => {
  history.push('/account');

  await nap();

  expect(router.account.$matched).toBe(true);
  expect(router.$.sidebar.friends.$matched).toBe(false);

  router.$.sidebar.friends.$push();

  await nap();

  expect(router.account.$matched).toBe(true);
  expect(router.$.sidebar.friends.$matched).toBe(true);
  expect(router.account.$ref()).toBe('/account?_sidebar=/friends');

  router.$.popup.invite.$push();

  await nap();

  expect(router.account.$matched).toBe(true);
  expect(router.$.sidebar.friends.$matched).toBe(true);
  expect(router.$.popup.invite.$matched).toBe(true);
  expect(router.account.$ref()).toBe(
    '/account?_sidebar=/friends&_popup=/invite',
  );
});

test('should match `friends.chat` then `friends.transfer`', async () => {
  history.push('/account/123');

  await nap();

  router.$.sidebar.friends.$push();

  await nap();

  router.$.sidebar.friends.chat.$push();

  await nap();

  expect(router.account.id.$matched).toBe(true);
  expect(router.$.sidebar.friends.chat.$matched).toBe(true);
  expect(router.account.id.$ref()).toBe('/account/123?_sidebar=/friends/chat');

  router.$.sidebar.friends.transfer.$replace();

  await nap();

  expect(router.account.id.$matched).toBe(true);
  expect(router.$.sidebar.friends.chat.$matched).toBe(false);
  expect(router.$.sidebar.friends.transfer.$matched).toBe(true);
  expect(router.account.id.$ref()).toBe(
    '/account/123?_sidebar=/friends/transfer',
  );
});

test('should switch from `friends.call` to `groups`', async () => {
  history.push('/account/123');

  await nap();

  router.$.sidebar.friends.call.$push();

  await nap();

  router.$.sidebar.groups.$push();

  await nap();

  expect(router.$.sidebar.friends.call.$matched).toBe(false);
  expect(router.$.sidebar.groups.$matched).toBe(true);
  expect(router.$ref()).toBe('/account/123?_sidebar=/groups');
});

test('parallel whitelist should take effect', async () => {
  history.push('/account?_sidebar=/friends/call&_popup=/invite');

  await nap();

  router.onlySidebar.$push();

  await nap();

  expect(router.onlySidebar.$matched).toBe(true);
  expect(router.$.sidebar.friends.call.$matched).toBe(true);
  expect(router.$.popup.invite.$matched).toBe(false);
  expect(router.$ref()).toBe(
    '/only-sidebar?_sidebar=/friends/call&_popup=/invite',
  );

  router.onlySidebar.onlyChat.$push();

  await nap();

  expect(router.onlySidebar.onlyChat.$matched).toBe(true);
  expect(router.$.sidebar.friends.call.$matched).toBe(false);
  expect(router.$.popup.invite.$matched).toBe(false);
  expect(router.$ref()).toBe(
    '/only-sidebar/only-chat?_sidebar=/friends/call&_popup=/invite',
  );

  router.$.sidebar.groups.chat.$push();

  await nap();

  expect(router.onlySidebar.onlyChat.$matched).toBe(true);
  expect(router.$.sidebar.groups.chat.$matched).toBe(true);
  expect(router.$.popup.invite.$matched).toBe(false);
  expect(router.$ref()).toBe(
    '/only-sidebar/only-chat?_sidebar=/groups/chat&_popup=/invite',
  );

  router.onlyFriends.$push();

  await nap();

  expect(router.onlyFriends.$matched).toBe(true);
  expect(router.$.sidebar.groups.chat.$matched).toBe(false);
  expect(router.$.popup.invite.$matched).toBe(false);

  router.$.sidebar.friends.chat.$replace();

  await nap();

  expect(router.$.sidebar.friends.chat.$matched).toBe(true);

  router.onlyFriends.onlyTransfer.$replace();

  await nap();

  expect(router.$.sidebar.friends.chat.$matched).toBe(false);

  router.$.sidebar.friends.transfer.$replace();

  await nap();

  expect(router.$.sidebar.friends.transfer.$matched).toBe(true);
  expect(router.$ref()).toBe(
    '/only-friends/only-transfer?_sidebar=/friends/transfer&_popup=/invite',
  );

  router.onlyPopup.$replace();

  await nap();

  expect(router.$.sidebar.friends.transfer.$matched).toBe(false);
  expect(router.$.popup.invite.$matched).toBe(true);
  expect(router.$ref()).toBe(
    '/only-popup?_sidebar=/friends/transfer&_popup=/invite',
  );
});

test("should leave and visit group 'sidebar' and 'popup' again", async () => {
  history.push('/account?_sidebar=/friends/call&_popup=/invite');

  await nap();

  router.$push({leaves: ['sidebar']});

  await nap();

  expect(router.$ref()).toBe('/account?_popup=/invite');

  router.$.popup.invite.$replace({}, {leave: true});

  await nap();

  expect(router.$ref()).toBe('/account');

  router.$.popup.invite.$push();

  await nap();

  router.$.sidebar.friends.$push();

  await nap();

  expect(router.$ref()).toBe('/account?_popup=/invite&_sidebar=/friends');
});

test("should leave parallel routes by 'leaves' options when push a new route", async () => {
  router.account.$push();

  await nap();

  router.$.sidebar.friends.$push();

  await nap();

  router.$.popup.invite.$push();

  await nap();

  expect(router.account.$matched).toBe(true);
  expect(router.$.sidebar.friends.$matched).toBe(true);
  expect(router.$.popup.invite.$matched).toBe(true);

  router.default.$push({}, {leaves: ['popup']});

  await nap();

  expect(router.default.$matched).toBe(true);
  expect(router.$.sidebar.friends.$matched).toBe(true);
  expect(router.$.popup.invite.$matched).toBe(false);

  router.account.$push({}, {leaves: ['sidebar']});

  await nap();

  router.$.popup.invite.$push();

  await nap();

  expect(router.account.$matched).toBe(true);
  expect(router.$.sidebar.friends.$matched).toBe(false);
  expect(router.$.popup.invite.$matched).toBe(true);

  expect(router.$ref()).toBe('/account?_popup=/invite');
});
