
import React, { useState } from 'react';
import { User } from '../types';

interface LoginScreenProps {
    onLogin: (name: string, pass: string) => boolean;
    onDemoLogin: () => void;
    users: User[];
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onDemoLogin, users }) => {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const success = onLogin(name, password);
        if (!success) {
            setError('Nome de usuário ou senha inválidos.');
        } else {
            setError('');
        }
    };
    
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 p-4">
             <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl shadow-slate-300/20 dark:shadow-black/20">
                <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <svg width="40" height="40" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="32" height="32" rx="8" className="fill-brand-primary-500"/>
                            <path d="M19.5 11.5L12.5 18.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M15 21L12.5 18.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12.5 18.5L9 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M23 15L19.5 11.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Graniforte Estoque</h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">Bem-vindo(a) de volta! Faça login para continuar.</p>
                </div>
                
                <form className="space-y-6" onSubmit={handleSubmit}>
                     <div>
                        <label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome de Usuário</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            className="w-full px-4 py-2 mt-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary-500/50 focus:border-brand-primary-500 bg-slate-50 dark:bg-slate-700 transition"
                            placeholder="ex: Admin"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="password-input" className="text-sm font-medium text-slate-700 dark:text-slate-300">Senha</label>
                        <input
                            id="password-input"
                            name="password"
                            type="password"
                            required
                            className="w-full px-4 py-2 mt-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary-500/50 focus:border-brand-primary-500 bg-slate-50 dark:bg-slate-700 transition"
                            placeholder="********"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    
                    {error && <p className="text-sm text-red-500 text-center animate-shake">{error}</p>}

                    <div className="flex flex-col gap-3">
                        <button type="submit" className="w-full px-4 py-3 font-semibold text-white bg-brand-primary-600 rounded-lg hover:bg-brand-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-700 dark:focus:ring-offset-slate-800 transition-all duration-300 shadow-lg shadow-brand-primary-500/20 hover:shadow-xl hover:shadow-brand-primary-500/30">
                            Entrar
                        </button>
                        <button type="button" onClick={onDemoLogin} className="w-full px-4 py-3 font-semibold text-brand-primary-700 dark:text-brand-primary-300 bg-brand-primary-100 dark:bg-brand-primary-500/20 rounded-lg hover:bg-brand-primary-200 dark:hover:bg-brand-primary-500/30 transition-all duration-300">
                            Entrar em Modo Demonstração
                        </button>
                    </div>
                </form>
                 <div className="text-xs text-slate-400 text-center pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="font-semibold mb-1">Usuários de teste:</p>
                     {users.map(u => <p key={u.id}>{u.name} (senha: {u.password})</p>)}
                </div>
            </div>
        </div>
    );
};