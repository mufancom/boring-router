import type {RouteBuilder, RouteMatchSharedToParamDict} from 'boring-router';
import {RouteMatch} from 'boring-router';
import {observer} from 'mobx-react-lite';
import type {HTMLAttributes, MouseEvent, ReactNode, RefObject} from 'react';
import React, {forwardRef} from 'react';

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
  forwardRef(
    <T extends RouteMatch | RouteBuilder>(
      props: LinkProps<T>,
      ref: RefObject<HTMLAnchorElement>,
    ) => {
      const {
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

      const href = (() => {
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

      const composedOnClick = composeEventHandler(
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
              const leaveOption =
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

      return (
        <a ref={ref} {...restProps} href={href} onClick={composedOnClick} />
      );
    },
  ),
);
