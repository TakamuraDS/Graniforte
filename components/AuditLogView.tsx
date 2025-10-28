
import React from 'react';
import { AuditLog } from '../types';

interface AuditLogViewProps {
    auditLog: AuditLog[];
}

const AuditLogView: React.FC<AuditLogViewProps> = ({ auditLog }) => {
    
    const formatTimestamp = (date: Date) => {
        return new Intl.DateTimeFormat('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'medium'
        }).format(new Date(date));
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white text-center">Log de Auditoria</h1>

            <div className="bg-white dark:bg-slate-800 shadow-xl rounded-xl overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Registros de todas as modificações realizadas no sistema.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                {['Data/Hora', 'Usuário', 'Ação', 'Detalhes'].map(header => (
                                    <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                            {auditLog.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-16 text-slate-500 dark:text-slate-400">
                                        <h3 className="text-lg font-semibold">Nenhuma atividade registrada</h3>
                                        <p className="mt-1">As ações dos usuários aparecerão aqui.</p>
                                    </td>
                                </tr>
                            ) : (
                                auditLog.map(log => (
                                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{formatTimestamp(log.timestamp)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100 font-medium">
                                            <div className='flex items-center gap-3'>
                                                <img src={log.userPhoto} alt={log.user} className="w-9 h-9 rounded-full object-cover" />
                                                <span>{log.user}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                log.action.includes('Adicionado') || log.action.includes('Entrada') ? 'bg-green-100 text-green-800' :
                                                log.action.includes('Atualizado') ? 'bg-yellow-100 text-yellow-800' :
                                                log.action.includes('Excluída') ? 'bg-red-100 text-red-800' :
                                                'bg-sky-100 text-sky-800'
                                            }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 break-words">{log.details}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AuditLogView;