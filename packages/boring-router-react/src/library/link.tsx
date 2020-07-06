import {
  RouteBuilder,
  RouteMatch,
  RouteMatchSharedToParamDict,
} from 'boring-router';
import {observer, useLocalStore} from 'mobx-react-lite';
import React, {HTMLAttributes, MouseEvent, ReactNode} from 'react';

import {composeEventHandler} from './@utils';

export interface LinkProps<T extends RouteMatch | RouteBuilder>
  extends HTMLAttributes<HTMLAnchorElement> {
  className?: string;
  to: T;
  params?: T extends RouteMatch ? RouteMatchSharedToParamDict<T> : undefined;
  replace?: boolean;
  children: ReactNode;
  toggle?: T extends RouteMatch ? boolean : undefined;
  leave?: T extends RouteMatch ? boolean : undefined;
}

export const Link = observer(
  <T extends RouteMatch | RouteBuilder>(props: LinkProps<T>) => {
    let {
      to,
      params,
      replace = false,
      toggle = false,
      // Do not provide `leave` option default value, check out its references.
      leave,
      onClick,
      ...restProps
    } = props;

    let store = useLocalStore(
      props => {
        return {
          get href() {
            let {to, params} = props;

            try {
              if (to instanceof RouteMatch) {
                return to.$router
                  .$((to as unknown) as RouteMatch, params)
                  .$href();
              } else {
                return to.$href();
              }
            } catch (error) {
              return '#';
            }
            // eslint-disable-next-line @magicspace/empty-line-around-blocks
          },
          // eslint-disable-next-line @magicspace/empty-line-around-blocks
          get composedOnClick() {
            let {to, params, leave, toggle, replace, onClick} = props;

            return composeEventHandler(
              [
                onClick,
                (event: MouseEvent) => {
                  if (
                    event.ctrlKey ||
                    event.metaKey ||
                    event.button === 1 /* middle button */
                  ) {
                    return;
                  }

                  event.preventDefault();

                  if (to instanceof RouteMatch) {
                    let leaveOption =
                      leave === undefined ? toggle && to.$matched : leave;

                    if (replace) {
                      to.$replace(params, {leave: leaveOption});
                    } else {
                      to.$push(params, {leave: leaveOption});
                    }
                  } else {
                    if (replace) {
                      to.$replace();
                    } else {
                      to.$push();
                    }
                  }
                },
              ],
              true,
            );
            // eslint-disable-next-line @magicspace/empty-line-around-blocks
          },
        };
      },
      {to, params, leave, toggle, replace, onClick},
    );

    return (
      <a {...restProps} href={store.href} onClick={store.composedOnClick} />
    );
  },
);
