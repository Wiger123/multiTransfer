import React from 'react';
import { Web3ReactProvider } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';

import { POLLING_INTERVAL } from './dapp/connectors';
import Header from './components/Header';

import BatchTransfer from './page/BatchTransfer';
import ProBatchTransfer from './page/ProBatchTransfer';

import './App.css';
export function getLibrary(provider: any): Web3Provider {
  const library = new Web3Provider(provider);
  library.pollingInterval = POLLING_INTERVAL;
  return library;
}

export default function APP() {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <div className="App flex flex-col">
        <Router>
          <Header></Header>
          <Switch>
            <Route path="/" exact component={BatchTransfer} />
            <Route path="/pro" component={ProBatchTransfer} />
          </Switch>
        </Router>
      </div>
    </Web3ReactProvider>
  );
}
