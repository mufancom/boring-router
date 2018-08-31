import {History} from 'history';
import {computed} from 'mobx';
import {observer} from 'mobx-react';
import React, {Component, MouseEvent, ReactNode} from 'react';
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
            onClick={event => this.onClick(history, event)}
            href={this.href}
            children={children}
          />
        )}
      </HistoryConsumer>
    );
  }

  @computed
  private get href(): string {
    let {to, params, preserveQuery} = this.props;

    if (to instanceof RouteMatch) {
      to = to.$ref(params, preserveQuery);
    }

    return to;
  }

  private onClick(history: History, event: MouseEvent): void {
    event.preventDefault();
    history.push(this.href);
  }
}
