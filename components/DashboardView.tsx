
import React from 'react';
import { Product, Movement, MovementType } from '../types';

interface DashboardViewProps {
    products: Product[];
    movements: Movement[];
}

// Fix: Replaced JSX.Element with React.ReactElement to resolve namespace issue.
const StatCard: React.FC<{ title: string; value: string; color: string; icon: React.ReactElement; }> = ({ title, value, color, icon }) => (
    <div className={`bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border-l-4 ${color}`}>
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase">{title}</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{value}</p>
            </div>
            <div className="text-slate-300 dark:text-slate-600">
                {icon}
            </div>
        </div>
    </div>
);

const DonutChart: React.FC<{ data: { label: string, value: number, color: string }[] }> = ({ data }) => {
    const total = data.reduce((acc, item) => acc + item.value, 0);
    if (total === 0) {
        return <div className="flex items-center justify-center h-full text-slate-500">Sem dados para exibir.</div>;
    }
    let cumulative = 0;
    const gradients = data.map(item => {
        const percent = (item.value / total) * 100;
        const start = (cumulative / total) * 360;
        cumulative += item.value;
        const end = (cumulative / total) * 360;
        return `${item.color} ${start}deg ${end}deg`;
    });

    return (
        <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative w-48 h-48">
                <div 
                    className="w-full h-full rounded-full"
                    style={{ background: `conic-gradient(${gradients.join(', ')})` }}
                ></div>
                <div className="absolute inset-4 bg-white dark:bg-slate-800 rounded-full"></div>
            </div>
            <div className="space-y-2">
                {data.map(item => (
                    <div key={item.label} className="flex items-center gap-3 text-sm">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }}></div>
                        <span className="text-slate-600 dark:text-slate-300">{item.label}</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-100 ml-auto">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.value)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const DashboardView: React.FC<DashboardViewProps> = ({ products, movements }) => {

    const totalStockValue = products.reduce((acc, p) => acc + (p.saldo * p.valorMedio), 0);
    const lowStockProducts = products.filter(p => p.stockMinimo > 0 && p.saldo <= p.stockMinimo);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentMovements = movements.filter(m => new Date(m.data) > thirtyDaysAgo);
    
    const totalEntradas = recentMovements.filter(m => m.type === MovementType.ENTRADA).length;
    const totalSaidas = recentMovements.filter(m => m.type === MovementType.SAIDA).length;

    const top5ProductsByValue = [...products]
        .sort((a, b) => (b.saldo * b.valorMedio) - (a.saldo * a.valorMedio))
        .slice(0, 5);

    const donutChartData = top5ProductsByValue.map((p, index) => ({
        label: p.descricao,
        value: p.saldo * p.valorMedio,
        color: ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'][index],
    }));

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white text-center">Dashboard Analítico</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Valor Total em Estoque" 
                    value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalStockValue)} 
                    color="border-brand-primary-500"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                />
                 <StatCard 
                    title="Itens Cadastrados" 
                    value={products.length.toString()}
                    color="border-sky-500"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                />
                <StatCard 
                    title="Entradas (Últimos 30d)" 
                    value={totalEntradas.toString()}
                    color="border-green-500"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>}
                />
                 <StatCard 
                    title="Saídas (Últimos 30d)" 
                    value={totalSaidas.toString()}
                    color="border-red-500"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>}
                />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Top 5 Produtos por Valor em Estoque</h3>
                    <DonutChart data={donutChartData} />
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        Alerta de Estoque Baixo
                    </h3>
                    {lowStockProducts.length > 0 ? (
                        <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
                            {lowStockProducts.map(p => (
                                <li key={p.id} className="text-sm p-3 bg-red-50 dark:bg-red-500/10 rounded-lg border border-red-200 dark:border-red-500/20">
                                    <p className="font-semibold text-red-800 dark:text-red-200">{p.descricao}</p>
                                    <p className="text-red-600 dark:text-red-300">
                                        Saldo: <span className="font-bold">{p.saldo.toFixed(2)}</span> / Mínimo: <span className="font-bold">{p.stockMinimo.toFixed(2)}</span>
                                    </p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-500">
                            <p>Nenhum item com estoque baixo.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardView;