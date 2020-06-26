import {RouteBuilder, RouteMatch} from 'boring-router';
import classNames from 'classnames';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';

import {Link, LinkProps} from './link';

export interface NavLinkProps<TRouteMatch extends RouteMatch | RouteBuilder>
  extends LinkProps<TRouteMatch> {
  exact?: boolean;
  activeClassName?: string;
}

@observer
export class NavLink<
  TRouteMatch extends RouteMatch | RouteBuilder
> extends Component<NavLinkProps<TRouteMatch>> {
  render(): ReactNode {
    let {className, activeClassName = 'active', exact, ...props} = this.props;

    let {to: generalTo} = props;

    let to: RouteMatch;

    if (generalTo instanceof RouteBuilder) {
      let builderRoute = generalTo.$route;

      if (!(builderRoute instanceof RouteMatch)) {
        throw new Error(
          '`RouteBuilder` for `NavLink` component must have first building part as a `Route`',
        );
      }

      to = builderRoute;
    } else {
      to = generalTo as RouteMatch;
    }

    let matched = exact ? to.$exact : to.$matched;

    return (
      <Link
        className={classNames(className, matched && activeClassName)}
        {...props}
      />
    );
  }
}
