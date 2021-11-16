import {
  RouteBuilder,
  RouteMatch,
  RouteMatchSharedToParamDict,
} from 'boring-router';
import {observer} from 'mobx-react-lite';
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
  stopPropagation?: boolean;
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
      stopPropagation: toStopPropagation = false,
      onClick,
      ...restProps
    } = props;

    let href = (() => {
      try {
        if (to instanceof RouteMatch) {
          return to.$router.$(to, params).$href();
        } else {
          return to.$href();
        }
      } catch (error) {
        return '#';
      }
    })();

    let composedOnClick = composeEventHandler(
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

          if (toStopPropagation) {
            event.stopPropagation();
          }

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

    return <a {...restProps} href={href} onClick={composedOnClick} />;
  },
);
