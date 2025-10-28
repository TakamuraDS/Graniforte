
import React, { useState, useEffect } from 'react';
import { Product } from '../types';

interface ProductsViewProps {
    products: Product[];
    addProduct: (product: Omit<Product, 'id' | 'saldo' | 'valorMedio' | 'priceHistory'>) => void;
}

const ProductsView: React.FC<ProductsViewProps> = ({ products, addProduct }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [expandedProductId, setExpandedProductId] = useState<number | null>(null);
    const [newProduct, setNewProduct] = useState({
        descricao: '', unidade: '', marca: '', tipo: '', aplicacao: '',
        stockMinimo: '0', fornecedor: '', localizacao: ''
    });

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const filteredProducts = products.filter(p =>
        p.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.aplicacao.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    
    const toggleRow = (productId: number) => {
        setExpandedProductId(currentId => currentId === productId ? null : productId);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewProduct(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProduct.descricao || !newProduct.unidade || !newProduct.marca) {
            alert('Descrição, Unidade e Marca são obrigatórios.');
            return;
        }
        addProduct({
            ...newProduct,
            stockMinimo: parseFloat(newProduct.stockMinimo || '0')
        });
        setNewProduct({ descricao: '', unidade: '', marca: '', tipo: '', aplicacao: '', stockMinimo: '0', fornecedor: '', localizacao: '' });
        setShowForm(false);
    };

    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    const formatTooltipDate = (date?: Date) => date ? new Date(date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A';
    
    const formInputClass = "w-full px-4 py-2 mt-1 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary-500/50 focus:border-brand-primary-500 bg-slate-50 dark:bg-slate-700/50 transition";
    const primaryButtonClass = "px-5 py-2.5 bg-brand-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-brand-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-700 dark:focus:ring-offset-slate-800 transition-all duration-300 flex items-center justify-center gap-2";

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white text-center">Cadastro de Produtos</h1>
            <div className="bg-white dark:bg-slate-800 shadow-xl rounded-xl overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie todos os produtos do seu estoque.</p>
                        <div className="flex items-center gap-4">
                            <input
                                type="text"
                                placeholder="Pesquisar por descrição, marca..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full sm:w-64 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-500 bg-white dark:bg-slate-700 dark:border-slate-600"
                            />
                            <button onClick={() => setShowForm(!showForm)} className={`${primaryButtonClass} whitespace-nowrap`}>
                                {showForm ? 'Cancelar' : 'Adicionar Produto'}
                            </button>
                        </div>
                    </div>
                </div>
                {showForm && (
                    <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <input type="text" name="descricao" placeholder="Descrição*" value={newProduct.descricao} onChange={handleInputChange} required className={`${formInputClass} md:col-span-2`} />
                            <input type="text" name="unidade" placeholder="Unidade (UN, M², KG)*" value={newProduct.unidade} onChange={handleInputChange} required className={formInputClass} />
                            <input type="text" name="marca" placeholder="Marca*" value={newProduct.marca} onChange={handleInputChange} required className={formInputClass} />
                            <input type="text" name="tipo" placeholder="Tipo (Fixador)" value={newProduct.tipo} onChange={handleInputChange} className={formInputClass} />
                            <input type="text" name="aplicacao" placeholder="Aplicação (Bancadas)" value={newProduct.aplicacao} onChange={handleInputChange} className={formInputClass} />
                            <input type="text" name="fornecedor" placeholder="Fornecedor" value={newProduct.fornecedor} onChange={handleInputChange} className={formInputClass} />
                            <input type="text" name="localizacao" placeholder="Localização (Prat. A-01)" value={newProduct.localizacao} onChange={handleInputChange} className={formInputClass} />
                            <input type="number" name="stockMinimo" placeholder="Estoque Mínimo" value={newProduct.stockMinimo} onChange={handleInputChange} className={formInputClass} min="0" step="any" />
                            <button type="submit" className="p-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors lg:col-span-4">Salvar Produto</button>
                        </form>
                    </div>
                )}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th scope="col" className="w-12 px-2 py-3 text-center"></th>
                                {['CÓDIGO', 'DESCRIÇÃO', 'SALDO', 'UND', 'LOCALIZAÇÃO', 'VALOR MÉDIO', 'VALOR TOTAL'].map(header => (
                                    <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                            {paginatedProducts.map(product => (
                                <React.Fragment key={product.id}>
                                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                        <td className="px-2 py-4 text-center">
                                            <button onClick={() => toggleRow(product.id)} className="p-1 rounded-full hover:bg-slate-200" style={{ transform: expandedProductId === product.id ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{product.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{product.descricao}</td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${product.saldo <= 0 ? 'text-red-500' : ''}`}>
                                            <div className="flex items-center justify-end gap-2">
                                                {product.stockMinimo > 0 && product.saldo <= product.stockMinimo && (
                                                    <span title={`Estoque baixo! Mínimo: ${product.stockMinimo}`} className="cursor-help text-yellow-500">
                                                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                                    </span>
                                                )}
                                                {product.saldo.toFixed(2)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{product.unidade}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{product.localizacao}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{formatCurrency(product.valorMedio)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right">{formatCurrency(product.saldo * product.valorMedio)}</td>
                                    </tr>
                                    {expandedProductId === product.id && (
                                        <tr className="bg-slate-50/50 dark:bg-slate-900/20">
                                            <td colSpan={10} className="p-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 bg-white dark:bg-slate-700/50 rounded-md shadow-inner">
                                                    <div>
                                                        <h4 className="font-bold text-sm">Detalhes</h4>
                                                        <p className="text-sm"><strong>Marca:</strong> {product.marca}</p>
                                                        <p className="text-sm"><strong>Fornecedor:</strong> {product.fornecedor}</p>
                                                        <p className="text-sm"><strong>Tipo:</strong> {product.tipo}</p>
                                                        <p className="text-sm"><strong>Aplicação:</strong> {product.aplicacao}</p>
                                                         <p className="text-sm"><strong>Estoque Mínimo:</strong> {product.stockMinimo}</p>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-sm mb-2">Histórico de Preços</h4>
                                                        {product.priceHistory && product.priceHistory.length > 0 ? (
                                                            <ul className="text-xs list-disc pl-5">
                                                                {[...product.priceHistory].reverse().slice(0, 5).map((entry, index) => (
                                                                    <li key={index}>{formatTooltipDate(entry.date)} - {formatCurrency(entry.price)}</li>
                                                                ))}
                                                            </ul>
                                                        ) : <p className="text-xs italic">Nenhum histórico.</p>}
                                                    </div>
                                                     <div>
                                                        <h4 className="font-bold text-sm mb-2">Datas de Zeramento</h4>
                                                         <p className="text-xs"><strong>Último:</strong> {formatTooltipDate(product.dataZeramentoAtual)}</p>
                                                         <p className="text-xs"><strong>Penúltimo:</strong> {formatTooltipDate(product.ultimaDataZeramento)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 sm:px-6 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-sm">Página {currentPage} de {totalPages}</p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded-md disabled:opacity-50">Anterior</button>
                            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-md disabled:opacity-50">Próximo</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductsView;