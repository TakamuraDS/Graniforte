
import React from 'react';
import { View, User } from '../types';

interface HeaderProps {
    activeView: View;
    setActiveView: (view: View) => void;
    currentUser: User;
    onLogout: () => void;
    customLogo: string | null;
}

export const Header: React.FC<HeaderProps> = ({ activeView, setActiveView, currentUser, onLogout, customLogo }) => {
    const navItems = Object.values(View);

    return (
        <header className="bg-white dark:bg-slate-800/75 backdrop-blur-lg shadow-sm sticky top-0 z-40 print:hidden border-b border-slate-200 dark:border-slate-700">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <div className="flex items-center">
                        {customLogo ? (
                             <img src={customLogo} alt="Custom Logo" className="max-h-12 w-auto" />
                        ) : (
                             <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect width="32" height="32" rx="8" className="fill-brand-primary-500"/>
                                <path d="M19.5 11.5L12.5 18.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M15 21L12.5 18.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M12.5 18.5L9 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M23 15L19.5 11.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        )}
                        <span className="text-slate-800 dark:text-white text-xl font-bold ml-3 hidden sm:block">Graniforte Estoque</span>
                    </div>
                    <div className="flex items-center">
                        <div className="hidden md:block">
                            <nav className="ml-10 flex items-baseline space-x-2">
                                {navItems.map((item) => (
                                    <button
                                        key={item}
                                        onClick={() => setActiveView(item)}
                                        className={`relative px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                                            activeView === item
                                                ? 'text-brand-primary-600 dark:text-brand-primary-400'
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        {item}
                                         {activeView === item && (
                                            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-brand-primary-500 rounded-full"></span>
                                        )}
                                    </button>
                                ))}
                            </nav>
                        </div>
                        <div className="ml-6 flex items-center">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{currentUser.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{currentUser.role} {currentUser.location && `- ${currentUser.location}`}</p>
                            </div>
                            <img src={currentUser.photo} alt="User" className="w-10 h-10 rounded-full ml-3 object-cover" />
                            <button onClick={onLogout} className="ml-4 p-2 text-slate-500 hover:text-brand-primary-600 dark:text-slate-400 dark:hover:text-white transition-colors" title="Sair">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};