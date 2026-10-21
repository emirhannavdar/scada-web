import {createRoot} from 'react-dom/client';
import {RouterProvider} from '@tanstack/react-router';
import {initializeContent} from './lib/cms-runtime';
import './styles.css';
import './corporate.css';
async function start(){if(!await initializeContent())return;const {getRouter}=await import('./router');const router=getRouter();createRoot(document.getElementById('root')!).render(<RouterProvider router={router}/>);}
void start();

import './experience.css';

import './voyage.css';

import "./drone.css";
import "./screen-explorer.css";

import './editorial.css';

import './theme.css';
import './mobile-refinements.css';
