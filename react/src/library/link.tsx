import {RouteMatch} from 'boring-router';
import {action, observable} from 'mobx';
import {observer} from 'mobx-react';
import React, {Component, MouseEvent, ReactNode} from 'react';
import {EmptyObjectPatch} from 'tslang';

export interface LinkProps<TRouteMatch extends RouteMatch> {
  className?: string;
  to: TRouteMatch;
  params?: TRouteMatch extends RouteMatch<infer TParamDict>
    ? Partial<TParamDict> & EmptyObjectPatch
    : never;
  preserveQuery?: boolean;
  replace?: boolean;
  children: ReactNode;
}

@observer
export class Link<TRouteMatch extends RouteMatch> extends Component<
  LinkProps<TRouteMatch>
> {
  @observable
  private href = 'javascript:;';

  render(): ReactNode {
    let {className, children} = this.props;

    return (
      <a
        className={className}
        href={this.href}
        onMouseEnter={this.onMouseEnter}
        onClick={this.onClick}
        children={children}
      />
    );
  }

  @action
  private onMouseEnter = (): void => {
    let {to, params, preserveQuery} = this.props;

    try {
      this.href = to.$ref(params, preserveQuery);
    } catch (error) {
      this.href = 'javascript:;';
    }
  };

  private onClick = (event: MouseEvent): void => {
    event.preventDefault();

    let {to, params, preserveQuery, replace} = this.props;

    if (replace) {
      to.$replace(params, preserveQuery);
    } else {
      to.$push(params, preserveQuery);
    }
  };
}
