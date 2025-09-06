// ===== LÓGICA PARA A PÁGINA DE GERENCIAMENTO DE INSUMOS =====
// Arquivo: gerenciar.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('⚙️ Inicializando página de gerenciamento...');
    
    const formInsumo = document.getElementById('formInsumo');
    const insumoIdInput = document.getElementById('insumoId');
    const insumoNomeInput = document.getElementById('insumoNome');
    const insumoUnidadeSelect = document.getElementById('insumoUnidade');
    const tabelaInsumosBody = document.getElementById('tabelaInsumos');
    const semInsumosText = document.getElementById('semInsumos');
    const loadingInsumos = document.getElementById('loadingInsumos');
    const buscaInsumos = document.getElementById('buscaInsumos');
    const btnOrdenarInsumos = document.getElementById('btnOrdenarInsumos');
    const alertModoEdicao = document.getElementById('alertModoEdicao');

    const modalConfirmacaoExclusao = new bootstrap.Modal(document.getElementById('modalConfirmacaoExclusao'));
    
    let insumosOrdenados = false;
    let modoEdicao = false;

    // Função para obter todos os insumos
    const obterInsumos = () => {
        return StorageManager.getInsumos();
    };

    // Função para filtrar insumos
    const filtrarInsumos = (insumos, termoBusca) => {
        if (!termoBusca) return insumos;
        
        return insumos.filter(insumo => 
            insumo.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
            insumo.unidade.toLowerCase().includes(termoBusca.toLowerCase())
        );
    };

    // Função para ordenar insumos
    const ordenarInsumos = (insumos, ordenar = false) => {
        if (!ordenar) return insumos;
        
        return [...insumos].sort((a, b) => 
            a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
        );
    };

    // Função para atualizar contador
    const atualizarContador = (quantidade) => {
        const contadorElement = document.getElementById('contadorInsumos');
        if (contadorElement) {
            contadorElement.textContent = quantidade === 0 ? 
                'Nenhum insumo cadastrado' : 
                `Total: ${quantidade} insumo${quantidade !== 1 ? 's' : ''}`;
        }
    };

    // Função para renderizar a tabela de insumos
    const renderizarTabelaInsumos = () => {
        console.log('🔄 Renderizando tabela de insumos...');
        
        if (loadingInsumos) loadingInsumos.style.display = 'block';
        if (tabelaInsumosBody) tabelaInsumosBody.innerHTML = '';
        
        let insumos = obterInsumos();
        
        // Aplicar filtros
        const termoBusca = buscaInsumos?.value.toLowerCase() || '';
        let insumosFiltrados = filtrarInsumos(insumos, termoBusca);
        insumosFiltrados = ordenarInsumos(insumosFiltrados, insumosOrdenados);
        
        // Esconder loading
        if (loadingInsumos) loadingInsumos.style.display = 'none';
        
        // Verificar se há dados
        if (insumosFiltrados.length === 0) {
            if (semInsumosText) {
                semInsumosText.style.display = 'block';
                semInsumosText.innerHTML = termoBusca ? 
                    `<i class="bi bi-search me-2"></i>Nenhum insumo encontrado para "${termoBusca}".` :
                    `<i class="bi bi-emoji-frown me-2"></i>Nenhum insumo encontrado. Adicione um novo insumo acima.`;
            }
            atualizarContador(0);
            console.log('⚠️ Nenhum insumo para exibir');
            return;
        }
        
        if (semInsumosText) semInsumosText.style.display = 'none';
        
        // Renderizar tabela
        insumosFiltrados.forEach((insumo, index) => {
            const tr = document.createElement('tr');
            
            // Verificar se o insumo está em uso
            const emUso = verificarInsumoEmUso(insumo.id);
            
            tr.innerHTML = `
                <td class="align-middle">
                    <div class="d-flex align-items-center">
                        <span class="me-2">${insumo.nome}</span>
                        ${!emUso ? '<span class="badge bg-secondary ms-2">Não utilizado</span>' : ''}
                    </div>
                </td>
                
                <td class="align-middle">
                    <span class="badge bg-primary">${insumo.unidade}</span>
                </td>
                
                <td class="align-middle text-end">
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-info btn-editar" 
                                data-id="${insumo.id}"
                                data-nome="${insumo.nome}"
                                data-unidade="${insumo.unidade}"
                                title="Editar insumo"
                                ${emUso ? '' : 'disabled'}>
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-excluir" 
                                data-id="${insumo.id}"
                                data-nome="${insumo.nome}"
                                title="Excluir insumo">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            if (tabelaInsumosBody) tabelaInsumosBody.appendChild(tr);
        });
        
        // Adicionar event listeners aos botões
        adicionarEventListenersBotoes();
        
        // Atualizar contador
        atualizarContador(insumosFiltrados.length);
        
        console.log('✅ Tabela de insumos renderizada:', insumosFiltrados.length, 'itens');
    };

    // Função para verificar se insumo está em uso
    const verificarInsumoEmUso = (insumoId) => {
        const ultimaContagem = StorageManager.getUltimaContagem();
        const historicoEntradas = StorageManager.getHistoricoEntradas();
        
        const emContagem = ultimaContagem && ultimaContagem.detalhesContagem && 
                          ultimaContagem.detalhesContagem[insumoId];
        
        const emEntradas = historicoEntradas.some(entrada => entrada.insumoId === insumoId);
        
        return emContagem || emEntradas;
    };

    // Função para adicionar event listeners aos botões
    const adicionarEventListenersBotoes = () => {
        document.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (e.currentTarget.disabled) return;
                
                const insumoId = e.currentTarget.dataset.id;
                const insumoNome = e.currentTarget.dataset.nome;
                const insumoUnidade = e.currentTarget.dataset.unidade;
                
                entrarModoEdicao(insumoId, insumoNome, insumoUnidade);
            });
        });

        document.querySelectorAll('.btn-excluir').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const insumoId = e.currentTarget.dataset.id;
                const insumoNome = e.currentTarget.dataset.nome;
                
                prepararExclusaoInsumo(insumoId, insumoNome);
            });
        });
    };

    // Função para entrar no modo de edição
    const entrarModoEdicao = (id, nome, unidade) => {
        insumoIdInput.value = id;
        insumoNomeInput.value = nome;
        insumoUnidadeSelect.value = unidade;
        
        modoEdicao = true;
        atualizarInterfaceModoEdicao();
        
        insumoNomeInput.focus();
        Notificacoes.mostrarNotificacao(`Editando insumo: ${nome}`, 'info');
    };

    // Função para sair do modo de edição
    const sairModoEdicao = () => {
        formInsumo.reset();
        insumoIdInput.value = '';
        
        modoEdicao = false;
        atualizarInterfaceModoEdicao();
        
        Notificacoes.mostrarNotificacao('Modo de edição cancelado.', 'info');
    };

    // Função para atualizar interface no modo edição
    const atualizarInterfaceModoEdicao = () => {
        const btnCancelar = document.getElementById('btnCancelarEdicao');
        
        if (modoEdicao) {
            alertModoEdicao.classList.remove('d-none');
            if (btnCancelar) btnCancelar.style.display = 'block';
            document.getElementById('btnSalvarInsumo').innerHTML = 
                '<i class="bi bi-check-circle me-2"></i>Atualizar Insumo';
        } else {
            alertModoEdicao.classList.add('d-none');
            if (btnCancelar) btnCancelar.style.display = 'none';
            document.getElementById('btnSalvarInsumo').innerHTML = 
                '<i class="bi bi-plus-circle me-2"></i>Salvar Insumo';
        }
    };

    // Função para preparar exclusão
    const prepararExclusaoInsumo = (id, nome) => {
        const emUso = verificarInsumoEmUso(id);
        
        document.getElementById('nomeInsumoExclusao').textContent = nome;
        document.getElementById('btnConfirmarExclusao').dataset.id = id;
        
        // Ajustar mensagem baseada no uso
        const alertElement = document.querySelector('#modalConfirmacaoExclusao .alert');
        if (alertElement) {
            if (emUso) {
                alertElement.innerHTML = `
                    ⚠️ <small>Este insumo possui histórico de uso. 
                    A exclusão removerá também seu histórico de contagens e entradas. 
                    Esta ação não pode ser desfeita.</small>
                `;
            } else {
                alertElement.innerHTML = `
                    ℹ️ <small>Este insumo não possui histórico de uso. 
                    A exclusão é segura e não afetará outros dados.</small>
                `;
                alertElement.classList.remove('alert-danger');
                alertElement.classList.add('alert-info');
            }
        }
        
        modalConfirmacaoExclusao.show();
    };

    // Função para salvar/atualizar insumo
    const salvarInsumo = async (event) => {
        event.preventDefault();
        
        const nome = insumoNomeInput.value.trim();
        const unidade = insumoUnidadeSelect.value;
        const id = insumoIdInput.value;

        // Validações
        if (!nome) {
            Notificacoes.mostrarNotificacao('Por favor, informe o nome do insumo.', 'warning');
            insumoNomeInput.focus();
            return;
        }

        if (!unidade) {
            Notificacoes.mostrarNotificacao('Por favor, selecione uma unidade de medida.', 'warning');
            insumoUnidadeSelect.focus();
            return;
        }

        // Verificar se já existe insumo com mesmo nome (exceto em edição)
        const insumos = obterInsumos();
        const insumoExistente = insumos.find(i => 
            i.nome.toLowerCase() === nome.toLowerCase() && i.id !== id
        );

        if (insumoExistente) {
            Notificacoes.mostrarNotificacao(
                `Já existe um insumo com o nome "${nome}". Use um nome diferente.`, 
                'warning'
            );
            insumoNomeInput.focus();
            return;
        }

        // Mostrar loading
        const btnSalvar = document.getElementById('btnSalvarInsumo');
        const originalHTML = btnSalvar.innerHTML;
        btnSalvar.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvando...';
        btnSalvar.disabled = true;

        try {
            let novosInsumos = [...insumos];
            
            if (id) {
                // Modo edição
                const index = novosInsumos.findIndex(insumo => insumo.id === id);
                if (index !== -1) {
                    novosInsumos[index] = { ...novosInsumos[index], nome, unidade };
                    Notificacoes.mostrarNotificacao('Insumo atualizado com sucesso!', 'success');
                }
            } else {
                // Modo criação
                const novoInsumo = {
                    id: Utils.gerarId('insumo-'),
                    nome,
                    unidade,
                    dataCriacao: new Date().toISOString()
                };
                novosInsumos.push(novoInsumo);
                Notificacoes.mostrarNotificacao('Insumo adicionado com sucesso!', 'success');
            }

            // Salvar no storage
            if (StorageManager.saveInsumos(novosInsumos)) {
                // Resetar formulário
                formInsumo.reset();
                sairModoEdicao();
                renderizarTabelaInsumos();
            }

        } catch (error) {
            console.error('❌ Erro ao salvar insumo:', error);
            Notificacoes.mostrarNotificacao('Erro ao salvar insumo. Tente novamente.', 'error');
        } finally {
            // Restaurar botão
            btnSalvar.innerHTML = originalHTML;
            btnSalvar.disabled = false;
        }
    };

    // Função para excluir insumo
    const excluirInsumo = (id) => {
        if (StorageManager.excluirDadosDoInsumo(id)) {
            renderizarTabelaInsumos();
            modalConfirmacaoExclusao.hide();
            Notificacoes.mostrarNotificacao('Insumo excluído com sucesso!', 'success');
        }
    };

    // Configurar event listeners
    const configurarEventListeners = () => {
        // Formulário
        if (formInsumo) {
            formInsumo.addEventListener('submit', salvarInsumo);
        }

        // Botão cancelar edição
        const btnCancelar = document.getElementById('btnCancelarEdicao');
        if (btnCancelar) {
            btnCancelar.addEventListener('click', sairModoEdicao);
        }

        // Busca
        if (buscaInsumos) {
            buscaInsumos.addEventListener('input', Utils.debounce(() => {
                renderizarTabelaInsumos();
            }, 300));
        }

        // Ordenação
        if (btnOrdenarInsumos) {
            btnOrdenarInsumos.addEventListener('click', () => {
                insumosOrdenados = !insumosOrdenados;
                btnOrdenarInsumos.innerHTML = insumosOrdenados ? 
                    '<i class="bi bi-sort-alpha-down-alt"></i>' : 
                    '<i class="bi bi-sort-alpha-down"></i>';
                
                btnOrdenarInsumos.title = insumosOrdenados ? 
                    'Ordenação alfabética ativa' : 
                    'Clique para ordenar alfabeticamente';
                
                renderizarTabelaInsumos();
            });
        }

        // Modal de exclusão
        document.getElementById('btnConfirmarExclusao').addEventListener('click', function() {
            const insumoId = this.dataset.id;
            excluirInsumo(insumoId);
        });

        // Fechar alerta de edição
        const btnFecharAlerta = alertModoEdicao.querySelector('.btn-close');
        if (btnFecharAlerta) {
            btnFecharAlerta.addEventListener('click', sairModoEdicao);
        }
    };

    // Função de inicialização da página
    const inicializarPagina = () => {
        console.log('🚀 Inicializando página de gerenciamento...');
        
        configurarEventListeners();
        renderizarTabelaInsumos();
        atualizarInterfaceModoEdicao();
        
        // Adicionar botão cancelar edição dinamicamente se não existir
        if (!document.getElementById('btnCancelarEdicao')) {
            const btnCancelar = document.createElement('button');
            btnCancelar.type = 'button';
            btnCancelar.id = 'btnCancelarEdicao';
            btnCancelar.className = 'btn btn-outline-secondary mt-2';
            btnCancelar.innerHTML = '<i class="bi bi-x-circle me-2"></i>Cancelar Edição';
            btnCancelar.style.display = 'none';
            btnCancelar.addEventListener('click', sairModoEdicao);
            
            formInsumo.appendChild(btnCancelar);
        }
        
        console.log('✅ Página de gerenciamento inicializada');
    };

    // Iniciar
    inicializarPagina();
});

// Funções globais para teste
window.adicionarInsumoTeste = () => {
    const nomesTeste = [
        'Queijo Mussarela', 'Tomate Seco', 'Manjericão Fresco', 
        'Azeite Extra Virgem', 'Farinha de Trigo', 'Fermento Biológico'
    ];
    
    const unidadesTeste = ['kg', 'g', 'unidade', 'pacote', 'litro', 'ml'];
    
    const nomeAleatorio = nomesTeste[Math.floor(Math.random() * nomesTeste.length)];
    const unidadeAleatoria = unidadesTeste[Math.floor(Math.random() * unidadesTeste.length)];
    
    document.getElementById('insumoNome').value = nomeAleatorio;
    document.getElementById('insumoUnidade').value = unidadeAleatoria;
    
    Notificacoes.mostrarNotificacao('Insumo de teste preparado! Clique em Salvar.', 'info');
};

window.verificarInsumos = () => {
    const insumos = StorageManager.getInsumos();
    const ultimaContagem = StorageManager.getUltimaContagem();
    const historicoEntradas = StorageManager.getHistoricoEntradas();
    
    console.log('=== VERIFICAÇÃO DE INSUMOS ===');
    console.log('Total de insumos:', insumos.length);
    
    insumos.forEach(insumo => {
        const emContagem = ultimaContagem && ultimaContagem.detalhesContagem && 
                          ultimaContagem.detalhesContagem[insumo.id];
        const emEntradas = historicoEntradas.some(entrada => entrada.insumoId === insumo.id);
        
        console.log(`${insumo.nome}: ${emContagem ? 'Em contagem' : 'Não em contagem'}, ${emEntradas ? 'Em entradas' : 'Não em entradas'}`);
    });
    
    console.log('=============================');
};
