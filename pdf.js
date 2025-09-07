// ===== CONSTANTES E CONFIGURAÇÕES =====
const CONFIG = {
    estoqueCritico: 1,
    estoqueBaixo: 20,
    versaoSistema: '2.3', // Versão final com todas as melhorias
    storageKeys: {
        insumos: 'insumos',
        ultimaContagem: 'ultimaContagem',
        historicoContagens: 'historicoContagens',
        historicoEntradas: 'historicoEntradas',
        versao: 'versao_sistema',
        backup: 'backup_auto'
    },
    limites: {
        maxInsumos: 500,
        maxHistoricoContagens: 1000,
        maxHistoricoEntradas: 2000,
        maxQuantidade: 100000
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
        if (valor === null || valor === undefined) return false;
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
        if (numero > CONFIG.limites.maxQuantidade) numero = CONFIG.limites.maxQuantidade;
        
        // Arredondar para as casas decimais especificadas
        return parseFloat(numero.toFixed(casasDecimais));
    },

    // Gerar ID único
    gerarId: (prefixo = '') => {
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substr(2, 9);
        return `${prefixo}${timestamp}-${randomStr}`;
    },

    // Validar email (para futuras funcionalidades)
    validarEmail: (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    // Formatar número para exibição
    formatarNumeroExibicao: (numero, casasDecimais = 2) => {
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: casasDecimais,
            maximumFractionDigits: casasDecimais
        }).format(numero);
    },

    // Calcular diferença em dias entre duas datas
    diferencaDias: (data1, data2) => {
        const umDia = 24 * 60 * 60 * 1000;
        const primeiraData = new Date(data1);
        const segundaData = new Date(data2);
        return Math.round(Math.abs((primeiraData - segundaData) / umDia));
    }
};

