import {History} from 'history';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import {EmptyObjectPatch} from 'tslang';

import {HistoryConsumer} from './history';
import {RouteMatch} from './route-match';

export interface LinkProps<TRouteMatch extends RouteMatch> {
  className?: string;
  to: TRouteMatch | string;
  params?: TRouteMatch extends RouteMatch<infer TParamDict>
    ? Partial<TParamDict> & EmptyObjectPatch
    : never;
  preserveQuery?: boolean;
  children: ReactNode;
}

@observer
export class Link<TRouteMatch extends RouteMatch> extends Component<
  LinkProps<TRouteMatch>
> {
  render(): ReactNode {
    let {className, children} = this.props;

    return (
      <HistoryConsumer>
        {history => (
          <a
            className={className}
            onClick={() => this.navigate(history)}
            href="javascript:;"
            children={children}
          />
        )}
      </HistoryConsumer>
    );
  }

  private navigate(history: History): void {
    let {to, params, preserveQuery} = this.props;

    if (to instanceof RouteMatch) {
      to = to.$ref(params, preserveQuery);
    }

    history.push(to);
  }
}
