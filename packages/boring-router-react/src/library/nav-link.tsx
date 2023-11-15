import {RouteBuilder, RouteMatch} from 'boring-router';
import classNames from 'classnames';
import {observer} from 'mobx-react-lite';
import type {ForwardedRef} from 'react';
import React, {forwardRef} from 'react';

import type {LinkProps} from './link.js';
import {Link} from './link.js';

export type NavLinkProps<T extends RouteMatch | RouteBuilder> = {
  exact?: boolean;
  activeClassName?: string;
} & LinkProps<T>;

export const NavLink = observer(
  forwardRef(
    <T extends RouteMatch | RouteBuilder>(
      props: NavLinkProps<T>,
      ref: ForwardedRef<HTMLAnchorElement>,
    ) => {
      const {to, exact = false} = props;

      const route = (() => {
        if (to instanceof RouteBuilder) {
          const builderRoute = to.$route;

          if (!(builderRoute instanceof RouteMatch)) {
            throw new Error(
              '`RouteBuilder` for `NavLink` component must have first building part as a `Route`',
            );
          }

          return builderRoute;
        } else {
          return to as RouteMatch;
        }
      })();

      const matched = exact ? route.$exact : route.$matched;

      const {
        className,
        activeClassName = 'active',
        exact: _exact,
        ...restProps
      } = props;

      return (
        <Link
          ref={ref}
          className={classNames(className, matched && activeClassName)}
          {...restProps}
        />
      );
    },
  ),
);
