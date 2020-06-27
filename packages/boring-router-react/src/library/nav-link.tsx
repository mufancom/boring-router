import {RouteBuilder, RouteMatch} from 'boring-router';
import classNames from 'classnames';
import {observer} from 'mobx-react-lite';
import React, {useMemo} from 'react';

import {Link, LinkProps} from './link';

export interface NavLinkProps<T extends RouteMatch | RouteBuilder>
  extends LinkProps<T> {
  exact?: boolean;
  activeClassName?: string;
}

export const NavLink = observer(
  <T extends RouteMatch | RouteBuilder>({
    className,
    activeClassName = 'active',
    exact,
    ...props
  }: NavLinkProps<T>) => {
    let {to} = props;

    let route = useMemo(() => {
      if (to instanceof RouteBuilder) {
        let builderRoute = to.$route;

        if (!(builderRoute instanceof RouteMatch)) {
          throw new Error(
            '`RouteBuilder` for `NavLink` component must have first building part as a `Route`',
          );
        }

        return builderRoute;
      } else {
        return to as RouteMatch;
      }
    }, [to]);

    let matched = exact ? route.$exact : route.$matched;

    return (
      <Link
        className={classNames(className, matched && activeClassName)}
        {...props}
      />
    );
  },
);
