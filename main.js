// ===== CONSTANTES E CONFIGURAÇÕES =====
const CONFIG = {
    estoqueCritico: 1,
    estoqueBaixo: 20,
    versaoSistema: '2.2', // Atualizada para nova estrutura de PDF
    storageKeys: {
        insumos: 'insumos',
        ultimaContagem: 'ultimaContagem',
        historicoContagens: 'historicoContagens',
        historicoEntradas: 'historicoEntradas',
        versao: 'versao_sistema',
        backup: 'backup_auto'
    }
};

// ===== FUNÇÕES DE UTILIDADE GLOBAIS =====
const Utils = {
    // Formatação de datas
    formatarData: (data) => {
        if (!data) return 'N/A';
        
        try {
            // Converter string para Date object se necessário
            const date = typeof data === 'string' ? new Date(data + 'T00:00:00') : new Date(data);
            
            // Verificar se a data é válida
            if (isNaN(date.getTime())) return 'Data inválida';
            
            return date.toLocaleDateString('pt-BR');
        } catch (error) {
            console.error('Erro ao formatar data:', error, data);
            return 'Erro na data';
        }
    },

    // Formatação de data e hora
    formatarDataHora: (data) => {
        if (!data) return 'N/A';
        
        try {
            const date = new Date(data);
            if (isNaN(date.getTime())) return 'Data inválida';
            
            return date.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Erro ao formatar data/hora:', error);
            return 'Erro na data';
        }
    },

    // Obter data atual no formato YYYY-MM-DD
    getDataAtual: () => {
        const date = new Date();
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    },

    // Obter data e hora atual
    getDataHoraAtual: () => {
        const date = new Date();
        return date.toISOString();
    },

    // Verificar se o estoque está baixo ou crítico
    isEstoqueBaixo: (valor) => {
        return valor <= CONFIG.estoqueCritico || valor <= CONFIG.estoqueBaixo;
    },

    // Debounce para melhorar performance em inputs
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Validar número com casas decimais
    validarNumero: (valor, casasDecimais = 2) => {
        if (valor === '' || valor === null || valor === undefined) return 0;
        
        let numero = parseFloat(valor);
        if (isNaN(numero)) return 0;
        
        if (numero < 0) numero = 0;
        
        // Arredondar para as casas decimais especificadas
        return parseFloat(numero.toFixed(casasDecimais));
    },

    // Gerar ID único
    gerarId: (prefixo = '') => {
        return `${prefixo}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
};

// ===== GERENCIAMENTO DE ARMAZENAMENTO (LOCALSTORAGE) =====
const StorageManager = {
    // Método genérico para obter item
    getItem: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Erro ao carregar ${key}:`, error);
            Notificacoes.mostrarNotificacao(`Erro ao carregar dados. Verifique o console.`, 'error');
            return defaultValue;
        }
    },

    // Método genérico para salvar item
    setItem: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Erro ao salvar ${key}:`, error);
            
            if (error.name === 'QuotaExceededError') {
                Notificacoes.mostrarNotificacao('Espaço de armazenamento insuficiente. Limpe alguns dados.', 'error');
            } else {
                Notificacoes.mostrarNotificacao('Erro ao salvar dados. Tente novamente.', 'error');
            }
            
            return false;
        }
    },

    // Insumos
    getInsumos: () => {
        return StorageManager.getItem(CONFIG.storageKeys.insumos, []);
    },

    saveInsumos: (insumos) => {
        return StorageManager.setItem(CONFIG.storageKeys.insumos, insumos);
    },
    
    // Contagem atual
    getUltimaContagem: () => {
        return StorageManager.getItem(CONFIG.storageKeys.ultimaContagem, null);
    },

    setUltimaContagem: (contagem) => {
        return StorageManager.setItem(CONFIG.storageKeys.ultimaContagem, contagem);
    },

    // Histórico de contagens
    getHistoricoContagens: () => {
        return StorageManager.getItem(CONFIG.storageKeys.historicoContagens, []);
    },

    saveHistoricoContagens: (contagem) => {
        try {
            const historico = StorageManager.getHistoricoContagens();
            historico.push(contagem);
            return StorageManager.setItem(CONFIG.storageKeys.historicoContagens, historico);
        } catch (error) {
            console.error('Erro ao salvar histórico de contagens:', error);
            Notificacoes.mostrarNotificacao('Erro ao salvar histórico de contagens.', 'error');
            return false;
        }
    },
    
    deleteContagem: (id) => {
        try {
            let historico = StorageManager.getHistoricoContagens();
            const novoHistorico = historico.filter(contagem => contagem.id !== id);
            return StorageManager.setItem(CONFIG.storageKeys.historicoContagens, novoHistorico);
        } catch (error) {
            console.error('Erro ao excluir contagem:', error);
            Notificacoes.mostrarNotificacao('Erro ao excluir contagem.', 'error');
            return false;
        }
    },

    // Histórico de entradas
    getHistoricoEntradas: () => {
        return StorageManager.getItem(CONFIG.storageKeys.historicoEntradas, []);
    },

    saveHistoricoEntradas: (entrada) => {
        try {
            const historico = StorageManager.getHistoricoEntradas();
            historico.push(entrada);
            return StorageManager.setItem(CONFIG.storageKeys.historicoEntradas, historico);
        } catch (error) {
            console.error('Erro ao salvar entrada:', error);
            Notificacoes.mostrarNotificacao('Erro ao salvar entrada.', 'error');
            return false;
        }
    },

    deleteHistoricoEntrada: (id) => {
        try {
            let historico = StorageManager.getHistoricoEntradas();
            const entradaExcluida = historico.find(e => e.id === id);
            if (!entradaExcluida) return false;

            let ultimaContagem = StorageManager.getUltimaContagem();
            if (ultimaContagem && ultimaContagem.detalhesContagem[entradaExcluida.insumoId]) {
                ultimaContagem.detalhesContagem[entradaExcluida.insumoId].sobrou -= entradaExcluida.quantidade;
                ultimaContagem.detalhesContagem[entradaExcluida.insumoId].posicaoFinal -= entradaExcluida.quantidade;
                StorageManager.setUltimaContagem(ultimaContagem);
            }

            const novoHistorico = historico.filter(e => e.id !== id);
            return StorageManager.setItem(CONFIG.storageKeys.historicoEntradas, novoHistorico);
        } catch (error) {
            console.error('Erro ao excluir entrada:', error);
            Notificacoes.mostrarNotificacao('Erro ao excluir entrada.', 'error');
            return false;
        }
    },

    updateHistoricoEntrada: (id, novaQuantidade) => {
        try {
            let historico = StorageManager.getHistoricoEntradas();
            const entradaParaAtualizar = historico.find(e => e.id === id);
            if (!entradaParaAtualizar) return false;

            const quantidadeAnterior = entradaParaAtualizar.quantidade;
            const diferenca = novaQuantidade - quantidadeAnterior;

            let ultimaContagem = StorageManager.getUltimaContagem();
            if (ultimaContagem && ultimaContagem.detalhesContagem[entradaParaAtualizar.insumoId]) {
                ultimaContagem.detalhesContagem[entradaParaAtualizar.insumoId].sobrou += diferenca;
                ultimaContagem.detalhesContagem[entradaParaAtualizar.insumoId].posicaoFinal += diferenca;
                StorageManager.setUltimaContagem(ultimaContagem);
            }

            entradaParaAtualizar.quantidade = novaQuantidade;
            return StorageManager.setItem(CONFIG.storageKeys.historicoEntradas, historico);
        } catch (error) {
            console.error('Erro ao atualizar entrada:', error);
            Notificacoes.mostrarNotificacao('Erro ao atualizar entrada.', 'error');
            return false;
        }
    },
    
    // Exclusão completa de um insumo e seus dados
    excluirDadosDoInsumo: (insumoId) => {
        try {
            // Remove o insumo
            let insumos = StorageManager.getInsumos().filter(i => i.id !== insumoId);
            StorageManager.saveInsumos(insumos);

            // Remove o insumo do histórico de entradas
            let historicoEntradas = StorageManager.getHistoricoEntradas().filter(e => e.insumoId !== insumoId);
            StorageManager.setItem(CONFIG.storageKeys.historicoEntradas, historicoEntradas);

            // Remove o insumo das contagens históricas
            let historicoContagens = StorageManager.getHistoricoContagens();
            historicoContagens.forEach(c => {
                delete c.detalhesContagem[insumoId];
            });
            StorageManager.setItem(CONFIG.storageKeys.historicoContagens, historicoContagens);

            // Remove o insumo da última contagem
            let ultimaContagem = StorageManager.getUltimaContagem();
            if (ultimaContagem && ultimaContagem.detalhesContagem) {
                delete ultimaContagem.detalhesContagem[insumoId];
                StorageManager.setUltimaContagem(ultimaContagem);
            }
            
            return true;
        } catch (error) {
            console.error('Erro ao excluir dados do insumo:', error);
            Notificacoes.mostrarNotificacao('Erro ao excluir dados do insumo. Tente novamente.', 'error');
            return false;
        }
    },

    // Limpar todos os dados (apenas para desenvolvimento)
    limparTodosDados: () => {
        if (confirm('⚠️ ATENÇÃO: Isso apagará TODOS os dados. Tem certeza?')) {
            Object.values(CONFIG.storageKeys).forEach(key => {
                localStorage.removeItem(key);
            });
            Notificacoes.mostrarNotificacao('Todos os dados foram removidos.', 'info');
        }
    },

    // Estatísticas do storage
    getEstatisticasStorage: () => {
        const stats = {};
        let totalSize = 0;

        Object.values(CONFIG.storageKeys).forEach(key => {
            const item = localStorage.getItem(key);
            if (item) {
                const size = new Blob([item]).size;
                stats[key] = {
                    tamanho: size,
                    tamanhoKB: (size / 1024).toFixed(2),
                    items: key.includes('historico') ? JSON.parse(item).length : 'N/A'
                };
                totalSize += size;
            }
        });

        return {
            detalhes: stats,
            totalKB: (totalSize / 1024).toFixed(2),
            totalMB: (totalSize / (1024 * 1024)).toFixed(2)
        };
    }
};

// ===== NOTIFICAÇÕES =====
const Notificacoes = {
    mostrarNotificacao: (mensagem, tipo = 'info', tempo = 3000) => {
        // Remover notificações existentes
        const notificacoesExistentes = document.querySelectorAll('.custom-notification');
        notificacoesExistentes.forEach(notif => {
            notif.remove();
        });

        // Criar nova notificação
        const notification = document.createElement('div');
        notification.className = `custom-notification alert alert-${tipo} alert-dismissible fade show`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            max-width: 500px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideInRight 0.3s ease;
        `;
        
        notification.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi ${this.getIconePorTipo(tipo)} me-2"></i>
                <div>${mensagem}</div>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
        `;
        
        document.body.appendChild(notification);

        // Auto-remover após o tempo especificado
        if (tempo > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, tempo);
        }
    },

    getIconePorTipo: (tipo) => {
        const icones = {
            success: 'bi-check-circle-fill',
            error: 'bi-x-circle-fill',
            warning: 'bi-exclamation-triangle-fill',
            info: 'bi-info-circle-fill'
        };
        return icones[tipo] || 'bi-info-circle-fill';
    }
};

// ===== INICIALIZAÇÃO E MIGRAÇÃO DO SISTEMA =====
function migrarDados() {
    const versaoAtual = localStorage.getItem(CONFIG.storageKeys.versao);
    
    if (!versaoAtual || versaoAtual !== CONFIG.versaoSistema) {
        try {
            console.log(`🔄 Migrando dados da versão ${versaoAtual || 'null'} para ${CONFIG.versaoSistema}`);
            
            // Fazer backup antes da migração
            fazerBackupAutomatico();
            
            // Atualizar versão
            localStorage.setItem(CONFIG.storageKeys.versao, CONFIG.versaoSistema);
            
            console.log('✅ Migração concluída com sucesso');
            Notificacoes.mostrarNotificacao('Sistema atualizado com sucesso!', 'success');
            
        } catch (error) {
            console.error('❌ Erro na migração de dados:', error);
            Notificacoes.mostrarNotificacao('Erro na atualização do sistema.', 'error');
        }
    }
}

function fazerBackupAutomatico() {
    try {
        const dados = {
            insumos: StorageManager.getInsumos(),
            historico: StorageManager.getHistoricoContagens(),
            entradas: StorageManager.getHistoricoEntradas(),
            ultimaContagem: StorageManager.getUltimaContagem(),
            timestamp: new Date().toISOString(),
            versao: CONFIG.versaoSistema
        };
        
        StorageManager.setItem(CONFIG.storageKeys.backup, dados);
        console.log('✅ Backup automático realizado');
        
    } catch (error) {
        console.error('❌ Erro ao fazer backup automático:', error);
    }
}

function inicializarInsumos() {
    const insumosExistentes = StorageManager.getInsumos();
    
    if (insumosExistentes.length === 0) {
        console.log('📦 Inicializando insumos padrão...');
        
        const insumosPadrao = [
            { id: 'insumo-4queijos', nome: '4 queijos', unidade: 'porção' },
            { id: 'insumo-azeitona', nome: 'Azeitona', unidade: 'balde' },
            { id: 'insumo-bacon', nome: 'Bacon', unidade: 'porção' },
            { id: 'insumo-brocolis', nome: 'Brócolis', unidade: 'pote' },
            { id: 'insumo-calabresa', nome: 'Calabresa', unidade: 'porção' },
            { id: 'insumo-calabresapicante', nome: 'Calabresa picante', unidade: 'porção' },
            { id: 'insumo-camarao', nome: 'Camarão', unidade: 'porção' },
            { id: 'insumo-carnedepanela', nome: 'Carne de panela', unidade: 'porção' },
            { id: 'insumo-cebola', nome: 'Cebola', unidade: 'balde' },
            { id: 'insumo-cebolacaramelizada', nome: 'Cebola caramelizada', unidade: 'pote' },
            { id: 'insumo-chester', nome: 'Chester', unidade: 'porção' },
            { id: 'insumo-coracao', nome: 'Coração', unidade: 'porção' },
            { id: 'insumo-costelao', nome: 'Costelão', unidade: 'porção' },
            { id: 'insumo-doritos', nome: 'Doritos', unidade: 'porção' },
            { id: 'insumo-frangoaomolho', nome: 'Frango ao molho', unidade: 'porção' },
            { id: 'insumo-frangoemcubos', nome: 'Frango em cubos', unidade: 'porção' },
            { id: 'insumo-geleia', nome: 'Geleia de amora', unidade: 'balde' },
            { id: 'insumo-iscasdecarne', nome: 'Iscas de carne', unidade: 'porção' },
            { id: 'insumo-macacaramelizada', nome: 'Maçã caramelizada', unidade: 'pote' },
            { id: 'insumo-molhobarbecue', nome: 'Molho Barbecue', unidade: 'balde' },
            { id: 'insumo-molhopesto', nome: 'Molho pesto', unidade: 'pote' },
            { id: 'insumo-molhoalhoeoleo', nome: 'Molho alho e óleo', unidade: 'pote' },
            { id: 'insumo-molhomaracuja', nome: 'Molho de Maracujá', unidade: 'pote' },
            { id: 'insumo-molhovermelho', nome: 'Molho vermelho pra Camarão', unidade: 'pote' },
            { id: 'insumo-ovoemconserva', nome: 'Ovo em conserva', unidade: 'balde' },
            { id: 'insumo-parmesao', nome: 'Parmesão', unidade: 'unidade' },
            { id: 'insumo-pepperoni', nome: 'Pepperoni', unidade: 'porção' },
            { id: 'insumo-presunto', nome: 'Presunto', unidade: 'porção' },
            { id: 'insumo-queijobrie', nome: 'Queijo brie', unidade: 'porção' },
            { id: 'insumo-queijogorgonzola', nome: 'Queijo gorgonzola', unidade: 'porção' },
            { id: 'insumo-salmao', nome: 'Salmão', unidade: 'porção' },
            { id: 'insumo-strogonoffcarne', nome: 'Strogonoff de carne', unidade: 'porção' },
            { id: 'insumo-strogonofffrango', nome: 'Strogonoff de frango', unidade: 'porção' },
            { id: 'insumo-tomate', nome: 'Tomate', unidade: 'pote' },
            { id: 'insumo-vinagrete', nome: 'Vinagrete', unidade: 'pote' }
        ];
        
        if (StorageManager.saveInsumos(insumosPadrao)) {
            console.log('✅ Insumos padrão inicializados');
        }
    }
}

// Inicialização do sistema quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando sistema de insumos...');
    migrarDados();
    inicializarInsumos();
    console.log('✅ Sistema inicializado com sucesso');
});

// Funções globais de backup e debug para uso no console
window.fazerBackup = () => {
    try {
        const dados = {
            insumos: StorageManager.getInsumos(),
            historico: StorageManager.getHistoricoContagens(),
            entradas: StorageManager.getHistoricoEntradas(),
            ultimaContagem: StorageManager.getUltimaContagem(),
            timestamp: new Date().toISOString(),
            versao: CONFIG.versaoSistema
        };
        
        const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_insumos_${Utils.getDataAtual()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        Notificacoes.mostrarNotificacao('Backup realizado com sucesso!', 'success');
        
    } catch (error) {
        console.error('❌ Erro ao fazer backup:', error);
        Notificacoes.mostrarNotificacao('Erro ao realizar backup.', 'error');
    }
};

window.debugSistema = () => {
    console.log('=== DEBUG DO SISTEMA ===');
    console.log('LocalStorage keys:', Object.keys(localStorage));
    console.log('Configuração:', CONFIG);
    console.log('Insumos:', StorageManager.getInsumos());
    console.log('Histórico contagens:', StorageManager.getHistoricoContagens());
    console.log('Entradas:', StorageManager.getHistoricoEntradas());
    console.log('Última contagem:', StorageManager.getUltimaContagem());
    console.log('Estatísticas storage:', StorageManager.getEstatisticasStorage());
    console.log('=========================');
};

window.limparDados = StorageManager.limparTodosDados;

// Adicionar estilos CSS para animações
if (!document.querySelector('#animations-css')) {
    const style = document.createElement('style');
    style.id = 'animations-css';
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        .custom-notification {
            animation: slideInRight 0.3s ease !important;
        }
    `;
    document.head.appendChild(style);
    }
