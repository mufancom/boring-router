import {RouteBuilder, RouteMatch} from 'boring-router';
import classNames from 'classnames';
import {observer} from 'mobx-react-lite';
import React from 'react';

import {Link, LinkProps} from './link';

export interface NavLinkProps<T extends RouteMatch | RouteBuilder>
  extends LinkProps<T> {
  exact?: boolean;
  activeClassName?: string;
}

export const NavLink = observer(
  <T extends RouteMatch | RouteBuilder>(props: NavLinkProps<T>) => {
    let {to, exact = false} = props;

    let route = (() => {
      if (to instanceof RouteBuilder) {
        let builderRoute = to.$route;

        if (!(builderRoute instanceof RouteMatch)) {
          throw new Error(
            '`RouteBuilder` for `NavLink` component must have first building part as a `Route`',
          );
        }

        return builderRoute;
      } else {
        // eslint-disable-next-line @mufan/no-unnecessary-type-assertion
        return to as RouteMatch;
      }
    })();

    let matched = exact ? route.$exact : route.$matched;

    let {
      className,
      activeClassName = 'active',
      exact: _exact,
      ...restProps
    } = props;

    return (
      <Link
        className={classNames(className, matched && activeClassName)}
        {...restProps}
      />
    );
  },
);
