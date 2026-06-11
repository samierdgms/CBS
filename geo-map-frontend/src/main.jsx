import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './App.css'
import './index.css';


import { BrowserRouter } from 'react-router-dom';

import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>,
)