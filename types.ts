

export enum MovementType {
    ENTRADA = 'Entrada',
    SAIDA = 'Saída',
    RETORNO = 'Retorno',
    AJUSTE_POSITIVO = 'Ajuste de Entrada',
    AJUSTE_NEGATIVO = 'Ajuste de Saída',
}

export enum View {
    DASHBOARD = 'Dashboard',
    MOVEMENTS = 'Controle de Estoque',
    PRODUCTS = 'Cadastro de Produtos',
    INVENTORY = 'Inventário',
    REPORTS = 'Relatórios',
    SETTINGS = 'Configurações',
}

export enum UserRole {
    ADMIN = 'Admin',
    SUPERVISOR = 'Supervisor',
    FUNCIONARIO = 'Funcionario',
}

export interface User {
    id: number;
    name: string;
    role: UserRole;
    password; // In a real app, this would be a hash
    photo: string; // Can be a URL or a base64 string
    location?: string;
}

export interface PriceHistoryEntry {
    date: Date;
    price: number;
}

export interface Product {
    id: number;
    descricao: string;
    unidade: string;
    marca: string;
    tipo: string;
    aplicacao: string;
    saldo: number;
    valorMedio: number;
    ultimaDataZeramento?: Date;
    dataZeramentoAtual?: Date;
    priceHistory: PriceHistoryEntry[];
    // New fields
    stockMinimo: number;
    fornecedor: string;
    localizacao: string;
}

export interface Movement {
    id: number;
    codProd: number;
    data: Date;
    type: MovementType;
    quantidade: number;
    precoUnitario: number; 
    valorTotal: number;
    observacao: string;
    userId: number;
    notaFiscal?: string;
}

export interface LedgerEntry extends Movement {
    saldoQtd: number;
    saldoValor: number;
    precoMedioAtual: number;
    produtoDescricao: string;
    userName: string;
    highlightRow: boolean;
}

export interface AuditLog {
    id: number;
    user: string;
    userPhoto?: string;
    action: string;
    details: string;
    timestamp: Date;
}