
import React, { useMemo, useState } from 'react';
import { Product, Movement, MovementType, User, UserRole, AuditLog, PriceHistoryEntry } from '../types';

interface ReportsViewProps {
    products: Product[];
    movements: Movement[];
    currentUser: User;
    users: User[];
    auditLog: AuditLog[];
}

type ReportType = 'movimentacoes' | 'preco' | 'usuario' | 'ocioso';

const ReportsView: React.FC<ReportsViewProps> = ({ products, movements, currentUser, users, auditLog }) => {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];

    const [filters, setFilters] = useState({
        reportType: 'movimentacoes' as ReportType,
        startDate: thirtyDaysAgo,
        endDate: today,
        productId: '',
        userId: '',
        obsolescenceMonths: '6',
    });

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    const formatDate = (date: Date | string) => new Intl.DateTimeFormat('pt-BR').format(new Date(date));
    const formatDateTime = (date: Date | string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(date));

    const { reportData, totals } = useMemo(() => {
        const { reportType, startDate, endDate, productId, userId, obsolescenceMonths } = filters;
        const start = new Date(startDate);
        start.setHours(0,0,0,0);
        const end = new Date(endDate);
        end.setHours(23,59,59,999);

        let reportData: any[] = [];
        let totals = {};

        if (reportType === 'movimentacoes') {
            reportData = movements.filter(m => {
                const moveDate = new Date(m.data);
                return moveDate >= start && moveDate <= end;
            });
            const summary = (reportData as Movement[]).reduce((acc, mov) => {
                if (mov.type === MovementType.ENTRADA || mov.type === MovementType.AJUSTE_POSITIVO) { acc.entradasValor += mov.valorTotal; } 
                else if (mov.type === MovementType.SAIDA || mov.type === MovementType.AJUSTE_NEGATIVO) { acc.saidasValor += mov.valorTotal; }
                return acc;
            }, { entradasValor: 0, saidasValor: 0 });
            totals = summary;
        } else if (reportType === 'preco' && productId) {
            const product = products.find(p => p.id === parseInt(productId));
            reportData = product ? product.priceHistory : [];
        } else if (reportType === 'usuario' && currentUser.role === UserRole.ADMIN) {
             reportData = auditLog.filter(log => {
                const logDate = new Date(log.timestamp);
                const userName = users.find(u => u.id === parseInt(userId))?.name;
                if(userId && log.user !== userName) return false;
                return logDate >= start && logDate <= end;
            });
        } else if (reportType === 'ocioso') {
            const months = parseInt(obsolescenceMonths);
            const cutoffDate = new Date();
            cutoffDate.setMonth(cutoffDate.getMonth() - months);
            
            reportData = products.map(product => {
                const lastMovement = movements
                    .filter(m => m.codProd === product.id)
                    .sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0];
                return { product, lastMovementDate: lastMovement ? new Date(lastMovement.data) : null };
            }).filter(item => item.product.saldo > 0 && (item.lastMovementDate === null || item.lastMovementDate < cutoffDate));
        }
        
        return { reportData, totals };

    }, [filters, movements, products, auditLog, currentUser, users]);

    const handlePrint = () => window.print();
    
     const handleExportCSV = () => {
        // This is a simplified CSV export. A library like papaparse would be better for complex cases.
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // BOM for UTF-8 Excel compatibility
        const headers: string[] = [];
        const rows: any[][] = [];
        
        if (filters.reportType === 'movimentacoes') {
            headers.push("Data", "Produto", "Tipo", "Quantidade", "Valor Total", "Usuário");
            (reportData as Movement[]).forEach(mov => {
                rows.push([
                    formatDate(mov.data),
                    products.find(p => p.id === mov.codProd)?.descricao.replace(/,/g, ''),
                    mov.type,
                    mov.quantidade,
                    mov.valorTotal,
                    users.find(u => u.id === mov.userId)?.name
                ]);
            });
        }
        // ... add other report types here
        
        csvContent += headers.join(',') + '\r\n';
        rows.forEach(rowArray => {
            let row = rowArray.join(',');
            csvContent += row + '\r\n';
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `relatorio_${filters.reportType}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }


    const renderReport = () => {
        switch (filters.reportType) {
            case 'movimentacoes':
                return (
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                       <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>{['Data', 'Produto', 'Tipo', 'Qtd.', 'Valor Total', 'Usuário'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-semibold">{h}</th>)}</tr>
                       </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                            {reportData.map((mov: Movement) => (
                                <tr key={mov.id}>
                                    <td className="px-6 py-4">{formatDate(mov.data)}</td>
                                    <td className="px-6 py-4">{products.find(p=>p.id === mov.codProd)?.descricao}</td>
                                    <td className="px-6 py-4">{mov.type}</td>
                                    <td className="px-6 py-4">{mov.quantidade}</td>
                                    <td className="px-6 py-4">{formatCurrency(mov.valorTotal)}</td>
                                    <td className="px-6 py-4">{users.find(u=>u.id === mov.userId)?.name}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );
            case 'ocioso':
                return (
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                {['Produto', 'Saldo Atual', 'Valor em Estoque', 'Última Movimentação'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-semibold">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                            {reportData.map(({ product, lastMovementDate }) => (
                                <tr key={product.id}>
                                    <td className="px-6 py-4">{product.descricao}</td>
                                    <td className="px-6 py-4">{product.saldo.toFixed(2)}</td>
                                    <td className="px-6 py-4">{formatCurrency(product.saldo * product.valorMedio)}</td>
                                    <td className="px-6 py-4">{lastMovementDate ? formatDate(lastMovementDate) : 'Nenhuma movimentação'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );
            case 'preco':
                return (
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                             <tr>{['Data', 'Preço'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-semibold">{h}</th>)}</tr>
                        </thead>
                         <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                           {reportData.map((h, i) => (
                                <tr key={i}>
                                    <td className="px-6 py-4">{formatDate(h.date)}</td>
                                    <td className="px-6 py-4">{formatCurrency(h.price)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );
            case 'usuario':
                if (currentUser.role !== UserRole.ADMIN) return <p className="p-4 text-red-500">Acesso negado.</p>;
                return (
                     <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                       <thead className="bg-slate-50 dark:bg-slate-700/50">
                           <tr>{['Data/Hora', 'Usuário', 'Ação', 'Detalhes'].map(h=><th key={h} className="px-6 py-3 text-left text-xs font-semibold">{h}</th>)}</tr>
                       </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                           {reportData.map((log: AuditLog) => (
                               <tr key={log.id}>
                                   <td className="px-6 py-4">{formatDateTime(log.timestamp)}</td>
                                   <td className="px-6 py-4">{log.user}</td>
                                   <td className="px-6 py-4">{log.action}</td>
                                   <td className="px-6 py-4">{log.details}</td>
                               </tr>
                           ))}
                       </tbody>
                    </table>
                );
            default: return null;
        }
    };
    
    const formInputClass = "w-full px-4 py-2 mt-1 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm bg-white dark:bg-slate-700";

    return (
        <div id="print-area" className="space-y-8">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white text-center">Central de Relatórios</h1>
            <div className="bg-white dark:bg-slate-800 shadow-xl rounded-xl overflow-hidden">
                <div className="p-4 sm:p-6 border-b print:hidden">
                    <div className="flex justify-between items-center">
                        <p className="text-sm">Gere relatórios detalhados sobre o seu estoque.</p>
                        <div className="flex gap-2">
                             <button onClick={handleExportCSV} className="px-4 py-2 bg-green-600 text-white rounded-lg">Exportar CSV</button>
                             <button onClick={handlePrint} className="px-4 py-2 bg-sky-600 text-white rounded-lg">Imprimir / PDF</button>
                        </div>
                    </div>
                </div>
                <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/50 print:hidden grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="text-sm font-medium">Tipo de Relatório</label>
                        <select name="reportType" value={filters.reportType} onChange={handleFilterChange} className={formInputClass}>
                            <option value="movimentacoes">Movimentações</option>
                            <option value="preco">Histórico de Preços</option>
                            <option value="ocioso">Produtos Ociosos</option>
                            {currentUser.role === UserRole.ADMIN && <option value="usuario">Atividade de Usuário</option>}
                        </select>
                    </div>
                    {(filters.reportType === 'movimentacoes' || filters.reportType === 'usuario') && (
                        <>
                         <div>
                            <label className="text-sm font-medium">Data Início</label>
                            <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className={formInputClass} />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Data Fim</label>
                            <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className={formInputClass} />
                        </div>
                        </>
                    )}
                    <div>
                        {filters.reportType === 'preco' && (
                             <select name="productId" value={filters.productId} onChange={handleFilterChange} className={formInputClass}>
                                <option value="">Selecione um Produto</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.descricao}</option>)}
                            </select>
                        )}
                         {filters.reportType === 'usuario' && (
                             <select name="userId" value={filters.userId} onChange={handleFilterChange} className={formInputClass}>
                                <option value="">Todos os Usuários</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        )}
                        {filters.reportType === 'ocioso' && (
                            <div>
                                <label className="text-sm font-medium">Sem movimento há mais de</label>
                                <select name="obsolescenceMonths" value={filters.obsolescenceMonths} onChange={handleFilterChange} className={formInputClass}>
                                    <option value="3">3 meses</option>
                                    <option value="6">6 meses</option>
                                    <option value="12">12 meses</option>
                                </select>
                            </div>
                        )}
                    </div>
                </div>
                <div className="overflow-x-auto p-4 sm:p-6">
                    {renderReport()}
                </div>
            </div>
        </div>
    );
};

export default ReportsView;