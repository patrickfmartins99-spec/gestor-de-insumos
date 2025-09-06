// ===== LÓGICA PARA A PÁGINA DE HISTÓRICO =====
// Arquivo: historico.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('📊 Inicializando página de histórico...');
    
    const tabelaHistoricoBody = document.getElementById('tabelaHistorico');
    const loadingHistorico = document.getElementById('loadingHistorico');
    const semHistoricoText = document.getElementById('semHistorico');
    const buscaHistorico = document.getElementById('buscaHistorico');
    const btnOrdenarHistorico = document.getElementById('btnOrdenarHistorico');
    const btnLimparHistorico = document.getElementById('btnLimparHistorico');
    const modalDetalhes = new bootstrap.Modal(document.getElementById('modalDetalhesContagem'));

    let historicoOrdenadoPorData = true;
    let contagemSelecionada = null;

    // Função para obter e processar histórico
    const obterHistoricoProcessado = () => {
        const historico = StorageManager.getHistoricoContagens();
        const insumos = StorageManager.getInsumos();
        
        return historico.map(contagem => {
            const itensContados = Object.keys(contagem.detalhesContagem || {}).length;
            const temProblemas = Object.values(contagem.detalhesContagem || {}).some(
                item => Utils.isEstoqueBaixo(item.sobrou) || Utils.isEstoqueBaixo(item.posicaoFinal)
            );
            
            return {
                ...contagem,
                itensContados,
                temProblemas,
                dataFormatada: Utils.formatarData(contagem.data)
            };
        });
    };

    // Função para renderizar histórico
    const renderizarHistorico = () => {
        console.log('🔄 Renderizando histórico...');
        
        if (loadingHistorico) loadingHistorico.style.display = 'block';
        if (tabelaHistoricoBody) tabelaHistoricoBody.innerHTML = '';
        
        let historico = obterHistoricoProcessado();
        
        // Aplicar filtro de busca
        const termoBusca = buscaHistorico?.value.toLowerCase() || '';
        if (termoBusca) {
            historico = historico.filter(contagem =>
                contagem.responsavel.toLowerCase().includes(termoBusca) ||
                contagem.data.toLowerCase().includes(termoBusca) ||
                contagem.id.toLowerCase().includes(termoBusca)
            );
        }
        
        // Ordenar
        historico.sort((a, b) => {
            if (historicoOrdenadoPorData) {
                return new Date(b.data) - new Date(a.data);
            } else {
                return a.responsavel.localeCompare(b.responsavel);
            }
        });
        
        // Esconder loading
        if (loadingHistorico) loadingHistorico.style.display = 'none';
        
        // Verificar se há dados
        if (historico.length === 0) {
            if (semHistoricoText) semHistoricoText.style.display = 'block';
            atualizarContador(0);
            console.log('⚠️ Nenhuma contagem no histórico');
            return;
        }
        
        if (semHistoricoText) semHistoricoText.style.display = 'none';
        
        // Renderizar tabela
        historico.forEach(contagem => {
            const tr = document.createElement('tr');
            
            if (contagem.temProblemas) {
                tr.classList.add('table-warning');
            }
            
            tr.innerHTML = `
                <td class="align-middle">
                    <span class="text-nowrap">${contagem.dataFormatada}</span>
                    <br>
                    <small class="text-muted">${contagem.id.substring(0, 8)}</small>
                </td>
                
                <td class="align-middle">${contagem.responsavel}</td>
                
                <td class="align-middle">
                    <span class="badge bg-primary">${contagem.itensContados} itens</span>
                </td>
                
                <td class="align-middle text-center">
                    ${contagem.temProblemas ? 
                        '<span class="badge bg-warning"><i class="bi bi-exclamation-triangle me-1"></i>Com problemas</span>' : 
                        '<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Normal</span>'}
                </td>
                
                <td class="align-middle text-end">
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-info btn-detalhes" data-id="${contagem.id}">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-outline-primary btn-pdf" data-id="${contagem.id}">
                            <i class="bi bi-file-earmark-pdf"></i>
                        </button>
                    </div>
                </td>
            `;
            
            if (tabelaHistoricoBody) tabelaHistoricoBody.appendChild(tr);
        });
        
        // Adicionar event listeners
        adicionarEventListeners();
        atualizarContador(historico.length);
        
        console.log('✅ Histórico renderizado:', historico.length, 'contagens');
    };

    // Função para mostrar detalhes
    const mostrarDetalhes = (contagemId) => {
        const historico = StorageManager.getHistoricoContagens();
        const contagem = historico.find(c => c.id === contagemId);
        const insumos = StorageManager.getInsumos();
        
        if (!contagem) return;
        
        contagemSelecionada = contagem;
        
        let html = `
            <div class="row">
                <div class="col-md-6">
                    <p><strong>Responsável:</strong> ${contagem.responsavel}</p>
                    <p><strong>Data:</strong> ${Utils.formatarData(contagem.data)}</p>
                    <p><strong>ID:</strong> ${contagem.id}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>Total de itens:</strong> ${Object.keys(contagem.detalhesContagem).length}</p>
                    <p><strong>Data de registro:</strong> ${Utils.formatarDataHora(contagem.timestamp)}</p>
                </div>
            </div>
            
            <hr>
            
            <h6 class="mb-3">Itens da Contagem</h6>
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Insumo</th>
                            <th class="text-end">Estoque</th>
                            <th class="text-end">Desceu</th>
                            <th class="text-end">Linha</th>
                            <th class="text-end">Sobrou</th>
                            <th class="text-end">Posição Final</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        Object.entries(contagem.detalhesContagem).forEach(([insumoId, dados]) => {
            const insumo = insumos.find(i => i.id === insumoId) || { nome: 'Desconhecido', unidade: 'N/A' };
            const problema = Utils.isEstoqueBaixo(dados.sobrou) || Utils.isEstoqueBaixo(dados.posicaoFinal);
            
            html += `
                <tr class="${problema ? 'table-warning' : ''}">
                    <td>${insumo.nome} <small class="text-muted">(${insumo.unidade})</small></td>
                    <td class="text-end">${dados.estoque}</td>
                    <td class="text-end">${dados.desceu}</td>
                    <td class="text-end">${dados.linhaMontagem}</td>
                    <td class="text-end ${Utils.isEstoqueBaixo(dados.sobrou) ? 'text-danger fw-bold' : ''}">${dados.sobrou}</td>
                    <td class="text-end ${Utils.isEstoqueBaixo(dados.posicaoFinal) ? 'text-danger fw-bold' : ''}">${dados.posicaoFinal}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        document.getElementById('detalhesContagemBody').innerHTML = html;
        modalDetalhes.show();
    };

    // Função para atualizar contador
    const atualizarContador = (total) => {
        const contador = document.getElementById('contadorHistorico');
        if (contador) {
            contador.textContent = `Total: ${total} contagem${total !== 1 ? 'ens' : ''}`;
        }
    };

    // Adicionar event listeners
    const adicionarEventListeners = () => {
        document.querySelectorAll('.btn-detalhes').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const contagemId = e.currentTarget.dataset.id;
                mostrarDetalhes(contagemId);
            });
        });

        document.querySelectorAll('.btn-pdf').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const contagemId = e.currentTarget.dataset.id;
                const historico = StorageManager.getHistoricoContagens();
                const contagem = historico.find(c => c.id === contagemId);
                
                if (contagem) {
                    RelatorioPDF.gerarPDF(contagem, 'contagem', `Historico_${contagemId}`);
                }
            });
        });

        document.getElementById('btnGerarPdfHistorico').addEventListener('click', () => {
            if (contagemSelecionada) {
                RelatorioPDF.gerarPDF(contagemSelecionada, 'contagem', `Historico_${contagemSelecionada.id}`);
                modalDetalhes.hide();
            }
        });
    };

    // Configurar event listeners principais
    const configurarEventListeners = () => {
        if (buscaHistorico) {
            buscaHistorico.addEventListener('input', Utils.debounce(renderizarHistorico, 300));
        }

        if (btnOrdenarHistorico) {
            btnOrdenarHistorico.addEventListener('click', () => {
                historicoOrdenadoPorData = !historicoOrdenadoPorData;
                btnOrdenarHistorico.innerHTML = historicoOrdenadoPorData ? 
                    '<i class="bi bi-sort-down-alt"></i>' : 
                    '<i class="bi bi-sort-alpha-down"></i>';
                renderizarHistorico();
            });
        }

        if (btnLimparHistorico) {
            btnLimparHistorico.addEventListener('click', () => {
                if (confirm('⚠️ ATENÇÃO: Isso apagará todo o histórico de contagens. Tem certeza?')) {
                    if (StorageManager.setItem('historicoContagens', [])) {
                        Notificacoes.mostrarNotificacao('Histórico limpo com sucesso!', 'success');
                        renderizarHistorico();
                    }
                }
            });
        }
    };

    // Inicializar página
    const inicializarPagina = () => {
        configurarEventListeners();
        renderizarHistorico();
        console.log('✅ Página de histórico inicializada');
    };

    // Iniciar
    inicializarPagina();
});
