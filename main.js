// ===== CONSTANTES E CONFIGURAÇÕES =====
const CONFIG = {
    estoqueCritico: 1,
    estoqueBaixo: 20,
    versaoSistema: '2.0'
};

// ===== FUNÇÕES DE UTILIDADE =====
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

    // Verificar se o estoque está baixo
    isEstoqueBaixo: (valor) => {
        return valor <= CONFIG.estoqueCritico || valor === CONFIG.estoqueBaixo || valor < 0;
    },

    // Debounce para melhorar performance
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

    // Validar número positivo
    validarNumeroPositivo: (valor, campo) => {
        const num = parseFloat(valor);
        if (isNaN(num) || num < 0) {
            throw new Error(`Valor inválido para ${campo}. Deve ser um número positivo.`);
        }
        return num;
    }
};

// ===== GERENCIAMENTO DE ARMAZENAMENTO =====
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
            Utils.mostrarNotificacao('Erro ao salvar insumos. Verifique o espaço disponível.', 'error');
            return false;
        }
    },

    // Última contagem
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
            Utils.mostrarNotificacao('Erro ao salvar contagem. Verifique o espaço disponível.', 'error');
            return false;
        }
    },

    // Histórico de contagens
    getHistoricoContagens: () => {
        try {
            const historico = localStorage.getItem('historicoContagens');
            return historico ? JSON.parse(historico) : [];
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
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
            console.error('Erro ao salvar histórico:', error);
            Utils.mostrarNotificacao('Erro ao salvar histórico. Verifique o espaço disponível.', 'error');
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
            Utils.mostrarNotificacao('Erro ao excluir contagem.', 'error');
            return false;
        }
    },

    // Histórico de entradas
    getHistoricoEntradas: () => {
        try {
            const historico = localStorage.getItem('historicoEntradas');
            return historico ? JSON.parse(historico) : [];
        } catch (error) {
            console.error('Erro ao carregar entradas:', error);
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
            Utils.mostrarNotificacao('Erro ao salvar entrada. Verifique o espaço disponível.', 'error');
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
            Utils.mostrarNotificacao('Erro ao excluir entrada.', 'error');
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
            Utils.mostrarNotificacao('Erro ao atualizar entrada.', 'error');
            return false;
        }
    }
};

// ===== NOTIFICAÇÕES =====
const Notificacoes = {
    mostrarNotificacao: (mensagem, tipo = 'info', tempo = 3000) => {
        // Remove notificações existentes
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

        // Auto-remove após o tempo especificado
        if (tempo > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, tempo);
        }
    }
};

// Atribuir a função de notificação às Utils
Utils.mostrarNotificacao = Notificacoes.mostrarNotificacao;

// ===== INICIALIZAÇÃO DO SISTEMA =====
function inicializarSistema() {
    migrarDados();
    inicializarInsumos();
    inicializarEventListeners();
}