// ===== GERENCIAMENTO DE ARMAZENAMENTO (LOCALSTORAGE) =====
const StorageManager = {
    // Método genérico para obter item
    getItem: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(key);
            if (!item) return defaultValue;
            
            const parsed = JSON.parse(item);
            
            // Verificar se o item é muito grande (performance)
            if (item.length > 1000000) { // 1MB
                console.warn(`⚠️ Item ${key} é muito grande: ${(item.length / 1024 / 1024).toFixed(2)}MB`);
            }
            
            return parsed;
        } catch (error) {
            console.error(`Erro ao carregar ${key}:`, error);
            Notificacoes.mostrarNotificacao(`Erro ao carregar dados. Verifique o console.`, 'error');
            return defaultValue;
        }
    },

    // Método genérico para salvar item
    setItem: (key, value) => {
        try {
            // Verificar tamanho dos dados
            const jsonString = JSON.stringify(value);
            if (jsonString.length > 5000000) { // 5MB
                console.error(`❌ Dados muito grandes para ${key}: ${(jsonString.length / 1024 / 1024).toFixed(2)}MB`);
                Notificacoes.mostrarNotificacao('Dados muito grandes. Algumas informações não foram salvas.', 'warning');
                return false;
            }
            
            localStorage.setItem(key, jsonString);
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
        // Validar limite máximo
        if (insumos.length > CONFIG.limites.maxInsumos) {
            Notificacoes.mostrarNotificacao(`Limite máximo de ${CONFIG.limites.maxInsumos} insumos atingido.`, 'warning');
            insumos = insumos.slice(0, CONFIG.limites.maxInsumos);
        }
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
        const historico = StorageManager.getItem(CONFIG.storageKeys.historicoContagens, []);
        
        // Manter apenas as últimas X contagens (performance)
        if (historico.length > CONFIG.limites.maxHistoricoContagens) {
            console.warn(`⚠️ Histórico de contagens muito grande (${historico.length}), mantendo apenas as últimas ${CONFIG.limites.maxHistoricoContagens}`);
            return historico.slice(-CONFIG.limites.maxHistoricoContagens);
        }
        
        return historico;
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
        const historico = StorageManager.getItem(CONFIG.storageKeys.historicoEntradas, []);
        
        // Manter apenas as últimas X entradas (performance)
        if (historico.length > CONFIG.limites.maxHistoricoEntradas) {
            console.warn(`⚠️ Histórico de entradas muito grande (${historico.length}), mantendo apenas as últimas ${CONFIG.limites.maxHistoricoEntradas}`);
            return historico.slice(-CONFIG.limites.maxHistoricoEntradas);
        }
        
        return historico;
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
            return true;
        }
        return false;
    },

    // Estatísticas do storage
    getEstatisticasStorage: () => {
        const stats = {};
        let totalSize = 0;

        Object.values(CONFIG.storageKeys).forEach(key => {
            const item = localStorage.getItem(key);
            if (item) {
                const size = new Blob([item]).size;
                const itemCount = key.includes('historico') ? JSON.parse(item).length : 'N/A';
                
                stats[key] = {
                    tamanho: size,
                    tamanhoKB: (size / 1024).toFixed(2),
                    tamanhoMB: (size / (1024 * 1024)).toFixed(3),
                    items: itemCount
                };
                totalSize += size;
            }
        });

        return {
            detalhes: stats,
            totalKB: (totalSize / 1024).toFixed(2),
            totalMB: (totalSize / (1024 * 1024)).toFixed(3),
            percentualUsado: ((totalSize / (5 * 1024 * 1024)) * 100).toFixed(1) // Assume 5MB limite
        };
    },

    // Backup completo do sistema
    fazerBackupCompleto: () => {
        try {
            const backup = {
                insumos: StorageManager.getInsumos(),
                historicoContagens: StorageManager.getHistoricoContagens(),
                historicoEntradas: StorageManager.getHistoricoEntradas(),
                ultimaContagem: StorageManager.getUltimaContagem(),
                timestamp: new Date().toISOString(),
                versao: CONFIG.versaoSistema,
                metadata: {
                    totalInsumos: StorageManager.getInsumos().length,
                    totalContagens: StorageManager.getHistoricoContagens().length,
                    totalEntradas: StorageManager.getHistoricoEntradas().length,
                    dataBackup: Utils.getDataAtual()
                }
            };
            
            const blob = new Blob([JSON.stringify(backup, null, 2)], { 
                type: 'application/json' 
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_completo_${Utils.getDataAtual()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            Notificacoes.mostrarNotificacao('Backup completo realizado com sucesso!', 'success');
            return true;
        } catch (error) {
            console.error('Erro ao fazer backup completo:', error);
            Notificacoes.mostrarNotificacao('Erro ao fazer backup.', 'error');
            return false;
        }
    },

    // Restaurar de backup
    restaurarBackup: (backupData) => {
        try {
            if (!backupData || typeof backupData !== 'object') {
                throw new Error('Dados de backup inválidos');
            }

            // Validar estrutura do backup
            const camposObrigatorios = ['insumos', 'historicoContagens', 'historicoEntradas', 'ultimaContagem'];
            const isValid = camposObrigatorios.every(campo => campo in backupData);
            
            if (!isValid) {
                throw new Error('Estrutura de backup inválida');
            }

            // Fazer backup atual antes de restaurar
            fazerBackupAutomatico();

            // Restaurar dados
            StorageManager.setItem(CONFIG.storageKeys.insumos, backupData.insumos || []);
            StorageManager.setItem(CONFIG.storageKeys.historicoContagens, backupData.historicoContagens || []);
            StorageManager.setItem(CONFIG.storageKeys.historicoEntradas, backupData.historicoEntradas || []);
            StorageManager.setItem(CONFIG.storageKeys.ultimaContagem, backupData.ultimaContagem || null);

            Notificacoes.mostrarNotificacao('Backup restaurado com sucesso!', 'success');
            return true;
        } catch (error) {
            console.error('Erro ao restaurar backup:', error);
            Notificacoes.mostrarNotificacao('Erro ao restaurar backup. Verifique o arquivo.', 'error');
            return false;
        }
    },

    // Verificar integridade dos dados
    verificarIntegridade: () => {
        const problemas = [];
        
        // Verificar insumos
        const insumos = StorageManager.getInsumos();
        insumos.forEach((insumo, index) => {
            if (!insumo.id || !insumo.nome || !insumo.unidade) {
                problemas.push(`Insumo inválido na posição ${index}: ${JSON.stringify(insumo)}`);
            }
        });
        
        // Verificar contagens
        const contagens = StorageManager.getHistoricoContagens();
        contagens.forEach((contagem, index) => {
            if (!contagem.id || !contagem.data || !contagem.responsavel) {
                problemas.push(`Contagem inválida na posição ${index}: ${JSON.stringify(contagem)}`);
            }
        });

        // Verificar entradas
        const entradas = StorageManager.getHistoricoEntradas();
        entradas.forEach((entrada, index) => {
            if (!entrada.id || !entrada.insumoId || !entrada.quantidade || !entrada.data) {
                problemas.push(`Entrada inválida na posição ${index}: ${JSON.stringify(entrada)}`);
            }
        });
        
        return problemas;
    },

    // Otimizar storage (remover dados duplicados/antigos)
    otimizarStorage: () => {
        console.log('🔄 Otimizando storage...');
        
        // Remover contagens duplicadas
        const contagens = StorageManager.getHistoricoContagens();
        const contagensUnicas = contagens.filter((contagem, index, array) => 
            index === array.findIndex(c => c.id === contagem.id)
        );
        
        if (contagens.length !== contagensUnicas.length) {
            StorageManager.setItem(CONFIG.storageKeys.historicoContagens, contagensUnicas);
            console.log(`✅ Removidas ${contagens.length - contagensUnicas.length} contagens duplicadas`);
        }
        
        // Remover entradas duplicadas
        const entradas = StorageManager.getHistoricoEntradas();
        const entradasUnicas = entradas.filter((entrada, index, array) => 
            index === array.findIndex(e => e.id === entrada.id)
        );
        
        if (entradas.length !== entradasUnicas.length) {
            StorageManager.setItem(CONFIG.storageKeys.historicoEntradas, entradasUnicas);
            console.log(`✅ Removidas ${entradas.length - entradasUnicas.length} entradas duplicadas`);
        }
        
        return true;
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
                <i class="bi ${Notificacoes.getIconePorTipo(tipo)} me-2"></i>
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
            
            // Executar otimização durante a migração
            StorageManager.otimizarStorage();
            
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
    
    migrarDados();
    inicializarInsumos();
    
    // Verificar integridade dos dados em background
    setTimeout(() => {
        const problemas = StorageManager.verificarIntegridade();
        if (problemas.length > 0) {
            console.warn('⚠️ Problemas de integridade encontrados:', problemas);
            if (problemas.length > 5) {
                Notificacoes.mostrarNotificacao(
                    `Encontrados ${problemas.length} problemas de integridade. Verifique o console.`,
                    'warning'
                );
            }
        }
    }, 2000);
    
    console.log('✅ Sistema inicializado com sucesso');
});

// ===== FUNÇÕES GLOBAIS PARA USO NO CONSOLE =====
window.fazerBackup = StorageManager.fazerBackupCompleto;

window.debugSistema = () => {
    console.log('=== DEBUG DO SISTEMA ===');
    console.log('LocalStorage keys:', Object.keys(localStorage));
    console.log('Configuração:', CONFIG);
    console.log('Insumos:', StorageManager.getInsumos());
    console.log('Histórico contagens:', StorageManager.getHistoricoContagens());
    console.log('Entradas:', StorageManager.getHistoricoEntradas());
    console.log('Última contagem:', StorageManager.getUltimaContagem());
    console.log('Estatísticas storage:', StorageManager.getEstatisticasStorage());
    
    const problemas = StorageManager.verificarIntegridade();
    if (problemas.length > 0) {
        console.warn('Problemas de integridade:', problemas);
    }
    
    console.log('=========================');
};

window.limparDados = StorageManager.limparTodosDados;

window.otimizarStorage = StorageManager.otimizarStorage;

window.verificarIntegridade = () => {
    const problemas = StorageManager.verificarIntegridade();
    console.log('=== VERIFICAÇÃO DE INTEGRIDADE ===');
    if (problemas.length === 0) {
        console.log('✅ Todos os dados estão íntegros');
    } else {
        console.warn(`⚠️ ${problemas.length} problemas encontrados:`, problemas);
    }
    return problemas;
};

window.restaurarBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const backupData = JSON.parse(event.target.result);
                if (confirm('Tem certeza que deseja restaurar este backup? Todos os dados atuais serão substituídos.')) {
                    StorageManager.restaurarBackup(backupData);
                }
            } catch (error) {
                console.error('Erro ao ler arquivo de backup:', error);
                Notificacoes.mostrarNotificacao('Erro ao ler arquivo de backup.', 'error');
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
};

// Função para testar performance
window.testarPerformance = () => {
    console.log('🧪 Testando performance...');
    const startTime = performance.now();
    
    // Testar operações comuns
    StorageManager.getInsumos();
    StorageManager.getHistoricoContagens();
    StorageManager.getHistoricoEntradas();
    
    const endTime = performance.now();
    console.log(`⏱️ Tempo de execução: ${(endTime - startTime).toFixed(2)}ms`);
    
    const stats = StorageManager.getEstatisticasStorage();
    console.log('📊 Estatísticas de storage:', stats);
    
    return endTime - startTime;
};
