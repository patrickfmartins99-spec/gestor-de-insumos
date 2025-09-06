// Lógica para a página de Gerenciamento de Insumos

document.addEventListener('DOMContentLoaded', () => {
    const formInsumo = document.getElementById('formInsumo');
    const insumoIdInput = document.getElementById('insumoId');
    const insumoNomeInput = document.getElementById('insumoNome');
    const insumoUnidadeSelect = document.getElementById('insumoUnidade');
    const tabelaInsumosBody = document.getElementById('tabelaInsumos');
    const semInsumosText = document.getElementById('semInsumos');
    const btnCancelarEdicao = document.getElementById('btnCancelarEdicao');
    const buscaInsumos = document.getElementById('buscaInsumos');
    const btnOrdenarInsumos = document.getElementById('btnOrdenarInsumos');
    const modalConfirmacaoExclusao = new bootstrap.Modal(document.getElementById('modalConfirmacaoExclusao'));
    const btnConfirmarExclusao = document.getElementById('btnConfirmarExclusao');

    let insumosOrdenados = false;

    // Função de renderização principal da tabela de insumos
    const renderizarTabelaInsumos = () => {
        console.log('🔄 Renderizando tabela de insumos...');
        let insumos = StorageManager.getInsumos();
        
        tabelaInsumosBody.innerHTML = '';
        if (document.getElementById('loadingInsumos')) {
            document.getElementById('loadingInsumos').style.display = 'none';
        }
        
        if (!insumos || insumos.length === 0) {
            if (semInsumosText) semInsumosText.style.display = 'block';
            if (document.getElementById('contadorInsumos')) {
                document.getElementById('contadorInsumos').textContent = 'Nenhum insumo cadastrado';
            }
            console.log('⚠️ Nenhum insumo cadastrado');
            return;
        }
        
        if (semInsumosText) semInsumosText.style.display = 'none';
        if (document.getElementById('contadorInsumos')) {
            document.getElementById('contadorInsumos').textContent = `Total: ${insumos.length} insumos`;
        }

        const termoBusca = buscaInsumos?.value.toLowerCase() || '';
        if (termoBusca) {
            insumos = insumos.filter(insumo => 
                insumo.nome.toLowerCase().includes(termoBusca) ||
                insumo.unidade.toLowerCase().includes(termoBusca)
            );
        }

        if (insumosOrdenados) {
            insumos.sort((a, b) => a.nome.localeCompare(b.nome));
        }

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
        
        console.log('✅ Insumos renderizados:', insumos.length, 'itens');
    };

    // Função para salvar ou atualizar um insumo
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

    // Função para preencher o formulário para edição
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

    // Prepara o modal de exclusão
    const prepararExclusaoInsumo = (id) => {
        const insumo = StorageManager.getInsumos().find(i => i.id === id);
        if (insumo) {
            document.getElementById('nomeInsumoExclusao').textContent = insumo.nome;
            btnConfirmarExclusao.dataset.id = id;
            modalConfirmacaoExclusao.show();
        }
    };

    // Função para excluir insumo e seus dados relacionados
    const excluirInsumo = (id) => {
        if (StorageManager.excluirDadosDoInsumo(id)) {
            renderizarTabelaInsumos();
            Utils.mostrarNotificacao('Insumo e todos os seus dados foram excluídos com sucesso!', 'success');
            modalConfirmacaoExclusao.hide();
        }
    };

    // Limpa o formulário e cancela o modo de edição
    const cancelarEdicao = () => {
        formInsumo.reset();
        insumoIdInput.value = '';
        btnCancelarEdicao.style.display = 'none';
        document.getElementById('alertModoEdicao').style.display = 'none';
    };

    // Adiciona event listeners
    formInsumo.addEventListener('submit', salvarInsumo);
    btnCancelarEdicao.addEventListener('click', cancelarEdicao);
    btnConfirmarExclusao.addEventListener('click', (e) => {
        excluirInsumo(e.currentTarget.dataset.id);
    });
    
    if (buscaInsumos) {
        buscaInsumos.addEventListener('input', Utils.debounce(renderizarTabelaInsumos, 300));
    }

    if (btnOrdenarInsumos) {
        btnOrdenarInsumos.addEventListener('click', () => {
            insumosOrdenados = !insumosOrdenados;
            btnOrdenarInsumos.innerHTML = insumosOrdenados ? 
                '<i class="bi bi-sort-alpha-down-alt"></i>' : 
                '<i class="bi bi-sort-alpha-down"></i>';
            renderizarTabelaInsumos();
        });
    }

    // Renderiza a tabela inicial
    renderizarTabelaInsumos();
});