function migrarDados() {
    const versaoAtual = localStorage.getItem('versao_sistema');
    if (!versaoAtual || versaoAtual !== CONFIG.versaoSistema) {
        try {
            // Fazer backup antes da migração
            fazerBackupAutomatico();
            
            // Migrar dados se necessário
            if (!versaoAtual) {
                console.log('Migrando dados para versão', CONFIG.versaoSistema);
            }
            
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
    } catch (error) {
        console.error('Erro ao fazer backup automático:', error);
    }
}

function inicializarInsumos() {
    const insumosExistentes = StorageManager.getInsumos();
    if (insumosExistentes.length === 0) {
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

function inicializarEventListeners() {
    // Event listeners globais serão adicionados aqui
    console.log('Sistema inicializado com sucesso');
}

// ===== FUNÇÕES DE RELATÓRIO PDF =====
const RelatorioPDF = {
    gerarRelatorioPDF: (contagem, filenamePrefix) => {
        const insumos = StorageManager.getInsumos();
        
        if (!contagem || !contagem.detalhesContagem || Object.keys(contagem.detalhesContagem).length === 0) {
            Utils.mostrarNotificacao('Não há dados de contagem para gerar o relatório.', 'warning');
            return;
        }

        const dataAtual = new Date().toLocaleDateString('pt-BR');
        const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        let tabelaRows = '';
        Object.keys(contagem.detalhesContagem).forEach(insumoId => {
            const insumoInfo = insumos.find(i => i.id === insumoId) || { nome: 'Desconhecido', unidade: 'N/A' };
            const dados = contagem.detalhesContagem[insumoId];
            
            const estoqueStyle = Utils.isEstoqueBaixo(dados.estoque) ? 'color: red; font-weight: bold;' : '';
            const desceuStyle = Utils.isEstoqueBaixo(dados.desceu) ? 'color: red; font-weight: bold;' : '';
            const linhaMontagemStyle = Utils.isEstoqueBaixo(dados.linhaMontagem) ? 'color: red; font-weight: bold;' : '';
            const sobrouStyle = Utils.isEstoqueBaixo(dados.sobrou) ? 'color: red; font-weight: bold;' : '';
            const posicaoFinalStyle = Utils.isEstoqueBaixo(dados.posicaoFinal) ? 'color: red; font-weight: bold;' : '';

            tabelaRows += `
                <tr>
                    <td style="padding: 10px; border: 1px solid #000;">${insumoInfo.nome}</td>
                    <td style="padding: 10px; border: 1px solid #000; text-align: center; ${estoqueStyle}">${dados.estoque}</td>
                    <td style="padding: 10px; border: 1px solid #000; text-align: center; ${desceuStyle}">${dados.desceu}</td>
                    <td style="padding: 10px; border: 1px solid #000; text-align: center; ${linhaMontagemStyle}">${dados.linhaMontagem}</td>
                    <td style="padding: 10px; border: 1px solid #000; text-align: center; ${sobrouStyle}">${dados.sobrou}</td>
                    <td style="padding: 10px; border: 1px solid #000; text-align: center; font-weight: bold; ${posicaoFinalStyle}">${dados.posicaoFinal}</td>
                </tr>
            `;
        });
        
        const conteudoRelatorio = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #000;">
                <div style="text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #000;">
                    <h1 style="margin: 0; color: #000; font-size: 24px;">La Giovana's Pizzaria</h1>
                    <p style="margin: 5px 0; font-size: 18px; color: #000;">Relatório de Contagem de Insumos</p>
                </div>
                
                <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #000; border-radius: 8px;">
                    <p style="margin: 5px 0; font-size: 16px;"><strong>Responsável:</strong> ${contagem.responsavel}</p>
                    <p style="margin: 5px 0; font-size: 16px;"><strong>Data da contagem:</strong> ${contagem.data}</p>
                    <p style="margin: 5px 0; font-size: 14px; color: #333;">Nº do Registro: ${contagem.id}</p>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px;">
                    <thead>
                        <tr style="background-color: #333; color: white;">
                            <th style="padding: 12px; border: 1px solid #000; text-align: left;">INSUMO</th>
                            <th style="padding: 12px; border: 1px solid #000; text-align: center;">ESTOQUE</th>
                            <th style="padding: 12px; border: 1px solid #000; text-align: center;">DESCEU</th>
                            <th style="padding: 12px; border: 1px solid #000; text-align: center;">LINHA</th>
                            <th style="padding: 12px; border: 1px solid #000; text-align: center;">SOBROU</th>
                            <th style="padding: 12px; border: 1px solid #000; text-align: center;">POSIÇÃO FINAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tabelaRows}
                    </tbody>
                </table>
                
                <div style="text-align: center; margin-top: 25px; font-size: 12px; color: #6c757d;">
                    Documento gerado em ${dataAtual} às ${horaAtual}.
                </div>
            </div>
        `;

        const options = {
            margin: 0.5,
            filename: `${filenamePrefix}_${contagem.data}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: true },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        html2pdf().set(options).from(conteudoRelatorio).save();
    },

    gerarRelatorioEstoqueAtual: () => {
        const ultimaContagem = StorageManager.getUltimaContagem();
        const insumos = StorageManager.getInsumos();
        const dataAtual = new Date().toLocaleDateString('pt-BR');

        if (!ultimaContagem || Object.keys(ultimaContagem.detalhesContagem).length === 0) {
            Utils.mostrarNotificacao('Não há contagem salva para gerar o relatório de estoque.', 'warning');
            return;
        }

        let tabelaRows = '';
        Object.keys(ultimaContagem.detalhesContagem).forEach(insumoId => {
            const insumoInfo = insumos.find(i => i.id === insumoId) || { nome: 'Desconhecido', unidade: 'N/A' };
            const sobrou = ultimaContagem.detalhesContagem[insumoId]?.sobrou || 0;
            const posicaoFinal = ultimaContagem.detalhesContagem[insumoId]?.posicaoFinal || 0;

            const sobrouStyle = Utils.isEstoqueBaixo(sobrou) ? 'color: red; font-weight: bold;' : '';
            
            tabelaRows += `
                <tr>
                    <td style="padding: 8px; border: 1px solid #000; font-size: 12px;">${insumoInfo.nome}</td>
                    <td style="padding: 8px; border: 1px solid #000; font-size: 12px;">${insumoInfo.unidade}</td>
                    <td style="padding: 8px; border: 1px solid #000; font-size: 12px; ${sobrouStyle}">${sobrou}</td>
                </tr>
            `;
        });
        
        const conteudoRelatorio = `
            <div style="font-family: Arial, sans-serif; padding: 2rem;">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <h1 style="margin: 0; font-size: 24px;">La Giovana's Pizzaria</h1>
                    <p style="margin: 5px 0;">Relatório de Posição Atual do Estoque</p>
                    <hr style="border: 1px solid #000; margin-top: 1rem;">
                </div>
                <div style="margin-bottom: 1.5rem; font-size: 14px;">
                    <p style="margin: 0;"><strong>Data da Análise:</strong> ${dataAtual}</p>
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-top: 1rem; border: 1px solid #000;">
                    <thead style="background-color: #333; color: white;">
                        <tr>
                            <th style="padding: 8px; border: 1px solid #000; text-align: left; font-size: 12px;">INSUMO</th>
                            <th style="padding: 8px; border: 1px solid #000; text-align: left; font-size: 12px;">UNIDADE</th>
                            <th style="padding: 8px; border: 1px solid #000; text-align: left; font-size: 12px;">ESTOQUE ATUAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tabelaRows}
                    </tbody>
                </table>
            </div>
        `;

        const options = {
            margin: 1,
            filename: `Relatorio_Estoque_Atual_${dataAtual}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        html2pdf().set(options).from(conteudoRelatorio).save();
    }
};

// ===== LÓGICA DE PÁGINAS =====
document.addEventListener('DOMContentLoaded', () => {
    inicializarSistema();

    // --- LÓGICA PARA A TELA DE ESTOQUE (estoque.html) ---
    const tabelaEstoqueBody = document.getElementById('tabelaEstoque');
    const btnGerarPdfEstoque = document.getElementById('btnGerarPdfEstoque');
    const semEstoqueText = document.getElementById('semEstoque');
    const btnAtualizarEstoque = document.getElementById('btnAtualizarEstoque');
    const btnExportarCSV = document.getElementById('btnExportarCSV');
    const buscaEstoque = document.getElementById('buscaEstoque');
    const btnOrdenarEstoque = document.getElementById('btnOrdenarEstoque');

    if (tabelaEstoqueBody) {
        let estoqueOrdenado = false;

        const renderizarEstoque = () => {
            const ultimaContagem = StorageManager.getUltimaContagem();
            const insumos = StorageManager.getInsumos();
            tabelaEstoqueBody.innerHTML = '';

            if (!ultimaContagem || Object.keys(ultimaContagem.detalhesContagem).length === 0) {
                semEstoqueText.style.display = 'block';
                document.getElementById('loadingEstoque')?.style.display = 'none';
                return;
            }
            
            semEstoqueText.style.display = 'none';
            document.getElementById('loadingEstoque')?.style.display = 'none';

            let insumosArray = Object.keys(ultimaContagem.detalhesContagem).map(insumoId => {
                const insumoInfo = insumos.find(i => i.id === insumoId) || { nome: 'Desconhecido', unidade: 'N/A' };
                const sobrou = ultimaContagem.detalhesContagem[insumoId]?.sobrou || 0;
                return { id: insumoId, nome: insumoInfo.nome, unidade: insumoInfo.unidade, quantidade: sobrou };
            });

            // Aplicar busca
            const termoBusca = buscaEstoque?.value.toLowerCase() || '';
            if (termoBusca) {
                insumosArray = insumosArray.filter(insumo => 
                    insumo.nome.toLowerCase().includes(termoBusca)
                );
            }

            // Aplicar ordenação
            if (estoqueOrdenado) {
                insumosArray.sort((a, b) => a.nome.localeCompare(b.nome));
            }

            // Atualizar contadores
            let normalCount = 0, baixoCount = 0, criticoCount = 0;
            
            insumosArray.forEach(insumo => {
                const sobrou = ultimaContagem.detalhesContagem[insumo.id]?.sobrou || 0;
                let status = 'normal';
                let statusClass = 'success';
                let statusIcon = 'bi-check-circle';
                
                if (sobrou <= CONFIG.estoqueCritico) {
                    status = 'crítico';
                    statusClass = 'danger';
                    statusIcon = 'bi-x-circle';
                    criticoCount++;
                } else if (sobrou <= CONFIG.estoqueBaixo) {
                    status = 'baixo';
                    statusClass = 'warning';
                    statusIcon = 'bi-exclamation-triangle';
                    baixoCount++;
                } else {
                    normalCount++;
                }

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${insumo.nome}</td>
                    <td><span class="badge bg-primary">${insumo.unidade}</span></td>
                    <td class="text-center">
                        <span class="badge bg-${statusClass}">
                            <i class="bi ${statusIcon} me-1"></i>${status}
                        </span>
                    </td>
                    <td class="text-end fw-bold ${sobrou <= CONFIG.estoqueBaixo ? 'text-danger' : ''}">
                        ${sobrou}
                    </td>
                `;
                tabelaEstoqueBody.appendChild(tr);
            });

            // Atualizar contadores
            if (document.getElementById('totalInsumos')) {
                document.getElementById('totalInsumos').textContent = insumosArray.length;
                document.getElementById('normalCount').textContent = `${normalCount} normais`;
                document.getElementById('baixoCount').textContent = `${baixoCount} baixos`;
                document.getElementById('criticoCount').textContent = `${criticoCount} críticos`;
            }
        };

        // Event Listeners
        if (btnGerarPdfEstoque) {
            btnGerarPdfEstoque.addEventListener('click', () => {
                btnGerarPdfEstoque.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Gerando...';
                setTimeout(() => {
                    RelatorioPDF.gerarRelatorioEstoqueAtual();
                    btnGerarPdfEstoque.innerHTML = '<i class="bi bi-file-earmark-pdf me-2"></i>Gerar PDF';
                }, 500);
            });
        }

        if (btnAtualizarEstoque) {
            btnAtualizarEstoque.addEventListener('click', () => {
                btnAtualizarEstoque.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Atualizando...';
                setTimeout(() => {
                    renderizarEstoque();
                    btnAtualizarEstoque.innerHTML = '<i class="bi bi-arrow-clockwise me-2"></i>Atualizar';
                    Utils.mostrarNotificacao('Estoque atualizado com sucesso!', 'success');
                }, 500);
            });
        }

        if (btnExportarCSV) {
            btnExportarCSV.addEventListener('click', () => {
                const ultimaContagem = StorageManager.getUltimaContagem();
                const insumos = StorageManager.getInsumos();
                
                if (!ultimaContagem) {
                    Utils.mostrarNotificacao('Nenhum dado de estoque para exportar.', 'warning');
                    return;
                }

                let csv = 'Insumo,Unidade,Quantidade,Status\n';
                Object.keys(ultimaContagem.detalhesContagem).forEach(insumoId => {
                    const insumoInfo = insumos.find(i => i.id === insumoId) || { nome: 'Desconhecido', unidade: 'N/A' };
                    const quantidade = ultimaContagem.detalhesContagem[insumoId]?.sobrou || 0;
                    
                    let status = 'Normal';
                    if (quantidade <= CONFIG.estoqueCritico) status = 'Crítico';
                    else if (quantidade <= CONFIG.estoqueBaixo) status = 'Baixo';
                    
                    csv += `"${insumoInfo.nome}","${insumoInfo.unidade}",${quantidade},${status}\n`;
                });

                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `estoque_${Utils.getDataAtual()}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                Utils.mostrarNotificacao('CSV exportado com sucesso!', 'success');
            });
        }

        if (buscaEstoque) {
            buscaEstoque.addEventListener('input', Utils.debounce(() => {
                renderizarEstoque();
            }, 300));
        }

        if (btnOrdenarEstoque) {
            btnOrdenarEstoque.addEventListener('click', () => {
                estoqueOrdenado = !estoqueOrdenado;
                btnOrdenarEstoque.innerHTML = estoqueOrdenado ? 
                    '<i class="bi bi-sort-alpha-down-alt"></i>' : 
                    '<i class="bi bi-sort-alpha-down"></i>';
                renderizarEstoque();
            });
        }

        // Renderizar inicialmente
        setTimeout(renderizarEstoque, 100);
    }

    // --- LÓGICA PARA A TELA DE HISTÓRICO (historico.html) ---
    const tabelaHistoricoBody = document.getElementById('tabelaHistorico');
    const semHistoricoText = document.getElementById('semHistorico');
    
    if (tabelaHistoricoBody) {
        const renderizarHistorico = () => {
            const historico = StorageManager.getHistoricoContagens().reverse();
            tabelaHistoricoBody.innerHTML = '';
            document.getElementById('loadingHistorico')?.style.display = 'none';
            
            if (historico.length === 0) {
                semHistoricoText.style.display = 'block';
                return;
            }
            
            semHistoricoText.style.display = 'none';
            
            historico.forEach(contagem => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${Utils.formatarData(contagem.data)}</td>
                    <td>${contagem.responsavel}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-info btn-detalhes me-2" data-id="${contagem.id}" title="Ver detalhes">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger btn-excluir-historico me-2" data-id="${contagem.id}" title="Excluir contagem">
                            <i class="bi bi-trash"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success btn-baixar-pdf" data-id="${contagem.id}" title="Baixar PDF">
                            <i class="bi bi-file-earmark-arrow-down"></i>
                        </button>
                    </td>
                `;
                tabelaHistoricoBody.appendChild(tr);
            });

            // Event listeners para os botões
            document.querySelectorAll('.btn-detalhes').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const contagemId = e.currentTarget.dataset.id;
                    const contagem = StorageManager.getHistoricoContagens().find(c => c.id === contagemId);
                    if (contagem) {
                        mostrarDetalhesContagem(contagem);
                    }
                });
            });

            document.querySelectorAll('.btn-baixar-pdf').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const contagemId = e.currentTarget.dataset.id;
                    const contagem = StorageManager.getHistoricoContagens().find(c => c.id === contagemId);
                    if (contagem) {
                        RelatorioPDF.gerarRelatorioPDF(contagem, `Relatorio_Contagem`);
                    }
                });
            });

            document.querySelectorAll('.btn-excluir-historico').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const contagemId = e.currentTarget.dataset.id;
                    document.getElementById('btnConfirmarExclusao').dataset.id = contagemId;
                    new bootstrap.Modal(document.getElementById('modalConfirmacaoExclusao')).show();
                });
            });
        };

        const mostrarDetalhesContagem = (contagem) => {
            const modalBody = document.getElementById('modalContagemBody');
            const insumos = StorageManager.getInsumos();
            
            let html = `
                <div class="mb-3">
                    <strong>Data:</strong> ${Utils.formatarData(contagem.data)}<br>
                    <strong>Responsável:</strong> ${contagem.responsavel}<br>
                    <strong>ID:</strong> <small class="text-muted">${contagem.id}</small>
                </div>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Insumo</th>
                                <th class="text-center">Estoque</th>
                                <th class="text-center">Desceu</th>
                                <th class="text-center">Linha</th>
                                <th class="text-center">Sobrou</th>
                                <th class="text-center">Posição Final</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            Object.keys(contagem.detalhesContagem).forEach(insumoId => {
                const insumoInfo = insumos.find(i => i.id === insumoId) || { nome: 'Desconhecido', unidade: 'N/A' };
                const dados = contagem.detalhesContagem[insumoId];
                
                html += `
                    <tr>
                        <td>${insumoInfo.nome}</td>
                        <td class="text-center">${dados.estoque}</td>
                        <td class="text-center">${dados.desceu}</td>
                        <td class="text-center">${dados.linhaMontagem}</td>
                        <td class="text-center ${Utils.isEstoqueBaixo(dados.sobrou) ? 'text-danger fw-bold' : ''}">${dados.sobrou}</td>
                        <td class="text-center ${Utils.isEstoqueBaixo(dados.posicaoFinal) ? 'text-danger fw-bold' : ''}">${dados.posicaoFinal}</td>
                    </tr>
                `;
            });

            html += `</tbody></table></div>`;
            modalBody.innerHTML = html;
            
            new bootstrap.Modal(document.getElementById('modalContagem')).show();
        };

        // Configurar modal de confirmação
        document.getElementById('btnConfirmarExclusao')?.addEventListener('click', function() {
            const contagemId = this.dataset.id;
            if (StorageManager.deleteContagem(contagemId)) {
                renderizarHistorico();
                Utils.mostrarNotificacao('Contagem excluída com sucesso!', 'success');
                bootstrap.Modal.getInstance(document.getElementById('modalConfirmacaoExclusao')).hide();
            }
        });

        renderizarHistorico();
    }

    // --- LÓGICA PARA A TELA DE GERENCIAMENTO (gerenciar.html) ---
    const formInsumo = document.getElementById('formInsumo');
    const insumoIdInput = document.getElementById('insumoId');
    const insumoNomeInput = document.getElementById('insumoNome');
    const insumoUnidadeSelect = document.getElementById('insumoUnidade');
    const tabelaInsumosBody = document.getElementById('tabelaInsumos');
    const semInsumosText = document.getElementById('semInsumos');
    const btnCancelarEdicao = document.getElementById('btnCancelarEdicao');
    const buscaInsumos = document.getElementById('buscaInsumos');
    const btnOrdenarInsumos = document.getElementById('btnOrdenarInsumos');

    if (formInsumo) {
        let insumosOrdenados = false;

        const renderizarTabelaInsumos = () => {
            let insumos = StorageManager.getInsumos();
            tabelaInsumosBody.innerHTML = '';
            document.getElementById('loadingInsumos')?.style.display = 'none';
            
            // Aplicar busca
            const termoBusca = buscaInsumos?.value.toLowerCase() || '';
            if (termoBusca) {
                insumos = insumos.filter(insumo => 
                    insumo.nome.toLowerCase().includes(termoBusca) ||
                    insumo.unidade.toLowerCase().includes(termoBusca)
                );
            }

            // Aplicar ordenação
            if (insumosOrdenados) {
                insumos.sort((a, b) => a.nome.localeCompare(b.nome));
            }

            if (insumos.length === 0) {
                semInsumosText.style.display = 'block';
                document.getElementById('contadorInsumos').textContent = 'Nenhum insumo encontrado';
                return;
            }
            
            semInsumosText.style.display = 'none';
            document.getElementById('contadorInsumos').textContent = `Total: ${insumos.length} insumos`;

            insumos.forEach(insumo => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${insumo.nome}</td>
                    <td><span class="badge bg-primary">${insumo.unidade}</span></td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-info me-2 btn-editar" data-id="${insumo.id}" title="Editar insumo">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger btn-excluir" data-id="${insumo.id}" title="Excluir insumo">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                `;
                tabelaInsumosBody.appendChild(tr);
            });

            document.querySelectorAll('.btn-editar').forEach(btn => btn.addEventListener('click', (e) => editarInsumo(e.currentTarget.dataset.id)));
            document.querySelectorAll('.btn-excluir').forEach(btn => btn.addEventListener('click', (e) => prepararExclusaoInsumo(e.currentTarget.dataset.id)));
        };

        const salvarInsumo = (event) => {
            event.preventDefault();
            
            const nome = insumoNomeInput.value.trim();
            const unidade = insumoUnidadeSelect.value;
            const id = insumoIdInput.value;

            if (!nome || !unidade) {
                Utils.mostrarNotificacao('Por favor, preencha todos os campos.', 'warning');
                return;
            }

            const btnSalvar = document.getElementById('btnSalvarInsumo');
            btnSalvar.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvando...';
            
            setTimeout(() => {
                let insumos = StorageManager.getInsumos();
                
                if (id) {
                    const insumoIndex = insumos.findIndex(insumo => insumo.id === id);
                    if (insumoIndex !== -1) {
                        insumos[insumoIndex].nome = nome;
                        insumos[insumoIndex].unidade = unidade;
                        Utils.mostrarNotificacao('Insumo atualizado com sucesso!', 'success');
                    }
                } else {
                    const novoInsumo = {
                        id: `insumo-${Date.now()}`,
                        nome,
                        unidade
                    };
                    insumos.push(novoInsumo);
                    Utils.mostrarNotificacao('Insumo adicionado com sucesso!', 'success');
                }
                
                if (StorageManager.saveInsumos(insumos)) {
                    formInsumo.reset();
                    insumoIdInput.value = '';
                    btnCancelarEdicao.style.display = 'none';
                    document.getElementById('alertModoEdicao').style.display = 'none';
                    renderizarTabelaInsumos();
                }
                
                btnSalvar.innerHTML = '<i class="bi bi-plus-circle me-2"></i>Salvar Insumo';
            }, 500);
        };

        const editarInsumo = (id) => {
            const insumo = StorageManager.getInsumos().find(insumo => insumo.id === id);
            if (insumo) {
                insumoIdInput.value = insumo.id;
                insumoNomeInput.value = insumo.nome;
                insumoUnidadeSelect.value = insumo.unidade;
                btnCancelarEdicao.style.display = 'block';
                document.getElementById('alertModoEdicao').style.display = 'flex';
                insumoNomeInput.focus();
            }
        };

        const prepararExclusaoInsumo = (id) => {
            const insumo = StorageManager.getInsumos().find(i => i.id === id);
            if (insumo) {
                document.getElementById('nomeInsumoExclusao').textContent = insumo.nome;
                document.getElementById('btnConfirmarExclusao').dataset.id = id;
                new bootstrap.Modal(document.getElementById('modalConfirmacaoExclusao')).show();
            }
        };

        const excluirInsumo = (id) => {
            let insumos = StorageManager.getInsumos().filter(insumo => insumo.id !== id);
            if (StorageManager.saveInsumos(insumos)) {
                renderizarTabelaInsumos();
                Utils.mostrarNotificacao('Insumo excluído com sucesso!', 'success');
            }
        };

        const cancelarEdicao = () => {
            formInsumo.reset();
            insumoIdInput.value = '';
            btnCancelarEdicao.style.display = 'none';
            document.getElementById('alertModoEdicao').style.display = 'none';
        };

        // Configurar event listeners
        formInsumo.addEventListener('submit', salvarInsumo);
        btnCancelarEdicao.addEventListener('click', cancelarEdicao);
        
        if (buscaInsumos) {
            buscaInsumos.addEventListener('input', Utils.debounce(() => {
                renderizarTabelaInsumos();
            }, 300));
        }

        if (btnOrdenarInsumos) {
            btnOrdenarInsumos.addEventListener('click', () => {
                insumosOrdenados = !insumosOrdenados;
                renderizarTabelaInsumos();
            });
        }

        // Configurar modal de confirmação
        document.getElementById('btnConfirmarExclusao')?.addEventListener('click', function() {
            const insumoId = this.dataset.id;
            excluirInsumo(insumoId);
            bootstrap.Modal.getInstance(document.getElementById('modalConfirmacaoExclusao')).hide();
        });

        renderizarTabelaInsumos();
    }

    // --- LÓGICA PARA A TELA DE ENTRADA (entrada.html) ---
    const formEntrada = document.getElementById('formEntrada');
    const selectInsumo = document.getElementById('selectInsumo');
    const quantidadeEntradaInput = document.getElementById('quantidadeEntrada');
    const tabelaHistoricoEntradasBody = document.getElementById('tabelaHistoricoEntradas');
    const semEntradasText = document.getElementById('semEntradasText');

    if (formEntrada) {
        const renderizarSelectInsumos = () => {
            const insumos = StorageManager.getInsumos();
            selectInsumo.innerHTML = '<option value="">-- Selecione um insumo --</option>';
            
            insumos.forEach(insumo => {
                const option = document.createElement('option');
                option.value = insumo.id;
                option.textContent = `${insumo.nome} (${insumo.unidade})`;
                selectInsumo.appendChild(option);
            });
        };

        const renderizarHistoricoEntradas = () => {
            const historico = StorageManager.getHistoricoEntradas().reverse();
            const insumos = StorageManager.getInsumos();
            tabelaHistoricoEntradasBody.innerHTML = '';
            document.getElementById('loadingEntradas')?.style.display = 'none';
            
            if (historico.length === 0) {
                semEntradasText.style.display = 'block';
                return;
            }
            
            semEntradasText.style.display = 'none';

            historico.forEach(entrada => {
                const insumoInfo = insumos.find(i => i.id === entrada.insumoId) || { nome: 'Insumo Desconhecido', unidade: '' };
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${insumoInfo.nome}</td>
                    <td>${entrada.quantidade}</td>
                    <td>${Utils.formatarData(entrada.data)}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-info me-2 btn-editar-entrada" data-id="${entrada.id}" title="Editar entrada">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger btn-excluir-entrada" data-id="${entrada.id}" title="Excluir entrada">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                `;
                tabelaHistoricoEntradasBody.appendChild(tr);
            });

            // Event listeners para edição
            document.querySelectorAll('.btn-editar-entrada').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const entradaId = e.currentTarget.dataset.id;
                    const historico = StorageManager.getHistoricoEntradas();
                    const entrada = historico.find(e => e.id === entradaId);
                    const insumos = StorageManager.getInsumos();
                    
                    if (entrada) {
                        const insumoNome = insumos.find(i => i.id === entrada.insumoId)?.nome || 'Insumo Desconhecido';
                        document.getElementById('editarEntradaId').value = entradaId;
                        document.getElementById('editarEntradaQuantidade').value = entrada.quantidade;
                        document.getElementById('modalEditarEntradaLabel').textContent = `Editar Entrada - ${insumoNome}`;
                        new bootstrap.Modal(document.getElementById('modalEditarEntrada')).show();
                    }
                });
            });

            // Event listeners para exclusão
            document.querySelectorAll('.btn-excluir-entrada').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const entradaId = e.currentTarget.dataset.id;
                    document.getElementById('btnConfirmarExclusaoEntrada').dataset.id = entradaId;
                    new bootstrap.Modal(document.getElementById('modalConfirmacaoExclusaoEntrada')).show();
                });
            });
        };

        const registrarEntrada = (event) => {
            event.preventDefault();
            
            const insumoId = selectInsumo.value;
            const quantidade = parseFloat(quantidadeEntradaInput.value);

            if (!insumoId || isNaN(quantidade) || quantidade <= 0) {
                Utils.mostrarNotificacao('Por favor, selecione um insumo e digite uma quantidade válida.', 'warning');
                return;
            }

            const btnRegistrar = document.getElementById('btnRegistrarEntrada');
            btnRegistrar.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Registrando...';

            setTimeout(() => {
                const novaEntrada = {
                    id: `entrada-${Date.now()}`,
                    insumoId: insumoId,
                    quantidade: quantidade,
                    data: Utils.getDataAtual()
                };
                
                if (StorageManager.saveHistoricoEntradas(novaEntrada)) {
                    // Atualizar última contagem
                    let ultimaContagem = StorageManager.getUltimaContagem();
                    if (ultimaContagem && ultimaContagem.detalhesContagem) {
                        const detalhes = ultimaContagem.detalhesContagem[insumoId];
                        if (detalhes) {
                            detalhes.posicaoFinal = parseFloat(detalhes.posicaoFinal || 0) + quantidade;
                            detalhes.sobrou = parseFloat(detalhes.sobrou || 0) + quantidade;
                            StorageManager.setUltimaContagem(ultimaContagem);
                        }
                    }
                    
                    Utils.mostrarNotificacao('Entrada de insumo registrada com sucesso!', 'success');
                    formEntrada.reset();
                    renderizarHistoricoEntradas();
                }
                
                btnRegistrar.innerHTML = '<i class="bi bi-truck me-2"></i>Registrar Entrada';
            }, 500);
        };

        // Configurar modal de edição
        document.getElementById('btnSalvarEdicaoEntrada')?.addEventListener('click', () => {
            const entradaId = document.getElementById('editarEntradaId').value;
            const novaQuantidade = parseFloat(document.getElementById('editarEntradaQuantidade').value);

            if (isNaN(novaQuantidade) || novaQuantidade <= 0) {
                Utils.mostrarNotificacao('Por favor, digite uma quantidade válida.', 'warning');
                return;
            }

            if (StorageManager.updateHistoricoEntrada(entradaId, novaQuantidade)) {
                renderizarHistoricoEntradas();
                Utils.mostrarNotificacao('Entrada atualizada com sucesso!', 'success');
                bootstrap.Modal.getInstance(document.getElementById('modalEditarEntrada')).hide();
            }
        });

        // Configurar modal de confirmação de exclusão
        document.getElementById('btnConfirmarExclusaoEntrada')?.addEventListener('click', function() {
            const entradaId = this.dataset.id;
            if (StorageManager.deleteHistoricoEntrada(entradaId)) {
                renderizarHistoricoEntradas();
                Utils.mostrarNotificacao('Entrada excluída com sucesso!', 'success');
                bootstrap.Modal.getInstance(document.getElementById('modalConfirmacaoExclusaoEntrada')).hide();
            }
        });

        formEntrada.addEventListener('submit', registrarEntrada);
        renderizarSelectInsumos();
        renderizarHistoricoEntradas();
    }

    // --- LÓGICA PARA A TELA DE CONTAGEM (index.html) ---
    const formContagem = document.getElementById('formContagem');
    const listaInsumosDiv = document.getElementById('listaInsumos');

    if (formContagem) {
        const renderizarInsumosContagem = () => {
            const insumos = StorageManager.getInsumos();
            const ultimaContagem = StorageManager.getUltimaContagem();
            listaInsumosDiv.innerHTML = '';

            if (insumos.length === 0) {
                listaInsumosDiv.innerHTML = '<p class="text-center text-muted">Nenhum insumo cadastrado. Vá para "Gerenciar Insumos" para adicionar.</p>';
                return;
            }

            insumos.forEach(insumo => {
                const insumoDiv = document.createElement('div');
                insumoDiv.classList.add('insumo-item', 'border', 'p-3', 'rounded', 'mb-3');
                insumoDiv.dataset.id = insumo.id;

                const ultimoSobrou = ultimaContagem?.detalhesContagem?.[insumo.id]?.sobrou || 0;
                const estoqueInicial = ultimoSobrou;
                
                const ultimaPosicaoClass = Utils.isEstoqueBaixo(ultimoSobrou) ? 'text-danger fw-bold' : '';

                insumoDiv.innerHTML = `
                    <h5 class="insumo-nome">${insumo.nome} <span class="badge bg-primary ms-2">${insumo.unidade}</span></h5>
                    <p class="text-muted small mb-2">Último Sobrou: <span class="${ultimaPosicaoClass}">${ultimoSobrou}</span></p>
                    <div class="row g-2 align-items-end">
                        <div class="col-6 col-md-3">
                            <label class="form-label">Estoque</label>
                            <input type="number" step="0.01" min="0" class="form-control form-control-sm" data-campo="estoque" placeholder="Qtd. Estoque" value="${estoqueInicial}">
                        </div>
                        <div class="col-6 col-md-3">
                            <label class="form-label">Desceu</label>
                            <input type="number" step="0.01" min="0" class="form-control form-control-sm" data-campo="desceu" placeholder="Qtd. Desceu" value="0">
                        </div>
                        <div class="col-6 col-md-3">
                            <label class="form-label">Linha Montagem</label>
                            <input type="number" step="0.01" min="0" class="form-control form-control-sm" data-campo="linhaMontagem" placeholder="Qtd. Linha" value="0">
                        </div>
                        <div class="col-6 col-md-3 d-flex flex-column justify-content-end">
                            <label class="form-label">Sobrou</label>
                            <p class="mb-0 fw-bold fs-4 text-success" data-campo="sobrou">0</p>
                        </div>
                    </div>
                    <div class="row g-2 mt-2">
                        <div class="col-6 col-md-6">
                            <label class="form-label">Posição Final</label>
                            <p class="mb-0 fw-bold fs-4 text-primary" data-campo="posicaoFinal">0</p>
                        </div>
                    </div>
                `;
                listaInsumosDiv.appendChild(insumoDiv);
                calcularValoresInsumo(insumoDiv);
                
                const inputs = insumoDiv.querySelectorAll('input[type="number"]');
                inputs.forEach(input => {
                    input.addEventListener('input', () => calcularValoresInsumo(insumoDiv));
                    input.addEventListener('blur', (e) => {
                        if (e.target.value < 0) e.target.value = 0;
                        calcularValoresInsumo(insumoDiv);
                    });
                });
            });
        };

        const calcularValoresInsumo = (insumoDiv) => {
            const estoque = parseFloat(insumoDiv.querySelector('[data-campo="estoque"]').value) || 0;
            const desceu = parseFloat(insumoDiv.querySelector('[data-campo="desceu"]').value) || 0;
            const linhaMontagem = parseFloat(insumoDiv.querySelector('[data-campo="linhaMontagem"]').value) || 0;
            
            // Cálculo CORRETO: Sobrou = Estoque - Desceu
            const sobrou = estoque - desceu;
            // Posição Final = Sobrou + Linha Montagem
            const posicaoFinal = sobrou + linhaMontagem;
            
            insumoDiv.querySelector('[data-campo="sobrou"]').textContent = sobrou.toFixed(2);
            insumoDiv.querySelector('[data-campo="posicaoFinal"]').textContent = posicaoFinal.toFixed(2);
            
            // Atualizar cores baseadas no status
            insumoDiv.querySelector('[data-campo="sobrou"]').className = 
                `mb-0 fw-bold fs-4 ${Utils.isEstoqueBaixo(sobrou) ? 'text-danger' : 'text-success'}`;
            
            insumoDiv.querySelector('[data-campo="posicaoFinal"]').className = 
                `mb-0 fw-bold fs-4 ${Utils.isEstoqueBaixo(posicaoFinal) ? 'text-danger' : 'text-primary'}`;
        };

        formContagem.addEventListener('submit', (event) => {
            event.preventDefault();
            
            const responsavel = document.getElementById('responsavel').value.trim();
            const dataContagem = document.getElementById('dataContagem').value;

            if (!responsavel || !dataContagem) {
                Utils.mostrarNotificacao('Por favor, preencha o nome do responsável e a data da contagem.', 'warning');
                return;
            }

            const detalhesContagem = {};
            const insumosNaTela = document.querySelectorAll('.insumo-item');
            let temDados = false;

            insumosNaTela.forEach(insumoDiv => {
                const id = insumoDiv.dataset.id;
                const estoque = parseFloat(insumoDiv.querySelector('[data-campo="estoque"]').value) || 0;
                const desceu = parseFloat(insumoDiv.querySelector('[data-campo="desceu"]').value) || 0;
                const linhaMontagem = parseFloat(insumoDiv.querySelector('[data-campo="linhaMontagem"]').value) || 0;
                const sobrou = estoque - desceu;
                const posicaoFinal = sobrou + linhaMontagem;

                detalhesContagem[id] = { 
                    estoque, 
                    desceu, 
                    linhaMontagem, 
                    sobrou, 
                    posicaoFinal
                };

                if (estoque > 0 || desceu > 0 || linhaMontagem > 0) {
                    temDados = true;
                }
            });

            if (!temDados) {
                Utils.mostrarNotificacao('Nenhum insumo foi contado. Por favor, adicione insumos antes de salvar.', 'warning');
                return;
            }

            const novaContagem = {
                id: `contagem-${Date.now()}`,
                data: dataContagem,
                responsavel: responsavel,
                detalhesContagem
            };

            if (StorageManager.setUltimaContagem(novaContagem) && StorageManager.saveHistoricoContagens(novaContagem)) {
                RelatorioPDF.gerarRelatorioPDF(novaContagem, 'Relatorio_Contagem');
                formContagem.reset();
                renderizarInsumosContagem();
                Utils.mostrarNotificacao('Contagem salva e relatório gerado com sucesso!', 'success');
            }
        });

        // Preencher data atual por padrão
        document.getElementById('dataContagem')?.setAttribute('value', Utils.getDataAtual());
        renderizarInsumosContagem();
    }
});

// ===== FUNÇÕES GLOBAIS =====
function fazerBackup() {
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
        
        Utils.mostrarNotificacao('Backup realizado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao fazer backup:', error);
        Utils.mostrarNotificacao('Erro ao realizar backup.', 'error');
    }
}

// Exportar funções globais para uso no console, se necessário
window.fazerBackup = fazerBackup;
window.Utils = Utils;
window.StorageManager = StorageManager;
