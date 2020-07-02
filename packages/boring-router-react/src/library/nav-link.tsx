import {RouteBuilder, RouteMatch} from 'boring-router';
import classNames from 'classnames';
import {observer, useLocalStore} from 'mobx-react-lite';
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

    let store = useLocalStore(
      props => {
        return {
          get route() {
            let {to} = props;

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
            // eslint-disable-next-line @magicspace/empty-line-around-blocks
          },
          // eslint-disable-next-line @magicspace/empty-line-around-blocks
          get matched() {
            let {exact = false} = props;

            let route = this.route;

            return exact ? route.$exact : route.$matched;
            // eslint-disable-next-line @magicspace/empty-line-around-blocks
          },
        };
      },
      {to, exact},
    );

    let {
      className,
      activeClassName = 'active',
      exact: _exact,
      ...restProps
    } = props;

    return (
      <Link
        className={classNames(className, store.matched && activeClassName)}
        {...restProps}
      />
    );
  },
);
