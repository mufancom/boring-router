import {History} from 'history';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import {EmptyObjectPatch} from 'tslang';

import {HistoryConsumer} from './history';
import {RouteMatch} from './route-match';

export interface RedirectProps<
  TRouteMatch extends RouteMatch,
  TToRouteMatch extends RouteMatch
> {
  match: TRouteMatch | TRouteMatch[] | boolean;
  exact?: boolean;
  to: TToRouteMatch | string;
  params?: TToRouteMatch extends RouteMatch<infer TParamDict>
    ? Partial<TParamDict> & EmptyObjectPatch
    : never;
  preserveQuery?: boolean;
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

    if (!matched) {
      return <></>;
    }

    return (
      <HistoryConsumer>
        {history => {
          this.redirect(history);
          return <></>;
        }}
      </HistoryConsumer>
    );
  }

  private redirect(history: History): void {
    let {to, params, preserveQuery} = this.props;

    if (to instanceof RouteMatch) {
      to = to.$ref(params, preserveQuery);
    }

    history.push(to);
  }
}
