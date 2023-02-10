import {RouteBuilder, RouteMatch} from 'boring-router';
import classNames from 'classnames';
import {observer} from 'mobx-react-lite';
import type {RefObject} from 'react';
import React, {forwardRef} from 'react';

import type {LinkProps} from './link';
import {Link} from './link';

export interface NavLinkProps<T extends RouteMatch | RouteBuilder>
  extends LinkProps<T> {
  exact?: boolean;
  activeClassName?: string;
}

export const NavLink = observer(
  forwardRef(
    <T extends RouteMatch | RouteBuilder>(
      props: NavLinkProps<T>,
      ref: RefObject<HTMLAnchorElement>,
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
