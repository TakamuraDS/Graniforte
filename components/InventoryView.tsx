
import React, { useState } from 'react';
// Fix: Imported the missing 'Movement' type.
import { Product, Movement, MovementType } from '../types';

interface InventoryViewProps {
    products: Product[];
    addMovement: (movement: Omit<Movement, 'id' | 'valorTotal' | 'userId'>) => void;
}

const InventoryView: React.FC<InventoryViewProps> = ({ products, addMovement }) => {
    const [counts, setCounts] = useState<Record<number, string>>({});
    
    const handleCountChange = (productId: number, value: string) => {
        setCounts(prev => ({ ...prev, [productId]: value }));
    };

    const handleCreateAdjustment = (product: Product) => {
        const physicalCount = parseFloat(counts[product.id] || '0');
        const systemBalance = product.saldo;
        const difference = physicalCount - systemBalance;

        if (difference === 0) {
            alert("Não há diferença para ajustar.");
            return;
        }

        const movementType = difference > 0 ? MovementType.AJUSTE_POSITIVO : MovementType.AJUSTE_NEGATIVO;
        const quantity = Math.abs(difference);

        if (window.confirm(`Deseja criar um ${movementType} de ${quantity.toFixed(2)} unidades para "${product.descricao}"?`)) {
            addMovement({
                codProd: product.id,
                data: new Date(),
                type: movementType,
                quantidade: quantity,
                precoUnitario: product.valorMedio, // Use average cost for adjustments
                observacao: `Ajuste de inventário. Contagem física: ${physicalCount}.`,
            });
            // Clear the count for this product after adjustment
            setCounts(prev => {
                const newCounts = {...prev};
                delete newCounts[product.id];
                return newCounts;
            });
            alert("Ajuste criado com sucesso!");
        }
    };

    return (
         <div className="space-y-8">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white text-center">Inventário e Contagem Física</h1>
            
            <div className="bg-white dark:bg-slate-800 shadow-xl rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                {['Produto', 'Saldo Sistema', 'Contagem Física', 'Diferença', 'Ações'].map(header => (
                                    <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                            {products.map(product => {
                                const physicalCount = parseFloat(counts[product.id] || '0');
                                const difference = physicalCount - product.saldo;
                                return (
                                    <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">{product.descricao}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{product.saldo.toFixed(2)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input 
                                                type="number"
                                                value={counts[product.id] || ''}
                                                onChange={(e) => handleCountChange(product.id, e.target.value)}
                                                className="w-28 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-brand-primary-500 focus:border-brand-primary-500"
                                                placeholder="0.00"
                                                step="any"
                                            />
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${
                                            difference === 0 ? 'text-slate-500 dark:text-slate-400' : 
                                            difference > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                        }`}>
                                            {difference.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => handleCreateAdjustment(product)}
                                                disabled={!counts[product.id] || difference === 0}
                                                className="px-3 py-1.5 text-sm bg-brand-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-brand-primary-700 disabled:bg-slate-400 disabled:cursor-not-allowed dark:disabled:bg-slate-600 transition-colors"
                                            >
                                                Criar Ajuste
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InventoryView;