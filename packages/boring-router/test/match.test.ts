import {MemoryHistory, RouteMatch, Router} from 'boring-router';
import {configure} from 'mobx';
import {AssertTrue, IsEqual} from 'tslang';

import {nap} from './@utils';

configure({
  enforceActions: 'observed',
});

let history = new MemoryHistory();

let router = new Router<'popup' | 'sidebar'>(history);

let primaryRoute = router.$route({
  $children: {
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
          $metadata: {
            'sub-title': 123,
          },
        },
      },
      $metadata: {
        title: 'account',
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
          $match: RouteMatch.SEGMENT,
        },
      },
    },
    exactExtension: {
      $exact: 'extension',
      $children: {
        extension: true,
      },
    },
    queryTest1: {
      $exact: true,
      $query: {
        foo: true,
        bar: 'bar',
        pia: 'pia',
        hia: 'hia',
        yo: 'yo-1',
      },
      $children: {
        subPath: true,
      },
    },
    queryTest2: {
      $exact: true,
      $query: {
        foo: true,
        bar: 'bar',
        hia: true,
        yo: 'yo-2',
      },
      $children: {
        subPath: {
          $query: {
            pia: 'pia',
            yo: 'yo-1',
          },
        },
      },
    },
    notFound: {
      $match: RouteMatch.REST,
    },
  },
});

let popupRoute = router.$route('popup', {
  $children: {
    invite: {
      $exact: true,
    },
  },
});

