// ===== CONSTANTES E CONFIGURAÇÕES =====
const CONFIG = {
    estoqueCritico: 1,
    estoqueBaixo: 20,
    versaoSistema: '2.1' // Versão atualizada para refletir a nova estrutura
};

// ===== FUNÇÕES DE UTILIDADE GLOBAIS =====
const Utils = {
    // Formatação de datas
    formatarData: (data) => {
        if (!data) return 'N/A';
        const date = new Date(data);
        return date.toLocaleDateString('pt-BR');
    },

    // Obter data atual no formato YYYY-MM-DD
    getDataAtual: () => {
        const date = new Date();
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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
    }
};

// ===== GERENCIAMENTO DE ARMAZENAMENTO (LOCALSTORAGE) =====
const StorageManager = {
    // Insumos
    getInsumos: () => {
        try {
            const insumos = localStorage.getItem('insumos');
            return insumos ? JSON.parse(insumos) : [];
        } catch (error) {
            console.error('Erro ao carregar insumos:', error);
            return [];
        }
    },

    saveInsumos: (insumos) => {
        try {
            localStorage.setItem('insumos', JSON.stringify(insumos));
            return true;
        } catch (error) {
            console.error('Erro ao salvar insumos:', error);
            Notificacoes.mostrarNotificacao('Erro ao salvar insumos. Verifique o espaço disponível.', 'error');
            return false;
        }
    },
    
    // Contagem atual
    getUltimaContagem: () => {
        try {
            const contagem = localStorage.getItem('ultimaContagem');
            return contagem ? JSON.parse(contagem) : null;
        } catch (error) {
            console.error('Erro ao carregar última contagem:', error);
            return null;
        }
    },

    setUltimaContagem: (contagem) => {
        try {
            localStorage.setItem('ultimaContagem', JSON.stringify(contagem));
            return true;
        } catch (error) {
            console.error('Erro ao salvar última contagem:', error);
            Notificacoes.mostrarNotificacao('Erro ao salvar contagem. Verifique o espaço disponível.', 'error');
            return false;
        }
    },

    // Histórico de contagens
    getHistoricoContagens: () => {
        try {
            const historico = localStorage.getItem('historicoContagens');
            return historico ? JSON.parse(historico) : [];
        } catch (error) {
            console.error('Erro ao carregar histórico de contagens:', error);
            return [];
        }
    },

    saveHistoricoContagens: (contagem) => {
        try {
            const historico = StorageManager.getHistoricoContagens();
            historico.push(contagem);
            localStorage.setItem('historicoContagens', JSON.stringify(historico));
            return true;
        } catch (error) {
            console.error('Erro ao salvar histórico de contagens:', error);
            Notificacoes.mostrarNotificacao('Erro ao salvar histórico de contagens. Verifique o espaço disponível.', 'error');
            return false;
        }
    },
    
    deleteContagem: (id) => {
        try {
            let historico = StorageManager.getHistoricoContagens();
            const novoHistorico = historico.filter(contagem => contagem.id !== id);
            localStorage.setItem('historicoContagens', JSON.stringify(novoHistorico));
            return true;
        } catch (error) {
            console.error('Erro ao excluir contagem:', error);
            Notificacoes.mostrarNotificacao('Erro ao excluir contagem.', 'error');
            return false;
        }
    },

    // Histórico de entradas
    getHistoricoEntradas: () => {
        try {
            const historico = localStorage.getItem('historicoEntradas');
            return historico ? JSON.parse(historico) : [];
        } catch (error) {
            console.error('Erro ao carregar histórico de entradas:', error);
            return [];
        }
    },

    saveHistoricoEntradas: (entrada) => {
        try {
            const historico = StorageManager.getHistoricoEntradas();
            historico.push(entrada);
            localStorage.setItem('historicoEntradas', JSON.stringify(historico));
            return true;
        } catch (error) {
            console.error('Erro ao salvar entrada:', error);
            Notificacoes.mostrarNotificacao('Erro ao salvar entrada. Verifique o espaço disponível.', 'error');
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
            localStorage.setItem('historicoEntradas', JSON.stringify(novoHistorico));
            return true;
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
            localStorage.setItem('historicoEntradas', JSON.stringify(historico));
            return true;
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
            localStorage.setItem('historicoEntradas', JSON.stringify(historicoEntradas));

            // Remove o insumo das contagens históricas
            let historicoContagens = StorageManager.getHistoricoContagens();
            historicoContagens.forEach(c => {
                delete c.detalhesContagem[insumoId];
            });
            localStorage.setItem('historicoContagens', JSON.stringify(historicoContagens));

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
    }
};

// ===== NOTIFICAÇÕES =====
const Notificacoes = {
    mostrarNotificacao: (mensagem, tipo = 'info', tempo = 3000) => {
        const notificacoesExistentes = document.querySelectorAll('.custom-notification');
        notificacoesExistentes.forEach(notif => notif.remove());

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
        `;
        notification.innerHTML = `
            ${mensagem}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
        `;
        document.body.appendChild(notification);

        if (tempo > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, tempo);
        }
    }
};

// ===== INICIALIZAÇÃO E MIGRAÇÃO DO SISTEMA =====
function migrarDados() {
    const versaoAtual = localStorage.getItem('versao_sistema');
    if (!versaoAtual || versaoAtual !== CONFIG.versaoSistema) {
        try {
            console.log(`Migrando dados da versão ${versaoAtual || 'null'} para ${CONFIG.versaoSistema}`);
            fazerBackupAutomatico();
            localStorage.setItem('versao_sistema', CONFIG.versaoSistema);
        } catch (error) {
            console.error('Erro na migração de dados:', error);
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
        localStorage.setItem('backup_auto', JSON.stringify(dados));
        console.log('✅ Backup automático realizado');
    } catch (error) {
        console.error('Erro ao fazer backup automático:', error);
    }
}

function inicializarInsumos() {
    const insumosExistentes = StorageManager.getInsumos();
    if (insumosExistentes.length === 0) {
        console.log('Inicializando insumos padrão...');
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
        StorageManager.saveInsumos(insumosPadrao);
    }
}

// Inicialização do sistema quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    migrarDados();
    inicializarInsumos();
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
        console.error('Erro ao fazer backup:', error);
        Notificacoes.mostrarNotificacao('Erro ao realizar backup.', 'error');
    }
};

window.debugSistema = () => {
    console.log('=== DEBUG DO SISTEMA ===');
    console.log('LocalStorage keys:', Object.keys(localStorage));
    console.log('Insumos:', StorageManager.getInsumos());
    console.log('Histórico contagens:', StorageManager.getHistoricoContagens());
    console.log('Entradas:', StorageManager.getHistoricoEntradas());
    console.log('Última contagem:', StorageManager.getUltimaContagem());
    console.log('=========================');
};

