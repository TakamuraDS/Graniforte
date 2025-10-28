
import { Product, Movement, MovementType, User, UserRole } from './types';

export const mockUsers: User[] = [
    { id: 1, name: "Admin", role: UserRole.ADMIN, password: "admin", photo: "https://i.pravatar.cc/150?u=admin", location: "Matriz - SP" },
    { id: 2, name: "Carlos Silva", role: UserRole.SUPERVISOR, password: "123", photo: "https://i.pravatar.cc/150?u=carlos", location: "Teresina - PI" },
    { id: 3, name: "Ana Pereira", role: UserRole.FUNCIONARIO, password: "456", photo: "https://i.pravatar.cc/150?u=ana", location: "Teresina - PI" }
];


export const mockProducts: Product[] = [
    {
        id: 1,
        descricao: "Parafuso Sextavado 1/4\" x 1\"",
        unidade: "UN",
        marca: "Ciser",
        tipo: "Fixador",
        aplicacao: "Estruturas Metálicas",
        saldo: 80,
        valorMedio: 0.55,
        priceHistory: [{date: new Date("2025-10-02T10:00:00"), price: 0.50}],
        stockMinimo: 50,
        fornecedor: "Parafusos & Cia",
        localizacao: "Prateleira A-01"
    },
    {
        id: 2,
        descricao: "Chapa de Granito Preto São Gabriel",
        unidade: "M²",
        marca: "Graniforte",
        tipo: "Revestimento",
        aplicacao: "Bancadas e Pisos",
        saldo: 25,
        valorMedio: 280.00,
        priceHistory: [
            {date: new Date("2025-10-01T09:00:00"), price: 250.00},
            {date: new Date("2025-10-10T09:00:00"), price: 300.00},
        ],
        stockMinimo: 10,
        fornecedor: "Marmoraria Imperial",
        localizacao: "Pátio B"
    },
    {
        id: 3,
        descricao: "Disco de Corte Diamantado 4\"",
        unidade: "UN",
        marca: "Bosch",
        tipo: "Ferramenta",
        aplicacao: "Corte de Pedras",
        saldo: 5,
        valorMedio: 25.50,
        priceHistory: [{date: new Date("2025-10-05T08:30:00"), price: 25.00}],
        stockMinimo: 10,
        fornecedor: "Ferramentas SA",
        localizacao: "Armário C-05"
    },
];

export const mockMovements: Movement[] = [
    {
        id: 1,
        codProd: 2,
        data: new Date("2025-10-01T09:00:00"),
        type: MovementType.ENTRADA,
        quantidade: 10,
        precoUnitario: 250.00,
        valorTotal: 2500.00,
        observacao: "Primeira compra",
        userId: 2,
        notaFiscal: "NF-001"
    },
    {
        id: 2,
        codProd: 1,
        data: new Date("2025-10-02T10:00:00"),
        type: MovementType.ENTRADA,
        quantidade: 100,
        precoUnitario: 0.50,
        valorTotal: 50.00,
        observacao: "NF-e 12345",
        userId: 2,
        notaFiscal: "NF-12345"
    },
    {
        id: 3,
        codProd: 2,
        data: new Date("2025-10-03T14:00:00"),
        type: MovementType.SAIDA,
        quantidade: 5,
        precoUnitario: 0, // Not used for 'saida' value calculation
        valorTotal: 1250.00,
        observacao: "Requisição Obra #12",
        userId: 3,
    },
    {
        id: 4,
        codProd: 1,
        data: new Date("2025-10-04T11:00:00"),
        type: MovementType.SAIDA,
        quantidade: 20,
        precoUnitario: 0,
        valorTotal: 10.00,
        observacao: "Uso interno",
        userId: 2,
    },
     {
        id: 5,
        codProd: 3,
        data: new Date("2025-10-05T08:30:00"),
        type: MovementType.ENTRADA,
        quantidade: 20,
        precoUnitario: 25.00,
        valorTotal: 500.00,
        observacao: "Fornecedor Ferramentas SA",
        userId: 3,
        notaFiscal: "NF-889"
    },
    {
        id: 6,
        codProd: 3,
        data: new Date("2025-10-06T16:00:00"),
        type: MovementType.SAIDA,
        quantidade: 15, // Draining stock to test low stock alert
        precoUnitario: 0,
        valorTotal: 375.00,
        observacao: "Equipe de instalação",
        userId: 3,
    },
    {
        id: 7,
        codProd: 2,
        data: new Date("2025-10-10T09:00:00"),
        type: MovementType.ENTRADA,
        quantidade: 20,
        precoUnitario: 300.00,
        valorTotal: 6000.00,
        observacao: "Lote com variação de preço",
        userId: 2,
        notaFiscal: "NF-998"
    }
].sort((a,b) => a.data.getTime() - b.data.getTime());