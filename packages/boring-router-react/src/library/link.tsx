import {RouteMatch, RouteMatchSharedToParamDict} from 'boring-router';
import {computed} from 'mobx';
import {observer} from 'mobx-react';
import React, {Component, HTMLAttributes, MouseEvent, ReactNode} from 'react';

import {composeEventHandler} from './@utils';

export interface LinkProps<TRouteMatch extends RouteMatch>
  extends HTMLAttributes<HTMLAnchorElement> {
  className?: string;
  to: TRouteMatch;
  params?: RouteMatchSharedToParamDict<TRouteMatch>;
  replace?: boolean;
  toggle?: boolean;
  leave?: boolean;
  children: ReactNode;
}

@observer
export class Link<TRouteMatch extends RouteMatch> extends Component<
  LinkProps<TRouteMatch>
> {
  @computed
  private get href(): string {
    let {to, params} = this.props;

    try {
      return to.$href(params);
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

    if (leave === undefined) {
      leave = toggle && to.$matched;
    }

    if (replace) {
      to.$replace(params, {leave});
    } else {
      to.$push(params, {leave});
    }
  };
}
