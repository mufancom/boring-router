import {RouteMatch} from 'boring-router';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import {EmptyObjectPatch} from 'tslang';

import {then} from './@utils';

export interface RedirectProps<
  TRouteMatch extends RouteMatch,
  TToRouteMatch extends RouteMatch
> {
  match: TRouteMatch | TRouteMatch[];
  exact?: boolean;
  to: TToRouteMatch;
  params?: TToRouteMatch extends RouteMatch<infer TParamDict>
    ? Partial<TParamDict> & EmptyObjectPatch
    : never;
  preserveQuery?: boolean;
  push?: boolean;
}

@observer
export class Redirect<
  TRouteMatch extends RouteMatch,
  TToRouteMatch extends RouteMatch
> extends Component<RedirectProps<TRouteMatch, TToRouteMatch>> {
  render(): ReactNode {
    let {match, exact} = this.props;

    let matched: boolean;

    if (typeof match === 'boolean') {
      matched = match;
    } else {
      let matches = Array.isArray(match) ? match : [match];

      matched = matches.some(match => (exact ? match.$exact : match.$matched));
    }

    if (matched) {
      then(() => this.redirect());
    }

    return <></>;
  }

  private redirect(): void {
    let {to, params, preserveQuery, push} = this.props;

    if (push) {
      to.$push(params, preserveQuery);
    } else {
      to.$replace(params, preserveQuery);
    }
  }
}
