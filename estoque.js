// ===== LÓGICA PARA A PÁGINA DE ESTOQUE ATUAL =====
// Arquivo: estoque.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('📦 Inicializando página de estoque...');
    
    const tabelaEstoqueBody = document.getElementById('tabelaEstoque');
    const btnGerarPdfEstoque = document.getElementById('btnGerarPdfEstoque');
    const semEstoqueText = document.getElementById('semEstoque');
    const btnAtualizarEstoque = document.getElementById('btnAtualizarEstoque');
    const btnExportarCSV = document.getElementById('btnExportarCSV');
    const buscaEstoque = document.getElementById('buscaEstoque');
    const btnOrdenarEstoque = document.getElementById('btnOrdenarEstoque');
    const loadingEstoque = document.getElementById('loadingEstoque');

    let estoqueOrdenado = false;
    let dadosEstoqueAtual = [];

    // Função para formatar números com separadores
    const formatarNumero = (numero) => {
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(numero);
    };

    // Função para obter informações do estoque
    const obterDadosEstoque = () => {
        const ultimaContagem = StorageManager.getUltimaContagem();
        const insumos = StorageManager.getInsumos();
        
        if (!ultimaContagem || !ultimaContagem.detalhesContagem || Object.keys(ultimaContagem.detalhesContagem).length === 0) {
            return [];
        }

        return Object.keys(ultimaContagem.detalhesContagem)
            .map(insumoId => {
                const insumoInfo = insumos.find(i => i.id === insumoId) || { 
                    nome: 'Desconhecido', 
                    unidade: 'N/A' 
                };
                
                const detalhes = ultimaContagem.detalhesContagem[insumoId];
                const quantidade = detalhes?.sobrou || 0;
                
                return {
                    id: insumoId,
                    nome: insumoInfo.nome,
                    unidade: insumoInfo.unidade,
                    quantidade: quantidade,
                    status: calcularStatusEstoque(quantidade),
                    ultimaAtualizacao: ultimaContagem.data
                };
            })
            .filter(insumo => insumo !== null);
    };

    // Função para calcular o status do estoque
    const calcularStatusEstoque = (quantidade) => {
        if (quantidade <= CONFIG.estoqueCritico) {
            return { texto: 'crítico', classe: 'danger', icone: 'bi-x-circle' };
        } else if (quantidade <= CONFIG.estoqueBaixo) {
            return { texto: 'baixo', classe: 'warning', icone: 'bi-exclamation-triangle' };
        } else {
            return { texto: 'normal', classe: 'success', icone: 'bi-check-circle' };
        }
    };

    // Função para filtrar estoque por busca
    const filtrarEstoque = (dados, termoBusca) => {
        if (!termoBusca) return dados;
        
        return dados.filter(insumo => 
            insumo.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
            insumo.unidade.toLowerCase().includes(termoBusca.toLowerCase()) ||
            insumo.status.texto.toLowerCase().includes(termoBusca.toLowerCase())
        );
    };

    // Função para ordenar estoque
    const ordenarEstoque = (dados, ordenar = false) => {
        if (!ordenar) return dados;
        
        return [...dados].sort((a, b) => 
            a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
        );
    };

    // Função para atualizar contadores
    const atualizarContadores = (dados) => {
        if (!document.getElementById('totalInsumos')) return;
        
        const contadores = {
            total: dados.length,
            normal: 0,
            baixo: 0,
            critico: 0
        };

        dados.forEach(insumo => {
            if (insumo.quantidade <= CONFIG.estoqueCritico) {
                contadores.critico++;
            } else if (insumo.quantidade <= CONFIG.estoqueBaixo) {
                contadores.baixo++;
            } else {
                contadores.normal++;
            }
        });

        document.getElementById('totalInsumos').textContent = contadores.total;
        document.getElementById('normalCount').textContent = `${contadores.normal} normais`;
        document.getElementById('baixoCount').textContent = `${contadores.baixo} baixos`;
        document.getElementById('criticoCount').textContent = `${contadores.critico} críticos`;
    };

    // Função de renderização principal da tabela de estoque
    const renderizarEstoque = () => {
        console.log('🔄 Atualizando tabela de estoque...');
        
        // Mostrar loading
        if (loadingEstoque) loadingEstoque.style.display = 'block';
        if (tabelaEstoqueBody) tabelaEstoqueBody.innerHTML = '';
        
        // Obter dados
        dadosEstoqueAtual = obterDadosEstoque();
        
        // Aplicar filtros
        const termoBusca = buscaEstoque?.value.toLowerCase() || '';
        let dadosFiltrados = filtrarEstoque(dadosEstoqueAtual, termoBusca);
        dadosFiltrados = ordenarEstoque(dadosFiltrados, estoqueOrdenado);
        
        // Esconder loading
        if (loadingEstoque) loadingEstoque.style.display = 'none';
        
        // Verificar se há dados
        if (dadosFiltrados.length === 0) {
            if (semEstoqueText) {
                semEstoqueText.style.display = 'block';
                semEstoqueText.innerHTML = termoBusca ? 
                    `<i class="bi bi-search me-2"></i>Nenhum insumo encontrado para "${termoBusca}".` :
                    `<i class="bi bi-inbox me-2"></i>Não há dados de estoque para exibir.`;
            }
            console.log('⚠️ Nenhum dado de estoque para exibir');
            return;
        }
        
        if (semEstoqueText) semEstoqueText.style.display = 'none';
        
        // Renderizar tabela
        dadosFiltrados.forEach(insumo => {
            const tr = document.createElement('tr');
            
            // Adicionar classe baseada no status
            if (insumo.quantidade <= CONFIG.estoqueCritico) {
                tr.classList.add('table-danger');
            } else if (insumo.quantidade <= CONFIG.estoqueBaixo) {
                tr.classList.add('table-warning');
            }
            
            tr.innerHTML = `
                <td class="align-middle">
                    <div class="d-flex align-items-center">
                        <span class="me-2">${insumo.nome}</span>
                        ${insumo.quantidade <= CONFIG.estoqueBaixo ? 
                            `<i class="bi bi-exclamation-triangle text-warning" title="Estoque baixo"></i>` : ''}
                    </div>
                </td>
                
                <td class="align-middle">
                    <span class="badge bg-primary">${insumo.unidade}</span>
                </td>
                
                <td class="align-middle text-center">
                    <span class="badge bg-${insumo.status.classe}">
                        <i class="bi ${insumo.status.icone} me-1"></i>
                        ${insumo.status.texto}
                    </span>
                </td>
                
                <td class="align-middle text-end">
                    <span class="fw-bold ${insumo.quantidade <= CONFIG.estoqueBaixo ? 'text-danger' : ''}">
                        ${formatarNumero(insumo.quantidade)}
                    </span>
                </td>
            `;
            
            if (tabelaEstoqueBody) tabelaEstoqueBody.appendChild(tr);
        });
        
        // Atualizar contadores
        atualizarContadores(dadosFiltrados);
        
        console.log('✅ Estoque renderizado:', dadosFiltrados.length, 'itens');
    };

    // Função para exportar CSV
    const exportarCSV = () => {
        if (dadosEstoqueAtual.length === 0) {
            Notificacoes.mostrarNotificacao('Nenhum dado de estoque para exportar.', 'warning');
            return;
        }

        let csv = 'Insumo,Unidade,Quantidade,Status,Última Atualização\n';
        
        dadosEstoqueAtual.forEach(insumo => {
            const linha = [
                `"${insumo.nome.replace(/"/g, '""')}"`,
                `"${insumo.unidade}"`,
                insumo.quantidade,
                `"${insumo.status.texto}"`,
                `"${Utils.formatarData(insumo.ultimaAtualizacao)}"`
            ].join(',');
            
            csv += linha + '\n';
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
        
        Notificacoes.mostrarNotificacao('CSV exportado com sucesso!', 'success');
    };

    // Função para gerar relatório do estoque (SUBSTITUIÇÃO DO PDF)
    const gerarRelatorioEstoque = () => {
        const ultimaContagem = StorageManager.getUltimaContagem();
        
        if (!ultimaContagem || Object.keys(ultimaContagem.detalhesContagem).length === 0) {
            Notificacoes.mostrarNotificacao('Não há dados de estoque para gerar o relatório.', 'warning');
            return;
        }

        // Mostrar loading no botão
        const originalHTML = btnGerarPdfEstoque.innerHTML;
        btnGerarPdfEstoque.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Gerando...';
        btnGerarPdfEstoque.disabled = true;

        setTimeout(() => {
            try {
                RelatorioMobile.gerarRelatorio(ultimaContagem, StorageManager.getInsumos());
            } catch (error) {
                console.error('❌ Erro ao gerar relatório:', error);
                Notificacoes.mostrarNotificacao('Erro ao gerar relatório. Verifique o console.', 'error');
            } finally {
                // Restaurar botão
                btnGerarPdfEstoque.innerHTML = originalHTML;
                btnGerarPdfEstoque.disabled = false;
            }
        }, 500);
    };

    // Função para atualizar estoque
    const atualizarEstoque = () => {
        if (btnAtualizarEstoque) {
            btnAtualizarEstoque.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Atualizando...';
            btnAtualizarEstoque.disabled = true;
            
            setTimeout(() => {
                renderizarEstoque();
                btnAtualizarEstoque.innerHTML = '<i class="bi bi-arrow-clockwise me-2"></i>Atualizar';
                btnAtualizarEstoque.disabled = false;
                Notificacoes.mostrarNotificacao('Estoque atualizado com sucesso!', 'success');
            }, 500);
        }
    };

    // Configurar event listeners
    const configurarEventListeners = () => {
        if (btnGerarPdfEstoque) {
            btnGerarPdfEstoque.addEventListener('click', gerarRelatorioEstoque);
        }

        if (btnAtualizarEstoque) {
            btnAtualizarEstoque.addEventListener('click', atualizarEstoque);
        }

        if (btnExportarCSV) {
            btnExportarCSV.addEventListener('click', exportarCSV);
        }

        if (buscaEstoque) {
            buscaEstoque.addEventListener('input', Utils.debounce(() => {
                renderizarEstoque();
            }, 300));
            
            // Placeholder dinâmico
            buscaEstoque.placeholder = 'Buscar por nome, unidade ou status...';
        }

        if (btnOrdenarEstoque) {
            btnOrdenarEstoque.addEventListener('click', () => {
                estoqueOrdenado = !estoqueOrdenado;
                btnOrdenarEstoque.innerHTML = estoqueOrdenado ? 
                    '<i class="bi bi-sort-alpha-down-alt"></i>' : 
                    '<i class="bi bi-sort-alpha-down"></i>';
                
                btnOrdenarEstoque.title = estoqueOrdenado ? 
                    'Ordenação alfabética ativa' : 
                    'Clique para ordenar alfabeticamente';
                
                renderizarEstoque();
            });
        }
    };

    // Função de inicialização da página
    const inicializarPagina = () => {
        console.log('🚀 Inicializando página de estoque...');
        
        configurarEventListeners();
        renderizarEstoque();
        
        // Adicionar informação de última atualização
        const ultimaContagem = StorageManager.getUltimaContagem();
        if (ultimaContagem) {
            const infoAtualizacao = document.createElement('div');
            infoAtualizacao.className = 'text-center text-muted small mt-3';
            infoAtualizacao.innerHTML = `
                <i class="bi bi-clock-history me-1"></i>
                Última atualização: ${Utils.formatarData(ultimaContagem.data)}
                ${ultimaContagem.responsavel ? ` por ${ultimaContagem.responsavel}` : ''}
            `;
            
            const contadorEstoque = document.getElementById('contadorEstoque');
            if (contadorEstoque) {
                contadorEstoque.parentNode.insertBefore(infoAtualizacao, contadorEstoque.nextSibling);
            }
        }
        
        console.log('✅ Página de estoque inicializada');
    };

    // Iniciar
    inicializarPagina();
});

// Função global para teste
window.mostrarDetalhesEstoque = () => {
    const estoque = StorageManager.getUltimaContagem();
    const insumos = StorageManager.getInsumos();
    
    console.log('=== DETALHES DO ESTOQUE ===');
    console.log('Total de insumos:', insumos.length);
    console.log('Itens em estoque:', estoque ? Object.keys(estoque.detalhesContagem).length : 0);
    console.log('Última contagem:', estoque ? Utils.formatarData(estoque.data) : 'N/A');
    console.log('===========================');
};
