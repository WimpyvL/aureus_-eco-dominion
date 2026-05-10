/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import './index.css';
import './game/surveyDrillBuildingPatch';
import './game/undergroundViewPatch';
import './game/deepLedgerFoundationPatch';
import ReactDOM from 'react-dom/client';
import { Analytics } from "@vercel/analytics/react";
import { BrowserRouter } from 'react-router-dom';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    }}>
      <App />
    </BrowserRouter>
    <Analytics />
  </React.StrictMode>
);