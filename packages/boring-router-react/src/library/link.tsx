import {RouteMatch, RouteMatchSharedToParamDict} from 'boring-router';
import {action, observable} from 'mobx';
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
  @observable
  private href = 'javascript:;';

  render(): ReactNode {
    let {
      className,
      to,
      params,
      replace,
      toggle,
      onMouseEnter,
      onFocus,
      onClick,
      ...props
    } = this.props;

    return (
      <a
        className={className}
        href={this.href}
        onMouseEnter={composeEventHandler([onMouseEnter, this.onMouseEnter])}
        onFocus={composeEventHandler([onFocus, this.onFocus])}
        onClick={composeEventHandler([onClick, this.onClick], true)}
        {...props}
      />
    );
  }

  private onMouseEnter = (): void => {
    this.updateHref();
  };

  private onFocus = (): void => {
    this.updateHref();
  };

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

  @action
  private updateHref(): void {
    let {to, params} = this.props;

    try {
      this.href = to.$router.$(to, params).$href();
    } catch (error) {
      this.href = 'javascript:;';
    }
  }
}
