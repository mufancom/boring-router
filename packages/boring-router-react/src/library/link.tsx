import {
  RouteBuilder,
  RouteMatch,
  RouteMatchSharedToParamDict,
} from 'boring-router';
import {computed} from 'mobx';
import {observer} from 'mobx-react';
import React, {Component, HTMLAttributes, MouseEvent, ReactNode} from 'react';

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

@observer
export class Link<T extends RouteMatch | RouteBuilder> extends Component<
  LinkProps<T>
> {
  @computed
  private get href(): string {
    let {to, params} = this.props;

    try {
      if (to instanceof RouteMatch) {
        return to.$href(params);
      } else {
        return to.$href();
      }
    } catch (error) {
      return '#';
    }
  }

  render(): ReactNode {
    let {
      className,
      to,
      params,
      replace,
      toggle,
      onClick,
      ...props
    } = this.props;

    return (
      <a
        className={className}
        href={this.href}
        onClick={composeEventHandler([onClick, this.onClick], true)}
        {...props}
      />
    );
  }

  private onClick = (event: MouseEvent): void => {
    if (
      event.ctrlKey ||
      event.metaKey ||
      event.button === 1 /* middle button */
    ) {
      return;
    }

    event.preventDefault();

    let {to, params, replace, toggle = false, leave} = this.props;

    if (to instanceof RouteMatch) {
      let leaveOption =
        leave === undefined ? toggle && to.$matched : (leave as boolean);

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
  };
}
