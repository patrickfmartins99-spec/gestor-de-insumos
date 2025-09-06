// Lógica para a página de Entrada de Insumos (entrada.html)

document.addEventListener('DOMContentLoaded', () => {
    const formEntrada = document.getElementById('formEntrada');
    const selectInsumo = document.getElementById('selectInsumo');
    const quantidadeEntradaInput = document.getElementById('quantidadeEntrada');
    const tabelaHistoricoEntradasBody = document.getElementById('tabelaHistoricoEntradas');
    const semEntradasText = document.getElementById('semEntradasText');
    const modalEditarEntrada = new bootstrap.Modal(document.getElementById('modalEditarEntrada'));
    const btnSalvarEdicaoEntrada = document.getElementById('btnSalvarEdicaoEntrada');
    const modalConfirmacaoExclusaoEntrada = new bootstrap.Modal(document.getElementById('modalConfirmacaoExclusaoEntrada'));
    const btnConfirmarExclusaoEntrada = document.getElementById('btnConfirmarExclusaoEntrada');

    // Função para carregar as opções do select de insumos
    const renderizarSelectInsumos = () => {
        console.log('🔄 Renderizando select de insumos...');
        const insumos = StorageManager.getInsumos();
        
        selectInsumo.innerHTML = '<option value="">-- Selecione um insumo --</option>';
        
        if (insumos && insumos.length > 0) {
            insumos.forEach(insumo => {
                const option = document.createElement('option');
                option.value = insumo.id;
                option.textContent = `${insumo.nome} (${insumo.unidade})`;
                selectInsumo.appendChild(option);
            });
            console.log('✅ Select de insumos carregado:', insumos.length, 'opções');
        } else {
            console.log('⚠️ Nenhum insumo para carregar no select');
        }
    };

    // Função para renderizar a tabela de histórico de entradas
    const renderizarHistoricoEntradas = () => {
        console.log('🔄 Renderizando histórico de entradas...');
        const historico = StorageManager.getHistoricoEntradas();
        const insumos = StorageManager.getInsumos();
        
        tabelaHistoricoEntradasBody.innerHTML = '';
        if (document.getElementById('loadingEntradas')) {
            document.getElementById('loadingEntradas').style.display = 'none';
        }
        
        if (!historico || historico.length === 0) {
            if (semEntradasText) semEntradasText.style.display = 'block';
            console.log('⚠️ Nenhuma entrada encontrada');
            return;
        }
        
        if (semEntradasText) semEntradasText.style.display = 'none';

        historico.reverse().forEach(entrada => {
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
                    modalEditarEntrada.show();
                }
            });
        });

        document.querySelectorAll('.btn-excluir-entrada').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const entradaId = e.currentTarget.dataset.id;
                btnConfirmarExclusaoEntrada.dataset.id = entradaId;
                modalConfirmacaoExclusaoEntrada.show();
            });
        });
        
        console.log('✅ Entradas renderizadas:', historico.length, 'registros');
    };

    // Lógica para registrar uma nova entrada
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

    // Configura o botão de salvar edição do modal
    btnSalvarEdicaoEntrada.addEventListener('click', () => {
        const entradaId = document.getElementById('editarEntradaId').value;
        const novaQuantidade = parseFloat(document.getElementById('editarEntradaQuantidade').value);

        if (isNaN(novaQuantidade) || novaQuantidade <= 0) {
            Utils.mostrarNotificacao('Por favor, digite uma quantidade válida.', 'warning');
            return;
        }

        if (StorageManager.updateHistoricoEntrada(entradaId, novaQuantidade)) {
            renderizarHistoricoEntradas();
            Utils.mostrarNotificacao('Entrada atualizada com sucesso!', 'success');
            modalEditarEntrada.hide();
        }
    });

    // Configura o botão de confirmação de exclusão do modal
    btnConfirmarExclusaoEntrada.addEventListener('click', function() {
        const entradaId = this.dataset.id;
        if (StorageManager.deleteHistoricoEntrada(entradaId)) {
            renderizarHistoricoEntradas();
            Utils.mostrarNotificacao('Entrada excluída com sucesso!', 'success');
            modalConfirmacaoExclusaoEntrada.hide();
        }
    });

    // Adiciona o event listener ao formulário de entrada
    formEntrada.addEventListener('submit', registrarEntrada);

    // Renderiza a tela inicialmente
    renderizarSelectInsumos();
    renderizarHistoricoEntradas();
});
