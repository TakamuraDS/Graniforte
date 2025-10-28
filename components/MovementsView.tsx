
import React, { useMemo, useState } from 'react';
import { Product, Movement, LedgerEntry, MovementType, User } from '../types';

interface MovementsViewProps {
    products: Product[];
    movements: Movement[];
    users: User[];
    addMovement: (movement: Omit<Movement, 'id' | 'valorTotal' | 'userId'>) => void;
    updateMovement: (movement: Movement) => void;
    deleteMovement: (movementId: number) => void;
}

const MovementsView: React.FC<MovementsViewProps> = ({ products, movements, users, addMovement, updateMovement, deleteMovement }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingMovement, setEditingMovement] = useState<Movement | null>(null);

    const [newMovement, setNewMovement] = useState<{
        codProd: string;
        data: string;
        type: MovementType;
        quantidade: string;
        precoUnitario: string;
        observacao: string;
        notaFiscal: string;
    }>({
        codProd: '',
        data: new Date().toISOString().slice(0,16), // For datetime-local
        type: MovementType.ENTRADA,
        quantidade: '',
        precoUnitario: '',
        observacao: '',
        notaFiscal: ''
    });

    const ledgerData = useMemo<LedgerEntry[]>(() => {
        // FIX: Explicitly type `p` as `Product` to prevent type inference issues where `product` becomes `unknown`.
        const productMap = new Map(products.map((p: Product) => [p.id, p]));
        const userMap = new Map(users.map(u => [u.id, u.name]));
        const balances = new Map<number, { saldoQtd: number, saldoValor: number }>();

        return movements.map(mov => {
            const product = productMap.get(mov.codProd);
            if (!product) return null;

            const previousBalance = balances.get(mov.codProd) || { saldoQtd: 0, saldoValor: 0 };
            let precoMedioAtual = previousBalance.saldoQtd > 0 ? previousBalance.saldoValor / previousBalance.saldoQtd : 0;
            let updatedSaldoQtd = previousBalance.saldoQtd;
            let updatedSaldoValor = previousBalance.saldoValor;
            let custoSaida = 0;

            if (mov.type === 'Entrada' || mov.type === 'Retorno' || mov.type === 'Ajuste de Entrada') {
                updatedSaldoQtd += mov.quantidade;
                updatedSaldoValor += mov.valorTotal;
            } else { // Saída or Ajuste de Saída
                custoSaida = mov.quantidade * precoMedioAtual;
                updatedSaldoQtd -= mov.quantidade;
                updatedSaldoValor -= custoSaida;
            }
            
            const highlightRow = previousBalance.saldoQtd > 0 && updatedSaldoQtd <= 0;
            
            balances.set(mov.codProd, { saldoQtd: updatedSaldoQtd, saldoValor: updatedSaldoValor });
            
            return {
                ...mov,
                valorTotal: mov.type === 'Saída' ? custoSaida : mov.valorTotal,
                produtoDescricao: product.descricao,
                userName: userMap.get(mov.userId) || 'Desconhecido',
                saldoQtd: updatedSaldoQtd,
                saldoValor: updatedSaldoValor,
                precoMedioAtual: updatedSaldoQtd > 0 ? updatedSaldoValor / updatedSaldoQtd : 0,
                highlightRow,
            };
        }).filter((entry): entry is LedgerEntry => entry !== null);
    }, [movements, products, users]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if(editingMovement) {
            const updatedValue = e.target.type === 'datetime-local' ? new Date(value) : value;
            // Fix: The state for an editing movement can temporarily have string values for number fields.
            // Casting to `any` here reflects the runtime reality and relies on `handleSaveEdit` to parse values correctly.
            setEditingMovement(prev => prev ? ({...prev, [name]: updatedValue} as any) : null);
        } else {
            setNewMovement(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleEditClick = (movement: Movement) => {
        setEditingMovement({ ...movement });
    };

    const handleSaveEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!editingMovement) return;
        updateMovement({
            ...editingMovement,
            quantidade: parseFloat(String(editingMovement.quantidade)),
            precoUnitario: parseFloat(String(editingMovement.precoUnitario || 0)),
            data: new Date(editingMovement.data)
        });
        setEditingMovement(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { codProd, quantidade, precoUnitario, type, observacao, data, notaFiscal } = newMovement;
        if (!codProd || !quantidade) {
            alert("Por favor, preencha o produto e a quantidade.");
            return;
        }

        const isEntry = type === MovementType.ENTRADA || type === MovementType.RETORNO;
        if (isEntry && !precoUnitario) {
            alert("Por favor, informe o preço unitário para entradas/retornos.");
            return;
        }

        addMovement({
            codProd: parseInt(codProd, 10),
            data: new Date(data),
            type: type,
            quantidade: parseFloat(quantidade),
            precoUnitario: isEntry ? parseFloat(precoUnitario) : 0,
            observacao,
            notaFiscal,
        });

        // Reset form
        setNewMovement({ codProd: '', data: new Date().toISOString().slice(0,16), type: MovementType.ENTRADA, quantidade: '', precoUnitario: '', observacao: '', notaFiscal: '' });
        setShowForm(false);
    };

    const getTypeStyle = (type: MovementType) => {
        switch(type) {
            case MovementType.ENTRADA: return 'text-green-600 dark:text-green-400';
            case MovementType.SAIDA: return 'text-red-600 dark:text-red-400';
            case MovementType.RETORNO: return 'text-sky-600 dark:text-sky-400';
            case MovementType.AJUSTE_POSITIVO: return 'text-teal-600 dark:text-teal-400';
            case MovementType.AJUSTE_NEGATIVO: return 'text-orange-600 dark:text-orange-400';
            default: return 'text-slate-700 dark:text-slate-300';
        }
    };
    
    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    const formatDate = (date: Date) => new Intl.DateTimeFormat('pt-BR').format(new Date(date));
    
    const toDatetimeLocalString = (date: Date) => {
        const d = new Date(date);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    };
    
    const formInputClass = "w-full px-4 py-2 mt-1 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary-500/50 focus:border-brand-primary-500 bg-slate-50 dark:bg-slate-700/50 transition";
    const primaryButtonClass = "px-5 py-2.5 bg-brand-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-brand-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-700 dark:focus:ring-offset-slate-800 transition-all duration-300 flex items-center justify-center gap-2";

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white text-center">Controle de Estoque (Kardex)</h1>

            <div className="bg-white dark:bg-slate-800 shadow-xl rounded-xl overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                         <p className="text-sm text-slate-500 dark:text-slate-400">Visualização de todas as movimentações de estoque.</p>
                        <button onClick={() => setShowForm(!showForm)} className={`${primaryButtonClass} mt-4 sm:mt-0`}>
                            {showForm ? 'Cancelar' : 'Adicionar Movimentação'}
                        </button>
                    </div>
                </div>
                {showForm && (
                    <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                             <input type="datetime-local" name="data" value={newMovement.data} onChange={handleInputChange} required className={formInputClass} />
                            <select name="codProd" value={newMovement.codProd} onChange={handleInputChange} required className={formInputClass}>
                                <option value="">Selecione um Produto</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.descricao}</option>)}
                            </select>
                            <select name="type" value={newMovement.type} onChange={handleInputChange} required className={formInputClass}>
                                {Object.values(MovementType).filter(t => t !== MovementType.AJUSTE_POSITIVO && t !== MovementType.AJUSTE_NEGATIVO).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <input type="number" name="quantidade" placeholder="Quantidade" value={newMovement.quantidade} onChange={handleInputChange} required className={formInputClass} min="0.01" step="any" />
                            {(newMovement.type === MovementType.ENTRADA || newMovement.type === MovementType.RETORNO) && (
                                <input type="number" name="precoUnitario" placeholder="Preço Unitário" value={newMovement.precoUnitario} onChange={handleInputChange} required className={formInputClass} min="0.01" step="any" />
                            )}
                             <input type="text" name="notaFiscal" placeholder="Nota Fiscal (opcional)" value={newMovement.notaFiscal} onChange={handleInputChange} className={formInputClass} />
                            <input type="text" name="observacao" placeholder="Observação" value={newMovement.observacao} onChange={handleInputChange} className={`${formInputClass} lg:col-span-2`} />
                            <button type="submit" className="p-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 lg:col-span-4 transition-colors">Registrar</button>
                        </form>
                    </div>
                )}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                {['Data', 'Produto', 'Operação', 'Qtd.', 'Preço Unit.', 'Valor Total', 'Nº Fiscal', 'Saldo QTD', 'Preço Médio', 'Usuário', 'Ações'].map(header => (
                                    <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                            {ledgerData.map((entry) => (
                                <tr key={entry.id} 
                                    className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50 ${entry.highlightRow ? 'bg-yellow-50 dark:bg-yellow-900/25' : ''}`}
                                    title={entry.highlightRow ? "Esta operação resultou em saldo zerado ou negativo." : entry.observacao}
                                    >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{formatDate(entry.data)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300 font-medium">{entry.produtoDescricao}</td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${getTypeStyle(entry.type)}`}>{entry.type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{entry.quantidade.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{formatCurrency(entry.precoUnitario)}</td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-right ${entry.type === 'Saída' ? 'text-orange-500' : 'text-blue-500'}`}>{formatCurrency(entry.valorTotal)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{entry.notaFiscal}</td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${entry.saldoQtd <= 0 ? 'text-red-500' : ''}`}>
                                        <div className="flex justify-end items-center gap-2">
                                            <span>{entry.saldoQtd.toFixed(2)}</span>
                                            {entry.highlightRow && (
                                                <span className="cursor-help" title="Saldo zerado/negativo.">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{formatCurrency(entry.precoMedioAtual)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{entry.userName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center justify-start gap-2">
                                            <button onClick={() => handleEditClick(entry)} className="p-1 text-brand-primary-600 hover:text-brand-primary-800" title="Editar">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                                            </button>
                                            <button onClick={() => deleteMovement(entry.id)} className="p-1 text-red-500 hover:text-red-700" title="Excluir">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 {editingMovement && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-lg">
                            <h3 className="text-lg font-bold mb-4">Editar Movimentação</h3>
                            <form onSubmit={handleSaveEdit} className="space-y-4">
                               <input type="datetime-local" name="data" value={toDatetimeLocalString(editingMovement.data)} onChange={handleInputChange} required className={formInputClass} />
                                <select name="type" value={editingMovement.type} onChange={handleInputChange} required className={formInputClass}>
                                    {Object.values(MovementType).filter(t => t !== MovementType.AJUSTE_POSITIVO && t !== MovementType.AJUSTE_NEGATIVO).map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <input type="number" name="quantidade" value={editingMovement.quantidade} onChange={handleInputChange} required className={formInputClass} step="any" />
                                {(editingMovement.type === MovementType.ENTRADA || editingMovement.type === MovementType.RETORNO) && (
                                    <input type="number" name="precoUnitario" value={editingMovement.precoUnitario} onChange={handleInputChange} required className={formInputClass} step="any" />
                                )}
                                <input type="text" name="notaFiscal" placeholder="Nota Fiscal" value={editingMovement.notaFiscal} onChange={handleInputChange} className={formInputClass} />
                                <input type="text" name="observacao" placeholder="Observação" value={editingMovement.observacao} onChange={handleInputChange} className={formInputClass} />
                                <div className="flex justify-end gap-4 pt-4">
                                    <button type="button" onClick={() => setEditingMovement(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 rounded-lg">Cancelar</button>
                                    <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg">Salvar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                 )}
            </div>
        </div>
    );
};

export default MovementsView;