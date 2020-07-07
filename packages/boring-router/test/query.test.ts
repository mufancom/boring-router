import {MemoryHistory, Router} from 'boring-router';
import {configure} from 'mobx';

import {nap} from './@utils';

configure({
  enforceActions: 'observed',
});

test('should preserve query with id `true` for sibling routes', async () => {
  let idsArray = [
    {foo: true, bar: true},
    {foo: true, bar: 'bar'},
    {foo: 'bar', bar: true},
  ] as const;

  for (let {foo: fooQueryId, bar: barQueryId} of idsArray) {
    const history = new MemoryHistory('/foo?a=1');

    const router = new Router(history);

    const route = router.$route({
      $children: {
        foo: {
          $query: {
            a: fooQueryId,
          },
        },
        bar: {
          $query: {
            a: barQueryId,
          },
        },
      },
    });

    await nap();

    expect(route.foo.$matched).toBe(true);
    expect(route.foo.$params.a).toBe('1');
    expect(route.bar.$matched).toBe(false);
    expect(route.bar.$params.a).toBe('1');
    expect(route.foo.$ref()).toBe('/foo?a=1');

    route.bar.$push();

    await nap();

    expect(route.foo.$matched).toBe(false);
    expect(route.foo.$params.a).toBe('1');
    expect(route.bar.$matched).toBe(true);
    expect(route.bar.$params.a).toBe('1');
    expect(route.bar.$ref()).toBe('/bar?a=1');
  }
});

test('should not preserve query with different ids for sibling routes', async () => {
  const history = new MemoryHistory('/foo?a=1');

  const router = new Router(history);

  const route = router.$route({
    $children: {
      foo: {
        $query: {
          a: 'foo-a',
        },
      },
      bar: {
        $query: {
          a: 'bar-a',
        },
      },
    },
  });

  await nap();

  expect(route.foo.$matched).toBe(true);
  expect(route.foo.$params.a).toBe('1');
  expect(route.bar.$matched).toBe(false);
  expect(route.bar.$params.a).toBe(undefined);
  expect(route.foo.$ref()).toBe('/foo?a=1');

  route.bar.$push();

  await nap();

  expect(route.foo.$matched).toBe(false);
  expect(route.foo.$params.a).toBe(undefined);
  expect(route.bar.$matched).toBe(true);
  expect(route.bar.$params.a).toBe(undefined);
  expect(route.bar.$ref()).toBe('/bar');
});

test('should preserve query with for inherited routes', async () => {
  const history = new MemoryHistory('/foo?a=1&b=2&c=3&d=4');

  const router = new Router(history);

  const route = router.$route({
    $children: {
      foo: {
        $exact: true,
        $query: {
          a: 'foo-a',
          b: 'foo-b',
          c: true,
          d: true,
        },
        $children: {
          bar: {
            $query: {
              a: 'bar-a',
              c: 'bar-c',
            },
          },
        },
      },
    },
  });

  await nap();

  expect(route.foo.$matched).toBe(true);
  expect(route.foo.$params).toEqual({
    a: '1',
    b: '2',
    c: '3',
    d: '4',
  });

  route.foo.bar.$push();

  await nap();

  expect(route.foo.$matched).toBe(true);
  expect(route.foo.$params).toEqual({
    b: '2',
    c: '3',
    d: '4',
  });
  expect(route.foo.bar.$matched).toBe(true);
  expect(route.foo.bar.$params).toEqual({
    b: '2',
    c: '3',
    d: '4',
  });
  expect(route.foo.bar.$ref()).toBe('/foo/bar?b=2&c=3&d=4');
});

test('should work with parallel routes', async () => {
  const history = new MemoryHistory('/foo?a=1');

  const router = new Router<'sidebar'>(history);

  const route = router.$route({
    $children: {
      foo: {
        $query: {
          a: true,
        },
      },
      yo: {
        $query: {
          a: 'yo-a',
        },
      },
    },
  });

  const sidebarRoute = router.$route('sidebar', {
    $children: {
      bar: {
        $query: {
          a: 'sidebar-bar-a',
        },
      },
    },
  });

  await nap();

  expect(route.foo.$matched).toBe(true);

  sidebarRoute.bar.$push();

  await nap();

  expect(route.foo.$matched).toBe(true);
  expect(route.foo.$params.a).toBe('1');
  expect(sidebarRoute.bar.$matched).toBe(true);
  expect(sidebarRoute.bar.$params.a).toBe('1');

  expect(router.$ref()).toBe('/foo?_sidebar=/bar&a=1');

  route.yo.$push();

  await nap();

  expect(route.yo.$matched).toBe(true);
  expect(route.yo.$params.a).toBe('1');
  // It's `undefined` because the router takes the query id from the earlier
  // defined route (in this case primary route).
  expect(sidebarRoute.bar.$params.a).toBe(undefined);
});
