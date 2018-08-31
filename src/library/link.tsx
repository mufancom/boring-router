import {History} from 'history';
import {observer} from 'mobx-react';
import React, {Component, ReactNode, createContext} from 'react';
import {EmptyObjectPatch} from 'tslang';

import {RouteMatch} from './route-match';

const {Provider: HistoryProvider, Consumer: HistoryConsumer} = createContext<
  History
>(undefined!);

export interface LinkProps<TRouteMatch> {
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
            onClick={() => this.onClick(history)}
            href="javascript:;"
            children={children}
          />
        )}
      </HistoryConsumer>
    );
  }

  private onClick = (history: History): void => {
    let {to, params, preserveQuery} = this.props;

    if (to instanceof RouteMatch) {
      to = to.$ref(params, preserveQuery);
    }

    history.push(to);
  };
}

export {HistoryProvider};
