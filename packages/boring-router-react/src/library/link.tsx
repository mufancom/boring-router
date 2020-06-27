import {
  RouteBuilder,
  RouteMatch,
  RouteMatchSharedToParamDict,
} from 'boring-router';
import {observer, useLocalStore} from 'mobx-react-lite';
import React, {
  HTMLAttributes,
  MouseEvent,
  MouseEventHandler,
  ReactNode,
  useCallback,
} from 'react';

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
  <T extends RouteMatch | RouteBuilder>({
    className,
    to,
    params,
    replace = false,
    toggle = false,
    leave,
    onClick,
    ...props
  }: LinkProps<T>) => {
    let store = useLocalStore(() => {
      return {
        get href() {
          try {
            if (to instanceof RouteMatch) {
              return to.$href(params);
            } else {
              return to.$href();
            }
          } catch (error) {
            return '#';
          }
          // eslint-disable-next-line @magicspace/empty-line-around-blocks
        },
      };
    });

    let composedOnClick: MouseEventHandler = useCallback(
      composeEventHandler(
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
      ),
      [onClick],
    );

    return (
      <a
        className={className}
        href={store.href}
        onClick={composedOnClick}
        {...props}
      />
    );
  },
);
