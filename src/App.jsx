import React, { useState } from 'react';
import { Icon, Icons } from './icons.jsx';
import { BatchTab } from './tabs/BatchTab.jsx';
import { BoardTab } from './tabs/BoardTab.jsx';
import { CreateTab } from './tabs/CreateTab.jsx';
import { SimulateTab } from './tabs/SimulateTab.jsx';
import './styles.css';

const TABS = [
  { id: 'board', label: 'Board' },
  { id: 'create', label: 'Create Deck' },
  { id: 'simulate', label: 'Simulate' },
  { id: 'batch', label: 'Analytics' },
];

export const App = () => {
  const [activeTab, setActiveTab] = useState('simulate');

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-50 backdrop-blur-md bg-opacity-90">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 flex items-center gap-2">
            <Icon path={Icons.Zap} className="text-emerald-400" /> Solitaire Omega v8
          </h1>
          <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-grow bg-slate-950 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'batch' && <BatchTab />}
          {activeTab === 'board' && <BoardTab />}
          {activeTab === 'create' && <CreateTab />}
          {activeTab === 'simulate' && <SimulateTab />}
        </div>
      </main>
    </div>
  );
};
