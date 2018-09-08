import {createMemoryHistory} from 'history';

import {RouteMatch, Router} from '../bld/library';

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
          $match: RouteMatch.fragment,
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
    invalid: {
      $query: {
        value: true,
      },
      $children: {
        value: {
          $match: RouteMatch.fragment,
        },
      },
    },
    notFound: {
      $match: RouteMatch.rest,
    },
  },
  history,
);

beforeAll(async () => {});

test('should match `default`', () => {
  expect(router.default.$matched).toBe(true);
  expect(router.default.$exact).toBe(true);
  expect<object>({...router.default.$params}).toEqual({});
});

test('should match `notFound`', () => {
  history.push('/boring');

  expect(router.notFound.$matched).toBe(true);
  expect(router.notFound.$exact).toBe(true);
  expect({...router.notFound.$params}).toEqual({notFound: 'boring'});

  history.push('/boring/router?foo=bar');

  expect(router.notFound.$matched).toBe(true);
  expect(router.notFound.$exact).toBe(true);
  expect({...router.notFound.$params}).toEqual({notFound: 'boring/router'});
});

test('should match `account`', () => {
  history.push('/account');

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

test('should match `account.id`', () => {
  history.push('/account/123');

  expect(router.account.$matched).toBe(true);
  expect(router.account.id.$matched).toBe(true);
  expect(router.account.id.$exact).toBe(true);

  expect({...router.account.$params}).toEqual({});
  expect({...router.account.id.$params}).toEqual({id: '123'});

  expect(router.account.id.$ref()).toBe('/account/123');
  expect(router.account.id.$ref({id: '456'})).toBe('/account/456');
});

test('should match `account.id.settings`', () => {
  history.push('/account/123/settings');

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

test('should match `account.id.billings`', () => {
  history.push('/account/123/billings?callback=/redirect');

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