let sidebarRoute = router.$route('sidebar', {
  $children: {
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
});

primaryRoute.onlySidebar.$parallel({groups: ['sidebar']});

primaryRoute.onlySidebar.onlyChat.$parallel({
  matches: [sidebarRoute.friends.chat, sidebarRoute.groups.chat],
});

primaryRoute.onlyFriends.$parallel({matches: [sidebarRoute.friends]});
primaryRoute.onlyFriends.onlyTransfer.$parallel({
  matches: [sidebarRoute.friends.transfer],
});

primaryRoute.onlyPopup.$parallel({groups: ['popup']});

test('should match `default`', async () => {
  await nap();

  expect(primaryRoute.$matched).toBe(true);
  expect(primaryRoute.$exact).toBe(true);
  expect<object>({...primaryRoute.$params}).toEqual({});
});

test('should match `notFound`', async () => {
  await history.push('/boring');

  await nap();

  expect(primaryRoute.notFound.$matched).toBe(true);
  expect(primaryRoute.notFound.$exact).toBe(true);
  expect({...primaryRoute.notFound.$params}).toEqual({notFound: 'boring'});

  await history.push('/boring/router?foo=bar');

  await nap();

  expect(primaryRoute.notFound.$matched).toBe(true);
  expect(primaryRoute.notFound.$exact).toBe(true);
  expect({...primaryRoute.notFound.$params}).toEqual({
    notFound: 'boring/router',
  });
});

test('should match `account`', async () => {
  await history.push('/account');

  await nap();

  expect(primaryRoute.$matched).toBe(true);
  expect(primaryRoute.$exact).toBe(false);

  expect(primaryRoute.account.$matched).toBe(true);
  expect(primaryRoute.account.$exact).toBe(true);
  expect({...primaryRoute.account.$params}).toEqual({});

  expect(router.$(primaryRoute.account).$ref()).toBe('/account');
  expect(() => router.$(primaryRoute.account.id).$ref()).toThrow(
    'Parameter "id" is required',
  );
  expect(() => router.$(primaryRoute.account.id.settings).$ref()).toThrow(
    'Parameter "id" is required',
  );
});

test('should match `notFound`', async () => {
  await history.push('/account/boring');

  await nap();

  expect(primaryRoute.account.$matched).toBe(false);
  expect(primaryRoute.account.$exact).toBe(false);

  expect(primaryRoute.notFound.$matched).toBe(true);
  expect(primaryRoute.notFound.$exact).toBe(true);
});

test('should match `account.id`', async () => {
  await history.push('/account/123');

  await nap();

  expect(primaryRoute.account.$matched).toBe(true);
  expect(primaryRoute.account.id.$matched).toBe(true);
  expect(primaryRoute.account.id.$exact).toBe(true);

  expect({...primaryRoute.account.$params}).toEqual({});
  expect({...primaryRoute.account.id.$params}).toEqual({id: '123'});

  expect(router.$(primaryRoute.account.id).$ref()).toBe('/account/123');
  expect(router.$(primaryRoute.account.id, {id: '456'}).$ref()).toBe(
    '/account/456',
  );
});

test('metadata should be merged', async () => {
  let accountMetadata = primaryRoute.account.$metadata;
  let accountIdMetadata = primaryRoute.account.id.$metadata;

  // @ts-ignore
  type __Assertion =
    // line-break
    AssertTrue<IsEqual<typeof accountMetadata, {title: string}>>;

  // @ts-ignore
  type __Assertion =
    // line-break
    AssertTrue<
      IsEqual<typeof accountIdMetadata, {title: string; 'sub-title': number}>
    >;

  expect(accountMetadata).toEqual({title: 'account'});
  expect(accountIdMetadata).toEqual({title: 'account', 'sub-title': 123});
});

test('should match `account.id.settings`', async () => {
  await history.push('/account/123/settings');

  await nap();

  expect(primaryRoute.account.$matched).toBe(true);
  expect(primaryRoute.account.id.$matched).toBe(true);
  expect(primaryRoute.account.id.settings.$matched).toBe(true);
  expect(primaryRoute.account.id.settings.$exact).toBe(true);

  expect({...primaryRoute.account.$params}).toEqual({});
  expect({...primaryRoute.account.id.$params}).toEqual({id: '123'});
  expect({...primaryRoute.account.id.settings.$params}).toEqual({id: '123'});

  expect(router.$(primaryRoute.account.id.settings).$ref()).toBe(
    '/account/123/settings',
  );
  expect(router.$(primaryRoute.account.id.settings, {id: '456'}).$ref()).toBe(
    '/account/456/settings',
  );
});

test('should match `account.id.billings`', async () => {
  await history.push('/account/123/billings?callback=/redirect');

  await nap();

  expect(primaryRoute.account.$matched).toBe(true);
  expect(primaryRoute.account.id.$matched).toBe(true);
  expect(primaryRoute.account.id.billings.$matched).toBe(true);
  expect(primaryRoute.account.id.billings.$exact).toBe(true);

  expect({...primaryRoute.account.$params}).toEqual({callback: '/redirect'});
  expect({...primaryRoute.account.id.$params}).toEqual({
    id: '123',
    callback: '/redirect',
  });
  expect({...primaryRoute.account.id.billings.$params}).toEqual({
    id: '123',
    callback: '/redirect',
  });

  expect(router.$(primaryRoute.account).$ref()).toBe(
    '/account?callback=%2Fredirect',
  );
  expect(
    router.$(primaryRoute.account.id.billings, {callback: undefined}).$ref(),
  ).toBe('/account/123/billings');
  expect(router.$(primaryRoute.account.id.billings).$ref()).toBe(
    '/account/123/billings?callback=%2Fredirect',
  );
});

test('should match `multiple.number`', async () => {
  await history.push('/multiple/123');

  await nap();

  expect(primaryRoute.multiple.number.$matched).toBe(true);
  expect(primaryRoute.multiple.number.$exact).toBe(true);

  expect(primaryRoute.multiple.mixed.$matched).toBe(false);
});

test('should match `multiple.mixed`', async () => {
  await history.push('/multiple/123abc');

  await nap();

  expect(primaryRoute.multiple.mixed.$matched).toBe(true);
  expect(primaryRoute.multiple.mixed.$exact).toBe(true);

  expect(primaryRoute.multiple.number.$matched).toBe(false);

  await history.push('/multiple/abc123');

  await nap();

  expect(primaryRoute.multiple.mixed.$matched).toBe(true);
  expect(primaryRoute.multiple.mixed.$exact).toBe(true);

  expect(primaryRoute.multiple.number.$matched).toBe(false);
});

test('should match `$group`', async () => {
  expect(primaryRoute.$group).toBe(undefined);
  expect(primaryRoute.account.id.$group).toBe(undefined);
  expect(popupRoute.$group).toBe('popup');
  expect(popupRoute.invite.$group).toBe('popup');
});

test('should match parallel `account`, `friends` and `invite`', async () => {
  await history.push('/account');

  await nap();

  expect(primaryRoute.account.$matched).toBe(true);
  expect(sidebarRoute.friends.$matched).toBe(false);

  sidebarRoute.friends.$push();

  await nap();

  expect(primaryRoute.account.$matched).toBe(true);
  expect(sidebarRoute.friends.$matched).toBe(true);
  expect(router.$(primaryRoute.account).$ref()).toBe(
    '/account?_sidebar=/friends',
  );

  popupRoute.invite.$push();

  await nap();

  expect(primaryRoute.account.$matched).toBe(true);
  expect(sidebarRoute.friends.$matched).toBe(true);
  expect(popupRoute.invite.$matched).toBe(true);

  expect(sidebarRoute.friends.$ref()).toBe('?_sidebar=/friends');
  expect(sidebarRoute.friends.$href()).toBe('/?_sidebar=/friends');

  expect(router.$(primaryRoute.account).$ref()).toBe(
    '/account?_popup=/invite&_sidebar=/friends',
  );
});

test('should match `friends.chat` then `friends.transfer`', async () => {
  await history.push('/account/123');

  await nap();

  sidebarRoute.friends.$push();

  await nap();

  sidebarRoute.friends.chat.$push();

  await nap();

  expect(primaryRoute.account.id.$matched).toBe(true);
  expect(sidebarRoute.friends.chat.$matched).toBe(true);
  expect(router.$(primaryRoute.account.id).$ref()).toBe(
    '/account/123?_sidebar=/friends/chat',
  );

  sidebarRoute.friends.transfer.$replace();

  await nap();

  expect(primaryRoute.account.id.$matched).toBe(true);
  expect(sidebarRoute.friends.chat.$matched).toBe(false);
  expect(sidebarRoute.friends.transfer.$matched).toBe(true);
  expect(router.$(primaryRoute.account.id).$ref()).toBe(
    '/account/123?_sidebar=/friends/transfer',
  );
});

test('should switch from `friends.call` to `groups`', async () => {
  await history.push('/account/123');

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
  await history.push('/account?_sidebar=/friends/call&_popup=/invite');

  await nap();

  primaryRoute.onlySidebar.$push();

  await nap();

  expect(primaryRoute.onlySidebar.$matched).toBe(true);
  expect(sidebarRoute.friends.call.$matched).toBe(true);
  expect(popupRoute.invite.$matched).toBe(false);
  expect(router.$ref()).toBe('/only-sidebar?_sidebar=/friends/call');

  primaryRoute.onlySidebar.onlyChat.$push();

  await nap();

  expect(primaryRoute.onlySidebar.onlyChat.$matched).toBe(true);
  expect(sidebarRoute.friends.call.$matched).toBe(false);
  expect(popupRoute.invite.$matched).toBe(false);
  expect(router.$ref()).toBe('/only-sidebar/only-chat');

  sidebarRoute.groups.chat.$push();

  await nap();

  expect(primaryRoute.onlySidebar.onlyChat.$matched).toBe(true);
  expect(sidebarRoute.groups.chat.$matched).toBe(true);
  expect(popupRoute.invite.$matched).toBe(false);
  expect(router.$ref()).toBe('/only-sidebar/only-chat?_sidebar=/groups/chat');

  primaryRoute.onlyFriends.$push();

  await nap();

  expect(primaryRoute.onlyFriends.$matched).toBe(true);
  expect(sidebarRoute.groups.chat.$matched).toBe(false);
  expect(popupRoute.invite.$matched).toBe(false);

  sidebarRoute.friends.chat.$replace();

  await nap();

  expect(sidebarRoute.friends.chat.$matched).toBe(true);

  primaryRoute.onlyFriends.onlyTransfer.$replace();

  await nap();

  expect(sidebarRoute.friends.chat.$matched).toBe(false);

  sidebarRoute.friends.transfer.$replace();

  await nap();

  expect(sidebarRoute.friends.transfer.$matched).toBe(true);
  expect(router.$ref()).toBe(
    '/only-friends/only-transfer?_sidebar=/friends/transfer',
  );

  router.$(primaryRoute.onlyPopup).$(popupRoute.invite).$replace();

  await nap();

  expect(sidebarRoute.friends.transfer.$matched).toBe(false);
  expect(popupRoute.invite.$matched).toBe(true);
  expect(router.$ref()).toBe('/only-popup?_popup=/invite');
});

test('should match exact extension', async () => {
  await history.push('/exact-extension');

  await nap();

  expect(primaryRoute.exactExtension.$matched).toBe(true);
  expect(primaryRoute.exactExtension.$exact).toBe(true);
  expect(primaryRoute.exactExtension.extension.$matched).toBe(true);
  expect(primaryRoute.exactExtension.extension.$exact).toBe(true);
});

test("should leave and visit group 'sidebar' and 'popup' again", async () => {
  await history.push('/account?_sidebar=/friends/call&_popup=/invite');

  await nap();

  primaryRoute.$rest.$push(undefined, {leaves: ['sidebar']});

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
  primaryRoute.account.$push();

  await nap();

  sidebarRoute.friends.$push();

  await nap();

  popupRoute.invite.$push();

  await nap();

  expect(primaryRoute.account.$matched).toBe(true);
  expect(sidebarRoute.friends.$matched).toBe(true);
  expect(popupRoute.invite.$matched).toBe(true);

  primaryRoute.$push({}, {leaves: ['popup']});

  await nap();

  expect(primaryRoute.$matched).toBe(true);
  expect(sidebarRoute.friends.$matched).toBe(true);
  expect(popupRoute.invite.$matched).toBe(false);

  primaryRoute.account.$push({}, {leaves: ['sidebar']});

  await nap();

  popupRoute.invite.$push();

  await nap();

  expect(primaryRoute.account.$matched).toBe(true);
  expect(sidebarRoute.friends.$matched).toBe(false);
  expect(popupRoute.invite.$matched).toBe(true);

  expect(router.$ref()).toBe('/account?_popup=/invite');
});

test('should leave all parallel routes', async () => {
  router.$scratch().$(primaryRoute.$rest).$push(undefined);

  await nap();

  expect(router.$ref()).toBe('/account');
});

test('should build route with multiple matches', async () => {
  primaryRoute.account.id.$push({id: '123'});

  await nap();

  router
    .$scratch()
    .$(primaryRoute.account.$rest, {callback: 'foo'})
    .$(popupRoute.invite)
    .$push();

  await nap();

  expect(router.$ref()).toBe('/account/123?_popup=/invite&callback=foo');
});

test('should router push with building part', async () => {
  router.$push('/account?_sidebar=/friends');

  await nap();

  expect(router.$ref()).toBe(
    '/account?_popup=/invite&_sidebar=/friends&callback=foo',
  );
});

test('should build route with string building part', async () => {
  expect(
    router
      .$scratch()
      .$('/account/456?callback=foo')
      .$('?_popup=/invite')
      .$('?_sidebar=/friends')
      .$ref(),
  ).toBe('/account/456?_popup=/invite&_sidebar=/friends&callback=foo');

  expect(popupRoute.$rest.$ref()).toBe('?_popup=/invite');

  expect(sidebarRoute.groups.$ref()).toBe('?_sidebar=/groups');
});

test('should build route with string building part without primary route', async () => {
  expect(
    router.$scratch().$('?_popup=/invite').$('?_sidebar=/friends').$ref(),
  ).toBe('?_popup=/invite&_sidebar=/friends');
});

test('should keep correct queries between navigation', async () => {
  primaryRoute.queryTest1.$push({
    foo: 'a',
    bar: 'b',
    pia: 'c',
    hia: 'd',
    yo: 'e',
  });

  await nap();

  expect(primaryRoute.queryTest1.$ref()).toBe(
    '/query-test-1?foo=a&bar=b&pia=c&hia=d&yo=e',
  );

  expect(primaryRoute.queryTest1.subPath.$ref()).toBe(
    '/query-test-1/sub-path?foo=a&bar=b&pia=c&hia=d&yo=e',
  );

  expect(primaryRoute.queryTest2.$ref()).toBe(
    '/query-test-2?foo=a&bar=b&hia=d',
  );

  expect(primaryRoute.queryTest2.subPath.$ref()).toBe(
    '/query-test-2/sub-path?foo=a&bar=b&pia=c&hia=d&yo=e',
  );

  primaryRoute.queryTest2.$push();

  await nap();

  expect(primaryRoute.queryTest2.$matched).toBe(true);

  expect(primaryRoute.queryTest2.$params).toEqual({
    foo: 'a',
    bar: 'b',
    hia: 'd',
  });
});
