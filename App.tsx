
import React, { useState, useCallback, useEffect } from 'react';
import { Product, Movement, MovementType, AuditLog, View, User, UserRole } from './types';
import { mockProducts, mockMovements, mockUsers } from './constants';
import MovementsView from './components/MovementsView';
import ProductsView from './components/ProductsView';
import ReportsView from './components/ReportsView';
import AuditLogView from './components/AuditLogView';
import SettingsView from './components/SettingsView';
import DashboardView from './components/DashboardView';
import InventoryView from './components/InventoryView';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { useLocalStorage } from './hooks/useLocalStorage';


// --- Main App Component ---
export default function App() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [activeView, setActiveView] = useState<View>(View.DASHBOARD);
    
    const [products, setProducts] = useLocalStorage<Product[]>('products', []);
    const [movements, setMovements] = useLocalStorage<Movement[]>('movements', []);
    const [users, setUsers] = useLocalStorage<User[]>('users', mockUsers);
    const [auditLog, setAuditLog] = useLocalStorage<AuditLog[]>('auditLog', []);
    const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
    const [customLogo, setCustomLogo] = useLocalStorage<string | null>('customLogo', null);
    const [dbConfig, setDbConfig] = useLocalStorage('dbConfig', {type: 'mysql', path: 'localhost'});
    const [isDemoMode, setIsDemoMode] = useLocalStorage<boolean>('isDemoMode', false);


    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const recalculateProductsState = useCallback((
        currentMovements: Movement[],
        initialProducts: Product[]
    ): Product[] => {
        const productMap = new Map<number, Product>();
        initialProducts.forEach(p => {
            productMap.set(p.id, {
                ...p,
                saldo: 0,
                valorMedio: 0,
                ultimaDataZeramento: undefined,
                dataZeramentoAtual: undefined,
            });
        });

        const sortedMovements = [...currentMovements].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

        const tempBalances = new Map<number, {
            saldoQtd: number;
            saldoValor: number;
            lastZeroDate?: Date;
            currentZeroDate?: Date;
        }>();

        for (const mov of sortedMovements) {
            const product = productMap.get(mov.codProd);
            if (!product) continue;

            let balance = tempBalances.get(mov.codProd) || { saldoQtd: 0, saldoValor: 0 };
            const previousSaldo = balance.saldoQtd;
            
            if (mov.type === MovementType.ENTRADA || mov.type === MovementType.RETORNO || mov.type === MovementType.AJUSTE_POSITIVO) {
                balance.saldoQtd += mov.quantidade;
                balance.saldoValor += mov.valorTotal;
            } else { // Saída or Ajuste Negativo
                const precoMedioAtual = previousSaldo > 0 ? balance.saldoValor / previousSaldo : 0;
                const custoSaida = mov.quantidade * precoMedioAtual;
                balance.saldoQtd -= mov.quantidade;
                balance.saldoValor -= custoSaida;
            }

            if (balance.saldoQtd <= 0 && previousSaldo > 0) {
                balance.lastZeroDate = balance.currentZeroDate;
                balance.currentZeroDate = new Date(mov.data);
            }
            tempBalances.set(mov.codProd, balance);
        }
        
        for (const [codProd, balance] of tempBalances.entries()) {
             const product = productMap.get(codProd);
             if (product) {
                product.saldo = balance.saldoQtd;
                product.valorMedio = balance.saldoQtd > 0 ? balance.saldoValor / balance.saldoQtd : 0;
                product.dataZeramentoAtual = balance.currentZeroDate;
                product.ultimaDataZeramento = balance.lastZeroDate;
             }
        }
        
        return Array.from(productMap.values());
    }, []);

    // Initial calculation and on every movement change
    useEffect(() => {
        const currentProductsKey = isDemoMode ? 'products_demo' : 'products';
        const currentMovementsKey = isDemoMode ? 'movements_demo' : 'movements';

        let storedProducts = localStorage.getItem(currentProductsKey);
        if (!storedProducts || JSON.parse(storedProducts).length === 0) {
             localStorage.setItem(currentProductsKey, JSON.stringify(mockProducts));
             storedProducts = JSON.stringify(mockProducts);
        }
       
        let storedMovements = localStorage.getItem(currentMovementsKey);
        if(!storedMovements || JSON.parse(storedMovements).length === 0) {
             localStorage.setItem(currentMovementsKey, JSON.stringify(mockMovements));
             storedMovements = JSON.stringify(mockMovements);
        }
        
        const productDefinitions = JSON.parse(storedProducts).map((p: Product) => ({
             ...p, saldo: 0, valorMedio: 0
        }));
        
        const movementsToCalc = JSON.parse(storedMovements, (key, value) => {
             if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) {
                return new Date(value);
            }
            return value;
        });

        const recalculated = recalculateProductsState(movementsToCalc, productDefinitions);
        setProducts(recalculated);
        setMovements(movementsToCalc);
    }, [movements.length, isDemoMode, recalculateProductsState, setProducts, setMovements]);


    const addAuditLog = useCallback((action: string, details: string) => {
        if (!currentUser || isDemoMode) return;
        setAuditLog(prev => [{
            id: prev.length + 1,
            user: currentUser.name,
            userPhoto: currentUser.photo,
            action,
            details,
            timestamp: new Date()
        }, ...prev]);
    }, [currentUser, setAuditLog, isDemoMode]);

    const addProduct = useCallback((product: Omit<Product, 'id' | 'saldo' | 'valorMedio' | 'priceHistory'>) => {
        const currentProductsKey = isDemoMode ? 'products_demo' : 'products';
        const currentProducts = JSON.parse(localStorage.getItem(currentProductsKey) || '[]');
        const newProduct = { 
            ...product, 
            id: currentProducts.length > 0 ? Math.max(...currentProducts.map((p: Product) => p.id)) + 1 : 1, 
            saldo: 0, 
            valorMedio: 0,
            priceHistory: []
        };
        const updatedProducts = [...currentProducts, newProduct];
        localStorage.setItem(currentProductsKey, JSON.stringify(updatedProducts));
        
        setProducts(recalculateProductsState(movements, updatedProducts));
        addAuditLog("Produto Adicionado", `Produto: ${newProduct.descricao} (ID: ${newProduct.id})`);
    }, [addAuditLog, movements, recalculateProductsState, isDemoMode]);
    
    const processMovementUpdate = (updatedMovements: Movement[]) => {
        const key = isDemoMode ? 'movements_demo' : 'movements';
        localStorage.setItem(key, JSON.stringify(updatedMovements));
        setMovements(updatedMovements);
    };

    const addMovement = useCallback((movement: Omit<Movement, 'id' | 'valorTotal' | 'userId'>) => {
        if (!currentUser) return;
        const currentProducts = JSON.parse(localStorage.getItem(isDemoMode ? 'products_demo' : 'products') || '[]');
        const product = currentProducts.find((p: Product) => p.id === movement.codProd);
        if (!product) { alert("Produto não encontrado!"); return; }
        
        const isEntry = movement.type === MovementType.ENTRADA || movement.type === MovementType.RETORNO || movement.type === MovementType.AJUSTE_POSITIVO;
        
        const newMovement: Movement = {
            ...movement,
            id: movements.length > 0 ? Math.max(...movements.map(m => m.id)) + 1 : 1,
            valorTotal: isEntry ? movement.quantidade * movement.precoUnitario : 0, 
            userId: currentUser.id
        };
        
        let updatedPriceHistory = product.priceHistory;
        if(isEntry && movement.precoUnitario > 0) {
            const lastPriceEntry = product.priceHistory[product.priceHistory.length -1];
            if(!lastPriceEntry || lastPriceEntry.price !== movement.precoUnitario) {
                updatedPriceHistory = [...product.priceHistory, {date: new Date(), price: movement.precoUnitario}];
            }
        }
        
         const updatedProducts = currentProducts.map((p: Product) => 
            p.id === product.id ? { ...p, priceHistory: updatedPriceHistory } : p
         );
         localStorage.setItem(isDemoMode ? 'products_demo' : 'products', JSON.stringify(updatedProducts));
        
        processMovementUpdate([...movements, newMovement]);
        addAuditLog(`${movement.type} Registrada`, `Produto: ${product.descricao}, Qtd: ${movement.quantidade}`);
    }, [movements, addAuditLog, currentUser, isDemoMode]);
    
     const updateMovement = useCallback((updatedMovement: Movement) => {
        const product = products.find(p => p.id === updatedMovement.codProd);
        if(!product) return;
        const isEntry = updatedMovement.type === MovementType.ENTRADA || updatedMovement.type === MovementType.RETORNO || updatedMovement.type === MovementType.AJUSTE_POSITIVO;
        updatedMovement.valorTotal = isEntry ? updatedMovement.quantidade * updatedMovement.precoUnitario : 0;
        
        const newMovementsList = movements.map(m => m.id === updatedMovement.id ? updatedMovement : m);
        processMovementUpdate(newMovementsList);
        addAuditLog("Movimentação Atualizada", `ID: ${updatedMovement.id}, Produto: ${product.descricao}`);
    }, [movements, products, addAuditLog]);

    const deleteMovement = useCallback((movementId: number) => {
        const movement = movements.find(m => m.id === movementId);
        const product = products.find(p => p.id === movement?.codProd);
        if(!movement || !product) return;

        if (!window.confirm(`Tem certeza que deseja excluir a movimentação do produto "${product.descricao}" de ${new Date(movement.data).toLocaleDateString()}?`)) {
            return;
        }
        
        const newMovementsList = movements.filter(m => m.id !== movementId);
        processMovementUpdate(newMovementsList);
        addAuditLog("Movimentação Excluída", `ID: ${movement.id}, Produto: ${product.descricao}`);
    }, [movements, products, addAuditLog]);

    // Fix: Changed signature to accept Omit<User, 'id'> to allow passing a 'photo' property.
    const addUser = useCallback((user: Omit<User, 'id'>) => {
        const newUser: User = {
            ...user,
            id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
            photo: user.photo || `https://i.pravatar.cc/150?u=${user.name.replace(/\s/g, '')}`
        };
        setUsers(prev => [...prev, newUser]);
        addAuditLog("Usuário Adicionado", `Novo usuário: ${newUser.name}, Permissão: ${newUser.role}`);
    }, [users, setUsers, addAuditLog]);

    const updateUser = useCallback((updatedUser: User) => {
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        if (currentUser && currentUser.id === updatedUser.id) {
            setCurrentUser(updatedUser);
        }
        addAuditLog("Usuário Atualizado", `Usuário ID: ${updatedUser.id}, Nome: ${updatedUser.name}`);
    }, [setUsers, addAuditLog, currentUser]);

    const deleteUser = useCallback((userId: number) => {
        const userToDelete = users.find(u => u.id === userId);
        if (!userToDelete) return;
        if (userToDelete.id === currentUser?.id) {
             alert("Você não pode excluir seu próprio usuário.");
             return;
        }
        if (!window.confirm(`Tem certeza que deseja excluir o usuário "${userToDelete.name}"?`)) return;
        
        setUsers(prev => prev.filter(u => u.id !== userId));
        addAuditLog("Usuário Excluído", `Usuário: ${userToDelete.name} (ID: ${userId})`);
    }, [users, setUsers, addAuditLog, currentUser]);

    const resetUserPassword = useCallback((userId: number, newPass: string) => {
        const userToUpdate = users.find(u => u.id === userId);
        if (!userToUpdate) return;
        
        setUsers(prev => prev.map(u => u.id === userId ? {...u, password: newPass} : u));
        addAuditLog("Senha Redefinida", `Senha do usuário ${userToUpdate.name} (ID: ${userId}) foi redefinida.`);
    }, [users, setUsers, addAuditLog]);

    const handleLogin = (name: string, pass: string) => {
        const user = users.find(u => u.name.toLowerCase() === name.toLowerCase() && u.password === pass);
        if (user) {
            setCurrentUser(user);
            setIsDemoMode(false);
            return true;
        }
        return false;
    };
    
    const handleDemoLogin = () => {
        const demoUser = { id: 99, name: "Usuário Demo", role: UserRole.SUPERVISOR, password: "", photo: "https://i.pravatar.cc/150?u=demo", location: "Modo Teste"};
        setCurrentUser(demoUser);
        setIsDemoMode(true);
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setIsDemoMode(false);
    };

    const handleGlobalRecalculation = () => {
        if (!window.confirm("Esta operação irá recalcular o preço médio e o saldo de TODOS os produtos com base em seu histórico de movimentação. Deseja continuar?")) return;
        const currentProductsKey = isDemoMode ? 'products_demo' : 'products';
        const currentProducts = JSON.parse(localStorage.getItem(currentProductsKey) || '[]');
        const recalculated = recalculateProductsState(movements, currentProducts);
        setProducts(recalculated);
        addAuditLog("Recálculo Global Forçado", "Saldos e preços médios de todos os produtos foram recalculados.");
        alert("Recálculo global concluído com sucesso!");
    };

    const handleUpdateCurrentUserPhoto = (photo: string) => {
        if (currentUser) {
            const updatedUser = { ...currentUser, photo };
            setCurrentUser(updatedUser);
            if (!isDemoMode) {
                setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
                addAuditLog("Foto de Perfil Atualizada", `Usuário: ${updatedUser.name}`);
            }
        }
    };


    const renderActiveView = () => {
        if (!currentUser) return null;
        const productDefinitions = JSON.parse(localStorage.getItem(isDemoMode ? 'products_demo' : 'products') || '[]') as Product[];
        switch (activeView) {
            case View.DASHBOARD:
                return <DashboardView products={products} movements={movements} />;
            case View.MOVEMENTS:
                return <MovementsView products={productDefinitions} movements={movements} addMovement={addMovement} updateMovement={updateMovement} deleteMovement={deleteMovement} users={users} />;
            case View.PRODUCTS:
                return <ProductsView products={products} addProduct={addProduct} />;
             case View.INVENTORY:
                return <InventoryView products={products} addMovement={addMovement} />;
            case View.REPORTS:
                return <ReportsView products={products} movements={movements} currentUser={currentUser} users={users} auditLog={auditLog} />;
            case View.SETTINGS:
                return <SettingsView 
                            currentUser={currentUser}
                            users={users}
                            addUser={addUser}
                            updateUser={updateUser}
                            deleteUser={deleteUser}
                            resetUserPassword={resetUserPassword}
                            onRecalculate={handleGlobalRecalculation}
                            theme={theme}
                            setTheme={setTheme}
                            setCustomLogo={setCustomLogo}
                            onUpdateCurrentUserPhoto={handleUpdateCurrentUserPhoto}
                            dbConfig={dbConfig}
                            setDbConfig={setDbConfig}
                            isDemoMode={isDemoMode}
                            products={productDefinitions}
                            movements={movements}
                            auditLog={auditLog}
                            addAuditLog={addAuditLog}
                        />;
            default:
                return <DashboardView products={products} movements={movements} />;
        }
    };

    if (!currentUser) {
        return <LoginScreen onLogin={handleLogin} onDemoLogin={handleDemoLogin} users={users} />;
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
            <Header activeView={activeView} setActiveView={setActiveView} currentUser={currentUser} onLogout={handleLogout} customLogo={customLogo}/>
            <main className="p-4 sm:p-6 lg:p-10">
                {renderActiveView()}
            </main>
        </div>
    );
}