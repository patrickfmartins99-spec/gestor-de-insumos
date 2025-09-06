// ===== LÓGICA PARA A PÁGINA DE ENTRADA DE INSUMOS =====
// Arquivo: entrada.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('📦 Inicializando página de entrada de insumos...');
    
    const formEntrada = document.getElementById('formEntrada');
    const selectInsumo = document.getElementById('selectInsumo');
    const quantidadeEntradaInput = document.getElementById('quantidadeEntrada');
    const tabelaHistoricoEntradasBody = document.getElementById('tabelaHistoricoEntradas');
    const semEntradasText = document.getElementById('semEntradasText');
    const loadingEntradas = document.getElementById('loadingEntradas');
    const alertAtualizacaoEstoque = document.getElementById('alertAtualizacaoEstoque');

    const modalEditarEntrada = new bootstrap.Modal(document.getElementById('modalEditarEntrada'));
    const modalConfirmacaoExclusaoEntrada = new bootstrap.Modal(document.getElementById('modalConfirmacaoExclusaoEntrada'));
    
    let historicoEntradas = [];

    // Função para formatar números
    const formatarNumero = (numero) => {
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(numero);
    };

    // Função para carregar as opções do select de insumos
    const carregarSelectInsumos = () => {
        console.log('🔄 Carregando select de insumos...');
        
        const insumos = StorageManager.getInsumos();
        selectInsumo.innerHTML = '<option value="">-- Selecione um insumo --</option>';
        
        if (insumos && insumos.length > 0) {
            // Ordenar insumos alfabeticamente
            insumos.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
            
            insumos.forEach(insumo => {
                const option = document.createElement('option');
                option.value = insumo.id;
                option.textContent = `${insumo.nome} (${insumo.unidade})`;
                option.dataset.unidade = insumo.unidade;
                selectInsumo.appendChild(option);
            });
            
            console.log('✅ Select de insumos carregado:', insumos.length, 'opções');
        } else {
            console.log('⚠️ Nenhum insumo cadastrado');
            selectInsumo.innerHTML = '<option value="">Nenhum insumo cadastrado</option>';
            selectInsumo.disabled = true;
        }
    };

    // Função para validar quantidade
    const validarQuantidade = (quantidade) => {
        const valor = parseFloat(quantidade);
        return !isNaN(valor) && valor > 0 && valor <= 10000; // Limite razoável
    };

    // Função para obter histórico de entradas
    const obterHistoricoEntradas = () => {
        return StorageManager.getHistoricoEntradas()
            .map(entrada => {
                const insumos = StorageManager.getInsumos();
                const insumoInfo = insumos.find(i => i.id === entrada.insumoId) || { 
                    nome: 'Insumo Desconhecido', 
                    unidade: 'N/A' 
                };
                
                return {
                    ...entrada,
                    nomeInsumo: insumoInfo.nome,
                    unidadeInsumo: insumoInfo.unidade
                };
            })
            .sort((a, b) => new Date(b.data) - new Date(a.data)); // Mais recentes primeiro
    };

    // Função para renderizar o histórico de entradas
    const renderizarHistoricoEntradas = () => {
        console.log('🔄 Renderizando histórico de entradas...');
        
        if (loadingEntradas) loadingEntradas.style.display = 'block';
        if (tabelaHistoricoEntradasBody) tabelaHistoricoEntradasBody.innerHTML = '';
        
        historicoEntradas = obterHistoricoEntradas();
        
        if (historicoEntradas.length === 0) {
            if (semEntradasText) semEntradasText.style.display = 'block';
            if (loadingEntradas) loadingEntradas.style.display = 'none';
            console.log('⚠️ Nenhuma entrada encontrada');
            return;
        }
        
        if (semEntradasText) semEntradasText.style.display = 'none';
        
        historicoEntradas.forEach((entrada, index) => {
            const tr = document.createElement('tr');
            
            // Destacar entradas recentes (últimas 24h)
            const dataEntrada = new Date(entrada.data);
            const hoje = new Date();
            const umDiaMs = 24 * 60 * 60 * 1000;
            const isRecente = (hoje - dataEntrada) < umDiaMs;
            
            if (isRecente) {
                tr.classList.add('table-success');
                tr.title = 'Entrada recente (últimas 24h)';
            }
            
            tr.innerHTML = `
                <td class="align-middle">
                    <div class="d-flex align-items-center">
                        <span class="me-2">${entrada.nomeInsumo}</span>
                        ${isRecente ? '<i class="bi bi-star-fill text-warning" title="Nova entrada"></i>' : ''}
                    </div>
                    <small class="text-muted">${entrada.unidadeInsumo}</small>
                </td>
                
                <td class="align-middle">
                    <span class="fw-bold">${formatarNumero(entrada.quantidade)}</span>
                </td>
                
                <td class="align-middle">
                    <span class="text-nowrap">${Utils.formatarData(entrada.data)}</span>
                    ${isRecente ? '<br><small class="text-success">Recente</small>' : ''}
                </td>
                
                <td class="align-middle text-end">
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-info btn-editar-entrada" 
                                data-id="${entrada.id}"
                                data-quantidade="${entrada.quantidade}"
                                title="Editar entrada">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-excluir-entrada" 
                                data-id="${entrada.id}"
                                data-nome="${entrada.nomeInsumo}"
                                title="Excluir entrada">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            if (tabelaHistoricoEntradasBody) tabelaHistoricoEntradasBody.appendChild(tr);
        });
        
        if (loadingEntradas) loadingEntradas.style.display = 'none';
        
        // Adicionar event listeners aos botões
        adicionarEventListenersBotoes();
        
        console.log('✅ Histórico de entradas renderizado:', historicoEntradas.length, 'registros');
    };

    // Função para adicionar event listeners aos botões de ação
    const adicionarEventListenersBotoes = () => {
        document.querySelectorAll('.btn-editar-entrada').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const entradaId = e.currentTarget.dataset.id;
                const quantidade = e.currentTarget.dataset.quantidade;
                const entrada = historicoEntradas.find(e => e.id === entradaId);
                
                if (entrada) {
                    document.getElementById('editarEntradaId').value = entradaId;
                    document.getElementById('editarEntradaQuantidade').value = quantidade;
                    
                    document.getElementById('modalEditarEntradaLabel').textContent = 
                        `Editar Entrada - ${entrada.nomeInsumo}`;
                    
                    modalEditarEntrada.show();
                }
            });
        });

        document.querySelectorAll('.btn-excluir-entrada').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const entradaId = e.currentTarget.dataset.id;
                const nomeInsumo = e.currentTarget.dataset.nome;
                
                document.getElementById('btnConfirmarExclusaoEntrada').dataset.id = entradaId;
                document.getElementById('btnConfirmarExclusaoEntrada').dataset.nome = nomeInsumo;
                
                modalConfirmacaoExclusaoEntrada.show();
            });
        });
    };

    // Função para registrar uma nova entrada
    const registrarEntrada = async (event) => {
        event.preventDefault();
        
        const insumoId = selectInsumo.value;
        const quantidade = parseFloat(quantidadeEntradaInput.value);
        const selectedOption = selectInsumo.options[selectInsumo.selectedIndex];
        const nomeInsumo = selectedOption.textContent;

        // Validações
        if (!insumoId) {
            Notificacoes.mostrarNotificacao('Por favor, selecione um insumo.', 'warning');
            selectInsumo.focus();
            return;
        }

        if (!validarQuantidade(quantidade)) {
            Notificacoes.mostrarNotificacao('Informe uma quantidade válida (maior que 0).', 'warning');
            quantidadeEntradaInput.focus();
            return;
        }

        // Mostrar loading
        const btnRegistrar = document.getElementById('btnRegistrarEntrada');
        const originalHTML = btnRegistrar.innerHTML;
        btnRegistrar.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Registrando...';
        btnRegistrar.disabled = true;

        try {
            // Criar nova entrada
            const novaEntrada = {
                id: Utils.gerarId('entrada-'),
                insumoId: insumoId,
                quantidade: quantidade,
                data: Utils.getDataAtual(),
                timestamp: new Date().toISOString()
            };

            // Salvar no histórico
            const salvou = StorageManager.saveHistoricoEntradas(novaEntrada);
            
            if (!salvou) {
                throw new Error('Erro ao salvar entrada');
            }

            // Atualizar última contagem
            let ultimaContagem = StorageManager.getUltimaContagem();
            if (ultimaContagem && ultimaContagem.detalhesContagem) {
                const detalhes = ultimaContagem.detalhesContagem[insumoId];
                
                if (detalhes) {
                    detalhes.posicaoFinal = (detalhes.posicaoFinal || 0) + quantidade;
                    detalhes.sobrou = (detalhes.sobrou || 0) + quantidade;
                    
                    StorageManager.setUltimaContagem(ultimaContagem);
                }
            }

            // Feedback e reset
            Notificacoes.mostrarNotificacao(
                `Entrada de ${formatarNumero(quantidade)} ${selectedOption.dataset.unidade} de ${nomeInsumo.split(' (')[0]} registrada com sucesso!`, 
                'success'
            );

            formEntrada.reset();
            renderizarHistoricoEntradas();

        } catch (error) {
            console.error('❌ Erro ao registrar entrada:', error);
            Notificacoes.mostrarNotificacao('Erro ao registrar entrada. Tente novamente.', 'error');
        } finally {
            // Restaurar botão
            btnRegistrar.innerHTML = originalHTML;
            btnRegistrar.disabled = false;
        }
    };

    // Função para editar entrada
    const editarEntrada = () => {
        const entradaId = document.getElementById('editarEntradaId').value;
        const novaQuantidade = parseFloat(document.getElementById('editarEntradaQuantidade').value);

        if (!validarQuantidade(novaQuantidade)) {
            Notificacoes.mostrarNotificacao('Informe uma quantidade válida.', 'warning');
            return;
        }

        if (StorageManager.updateHistoricoEntrada(entradaId, novaQuantidade)) {
            renderizarHistoricoEntradas();
            modalEditarEntrada.hide();
            Notificacoes.mostrarNotificacao('Entrada atualizada com sucesso!', 'success');
        }
    };

    // Função para excluir entrada
    const excluirEntrada = (entradaId) => {
        if (StorageManager.deleteHistoricoEntrada(entradaId)) {
            renderizarHistoricoEntradas();
            modalConfirmacaoExclusaoEntrada.hide();
            Notificacoes.mostrarNotificacao('Entrada excluída com sucesso!', 'success');
        }
    };

    // Configurar event listeners
    const configurarEventListeners = () => {
        // Formulário de entrada
        if (formEntrada) {
            formEntrada.addEventListener('submit', registrarEntrada);
        }

        // Modal de edição
        document.getElementById('btnSalvarEdicaoEntrada').addEventListener('click', editarEntrada);

        // Modal de exclusão
        document.getElementById('btnConfirmarExclusaoEntrada').addEventListener('click', function() {
            const entradaId = this.dataset.id;
            const nomeInsumo = this.dataset.nome;
            
            if (confirm(`Tem certeza que deseja excluir a entrada de ${nomeInsumo}?`)) {
                excluirEntrada(entradaId);
            }
        });

        // Validação em tempo real da quantidade
        if (quantidadeEntradaInput) {
            quantidadeEntradaInput.addEventListener('input', (e) => {
                let valor = e.target.value.replace(/[^0-9.]/g, '');
                
                // Validar ponto decimal
                const pontos = valor.split('.').length - 1;
                if (pontos > 1) {
                    valor = valor.substring(0, valor.lastIndexOf('.'));
                }
                
                e.target.value = valor;
            });

            quantidadeEntradaInput.addEventListener('blur', (e) => {
                if (e.target.value && !validarQuantidade(e.target.value)) {
                    Notificacoes.mostrarNotificacao('Quantidade inválida. Use valores positivos.', 'warning');
                    e.target.value = '';
                }
            });
        }
    };

    // Função de inicialização da página
    const inicializarPagina = () => {
        console.log('🚀 Inicializando página de entrada de insumos...');
        
        configurarEventListeners();
        carregarSelectInsumos();
        renderizarHistoricoEntradas();
        
        // Mostrar alerta de atualização de estoque
        if (alertAtualizacaoEstoque) {
            alertAtualizacaoEstoque.style.display = 'flex';
        }
        
        console.log('✅ Página de entrada de insumos inicializada');
    };

    // Iniciar
    inicializarPagina();
});

// Funções globais para teste
window.testarEntradaRapida = () => {
    const selectInsumo = document.getElementById('selectInsumo');
    const quantidadeInput = document.getElementById('quantidadeEntrada');
    
    if (selectInsumo.options.length > 1) {
        // Selecionar randomicamente um insumo
        const randomIndex = Math.floor(Math.random() * (selectInsumo.options.length - 1)) + 1;
        selectInsumo.selectedIndex = randomIndex;
        
        // Gerar quantidade aleatória
        quantidadeInput.value = (Math.random() * 50 + 5).toFixed(2);
        
        Notificacoes.mostrarNotificacao('Entrada de teste preparada! Clique em Registrar.', 'info');
    }
};

window.limparHistoricoEntradas = () => {
    if (confirm('⚠️ ATENÇÃO: Isso removerá todo o histórico de entradas. Tem certeza?')) {
        localStorage.removeItem('historicoEntradas');
        Notificacoes.mostrarNotificacao('Histórico de entradas limpo!', 'info');
        location.reload();
    }
};
