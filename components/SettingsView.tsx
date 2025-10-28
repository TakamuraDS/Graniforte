
import React, { useState } from 'react';
import { User, UserRole, Product, Movement, AuditLog } from '../types';

interface SettingsViewProps {
    currentUser: User;
    users: User[];
    // Fix: Changed type to Omit<User, 'id'> to allow passing 'photo'
    addUser: (user: Omit<User, 'id'>) => void;
    updateUser: (user: User) => void;
    deleteUser: (userId: number) => void;
    resetUserPassword: (userId: number, newPass: string) => void;
    onRecalculate: () => void;
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    setCustomLogo: (logo: string | null) => void;
    onUpdateCurrentUserPhoto: (photo: string) => void;
    dbConfig: { type: string; path: string };
    setDbConfig: (config: { type: string; path: string }) => void;
    isDemoMode: boolean;
    products: Product[];
    movements: Movement[];
    auditLog: AuditLog[];
    addAuditLog: (action: string, details: string) => void;
}

const SettingsCard: React.FC<{title: string, description: string, children: React.ReactNode}> = ({title, description, children}) => (
    <div className="bg-white dark:bg-slate-800 shadow-xl rounded-xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        <div className="p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900/20">
            {children}
        </div>
    </div>
);


const SettingsView: React.FC<SettingsViewProps> = (props) => {
    const { 
        currentUser, users, addUser, updateUser, deleteUser, resetUserPassword, 
        onRecalculate, theme, setTheme, setCustomLogo, onUpdateCurrentUserPhoto,
        dbConfig, setDbConfig, isDemoMode, products, movements, auditLog, addAuditLog
    } = props;
    
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [userToReset, setUserToReset] = useState<User | null>(null);
    
    const [formUserName, setFormUserName] = useState('');
    const [formUserRole, setFormUserRole] = useState<UserRole>(UserRole.FUNCIONARIO);
    const [formUserLocation, setFormUserLocation] = useState('');
    const [formUserPhoto, setFormUserPhoto] = useState<string | null>(null);
    const [formUserPassword, setFormUserPassword] = useState('');
    const [formNewPassword, setFormNewPassword] = useState('');
    const [formConfirmPassword, setFormConfirmPassword] = useState('');
    
    const [dbStatus, setDbStatus] = useState<'idle' | 'checking' | 'ok' | 'fail'>('idle');

    const formInputClass = "w-full px-4 py-2 mt-1 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary-500/50 focus:border-brand-primary-500 bg-white dark:bg-slate-700 transition";

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => { setCustomLogo(reader.result as string); };
            reader.readAsDataURL(file);
        }
    };
    
    const handleProfilePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (reader.result) {
                    onUpdateCurrentUserPhoto(reader.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => { setFormUserPhoto(reader.result as string); };
            reader.readAsDataURL(file);
        }
    }

    const checkDbConnection = () => {
        setDbStatus('checking');
        setTimeout(() => {
            // Simulate 80% success rate
            setDbStatus(Math.random() < 0.8 ? 'ok' : 'fail');
        }, 1500);
    };

    const handleAddUserClick = () => {
        setEditingUser(null);
        setFormUserName('');
        setFormUserRole(UserRole.FUNCIONARIO);
        setFormUserLocation('');
        setFormUserPhoto(null);
        setFormUserPassword('');
        setIsUserModalOpen(true);
    };

    const handleEditUserClick = (user: User) => {
        setEditingUser(user);
        setFormUserName(user.name);
        setFormUserRole(user.role);
        setFormUserLocation(user.location || '');
        setFormUserPhoto(user.photo);
        setFormUserPassword('');
        setIsUserModalOpen(true);
    };

    const handleResetPasswordClick = (user: User) => {
        setUserToReset(user);
        setIsResetModalOpen(true);
    };

    const handleSaveUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUser) {
            updateUser({ ...editingUser, name: formUserName, role: formUserRole, location: formUserLocation, photo: formUserPhoto || editingUser.photo });
        } else {
            addUser({ name: formUserName, role: formUserRole, location: formUserLocation, password: formUserPassword, photo: formUserPhoto || '' });
        }
        setIsUserModalOpen(false);
    };

    const handleSavePassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (formNewPassword !== formConfirmPassword) { alert("As senhas não conferem."); return; }
        if (userToReset) {
            resetUserPassword(userToReset.id, formNewPassword);
            setIsResetModalOpen(false);
        }
    };
    
     const downloadCSV = (data: any[], filename: string) => {
        if (data.length === 0) return;
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];
        for (const row of data) {
            const values = headers.map(header => {
                const escaped = ('' + row[header]).replace(/"/g, '""');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(','));
        }
        const blob = new Blob([`\uFEFF${csvRows.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', filename);
        link.click();
    };

    const handleFullExport = () => {
        if(!window.confirm("Isso fará o download de 4 arquivos CSV com todos os dados do sistema. Deseja continuar?")) return;
        downloadCSV(products, 'produtos.csv');
        downloadCSV(movements, 'movimentacoes.csv');
        downloadCSV(users.map(({password, ...u}) => u), 'usuarios.csv');
        downloadCSV(auditLog, 'log_auditoria.csv');
        addAuditLog("Backup Realizado", "Exportação completa de dados para CSV.");
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white text-center">Configurações do Sistema</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-8">
                    <SettingsCard title="Meu Perfil" description="Gerencie suas informações pessoais.">
                        <div className="flex items-center gap-4">
                            <img src={currentUser.photo} alt="Current User" className="w-16 h-16 rounded-full object-cover" />
                            <div className="flex-1">
                                <p className="font-bold">{currentUser.name}</p>
                                <p className="text-sm text-slate-500">{currentUser.role}{currentUser.location && ` - ${currentUser.location}`}</p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <label htmlFor="profile-photo-upload" className="cursor-pointer text-sm font-medium text-brand-primary-600 hover:text-brand-primary-700 dark:text-brand-primary-400 dark:hover:text-brand-primary-300">
                                Trocar Foto
                            </label>
                            <input id="profile-photo-upload" type="file" accept="image/*" onChange={handleProfilePhotoUpload} className="hidden" />
                        </div>
                    </SettingsCard>

                    <SettingsCard title="Aparência" description="Personalize o visual do sistema.">
                        <div className="flex items-center gap-4">
                            <label className="font-medium">Tema</label>
                            <div className="flex-grow flex items-center gap-2 p-1 bg-slate-200 dark:bg-slate-700 rounded-lg">
                               <button onClick={() => setTheme('light')} className={`w-full py-1 rounded ${theme === 'light' ? 'bg-white shadow' : ''}`}>Claro</button>
                               <button onClick={() => setTheme('dark')} className={`w-full py-1 rounded ${theme === 'dark' ? 'bg-slate-900 text-white shadow' : ''}`}>Escuro</button>
                            </div>
                        </div>
                         <div className="mt-4">
                            <label className="block font-medium mb-1">Substituir Logo</label>
                            <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-sm" />
                        </div>
                    </SettingsCard>

                     <SettingsCard title="Backup do Sistema" description="Exporte todos os dados do sistema para arquivos CSV.">
                         <button onClick={handleFullExport} disabled={isDemoMode} className="w-full px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg shadow-md hover:bg-sky-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed">
                            Exportar Tudo para Excel (CSV)
                        </button>
                         {isDemoMode && <p className="text-xs text-yellow-600 mt-2 text-center">A exportação está desativada no modo de demonstração.</p>}
                     </SettingsCard>
                     
                      <SettingsCard title="Manutenção de Dados" description="Ferramenta para forçar um recálculo global dos dados.">
                          <button onClick={onRecalculate} className="w-full px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-colors">
                            Forçar Recálculo Global
                        </button>
                     </SettingsCard>

                </div>
                <div className="space-y-8">
                     {currentUser.role === UserRole.ADMIN && (
                        <SettingsCard title="Gerenciamento de Usuários" description="Adicione, edite ou remova usuários do sistema.">
                             <button onClick={handleAddUserClick} className="w-full mb-4 px-4 py-2 bg-brand-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-brand-primary-700 transition-colors">
                                Adicionar Novo Usuário
                            </button>
                            <ul role="list" className="divide-y divide-slate-200 dark:divide-slate-700">
                                {users.map((user) => (
                                    <li key={user.id} className="py-3 flex items-center space-x-4">
                                        <img className="w-10 h-10 rounded-full object-cover" src={user.photo} alt={`${user.name} photo`} />
                                        <div className="flex-1">
                                            <p className="font-medium">{user.name}</p>
                                            <p className="text-sm text-slate-500">{user.role} {user.location && `- ${user.location}`}</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button onClick={() => handleResetPasswordClick(user)} className="p-1 text-sky-600" title="Redefinir Senha"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" /></svg></button>
                                            <button onClick={() => handleEditUserClick(user)} className="p-1 text-brand-primary-600" title="Editar"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg></button>
                                            <button onClick={() => deleteUser(user.id)} className="p-1 text-red-600" title="Excluir"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg></button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </SettingsCard>
                     )}
                     <SettingsCard title="Conexão com Banco de Dados (Simulação)" description="Verifique o status da conexão com a fonte de dados.">
                         <div className="flex items-center gap-4">
                             <button onClick={checkDbConnection} disabled={dbStatus === 'checking'} className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:bg-slate-400">
                                 {dbStatus === 'checking' ? 'Verificando...' : 'Verificar Conexão'}
                             </button>
                             <div className="flex items-center gap-2">
                                {dbStatus === 'ok' && <><span className="w-3 h-3 bg-green-500 rounded-full"></span><span>Conectado</span></>}
                                {dbStatus === 'fail' && <><span className="w-3 h-3 bg-red-500 rounded-full"></span><span>Falha na Conexão</span></>}
                             </div>
                         </div>
                     </SettingsCard>
                </div>
            </div>

            {isUserModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                        <form onSubmit={handleSaveUser} className="space-y-4">
                            <input type="text" placeholder="Nome Completo" value={formUserName} onChange={(e) => setFormUserName(e.target.value)} required className={formInputClass} />
                            <select value={formUserRole} onChange={(e) => setFormUserRole(e.target.value as UserRole)} required className={formInputClass}>
                                {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                            </select>
                            <input type="text" placeholder="Localização (ex: Teresina - PI)" value={formUserLocation} onChange={(e) => setFormUserLocation(e.target.value)} className={formInputClass} />
                            {!editingUser && <input type="password" placeholder="Senha" value={formUserPassword} onChange={(e) => setFormUserPassword(e.target.value)} required className={formInputClass} />}
                            <div>
                                <label className="text-sm">Foto de Perfil</label>
                                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="text-sm mt-1" />
                            </div>
                            <div className="flex justify-end gap-4 pt-4">
                                <button type="button" onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 bg-slate-200 rounded-lg">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {isResetModalOpen && userToReset && (
                 <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Redefinir Senha para {userToReset.name}</h3>
                        <form onSubmit={handleSavePassword} className="space-y-4">
                            <input type="password" placeholder="Nova Senha" value={formNewPassword} onChange={(e) => setFormNewPassword(e.target.value)} required className={formInputClass} />
                            <input type="password" placeholder="Confirmar Nova Senha" value={formConfirmPassword} onChange={(e) => setFormConfirmPassword(e.target.value)} required className={formInputClass} />
                            <div className="flex justify-end gap-4 pt-4">
                                <button type="button" onClick={() => setIsResetModalOpen(false)} className="px-4 py-2 bg-slate-200 rounded-lg">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg">Salvar Nova Senha</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsView;