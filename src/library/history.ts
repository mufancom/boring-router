import {History} from 'history';
import {createContext} from 'react';

const {Provider: HistoryProvider, Consumer: HistoryConsumer} = createContext<
  History
>(undefined!);

export {HistoryProvider, HistoryConsumer};
