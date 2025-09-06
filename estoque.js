// Lógica para a página de Estoque Atual (estoque.html)

document.addEventListener('DOMContentLoaded', () => {
    const tabelaEstoqueBody = document.getElementById('tabelaEstoque');
    const btnGerarPdfEstoque = document.getElementById('btnGerarPdfEstoque');
    const semEstoqueText = document.getElementById('semEstoque');
    const btnAtualizarEstoque = document.getElementById('btnAtualizarEstoque');
    const btnExportarCSV = document.getElementById('btnExportarCSV');
    const buscaEstoque = document.getElementById('buscaEstoque');
    const btnOrdenarEstoque = document.getElementById('btnOrdenarEstoque');

    let estoqueOrdenado = false;

    // Função de renderização principal da tabela de estoque
    const renderizarEstoque = () => {
        console.log('🔄 Renderizando estoque...');
        const ultimaContagem = StorageManager.getUltimaContagem();
        const insumos = StorageManager.getInsumos();
        
        tabelaEstoqueBody.innerHTML = '';
        if (document.getElementById('loadingEstoque')) {
            document.getElementById('loadingEstoque').style.display = 'none';
        }

        if (!ultimaContagem || Object.keys(ultimaContagem.detalhesContagem).length === 0) {
            if (semEstoqueText) semEstoqueText.style.display = 'block';
            console.log('⚠️ Nenhuma contagem encontrada para estoque');
            return;
        }
        
        if (semEstoqueText) semEstoqueText.style.display = 'none';

        let insumosArray = Object.keys(ultimaContagem.detalhesContagem).map(insumoId => {
            const insumoInfo = insumos.find(i => i.id === insumoId) || { nome: 'Desconhecido', unidade: 'N/A' };
            const sobrou = ultimaContagem.detalhesContagem[insumoId]?.sobrou || 0;
            return { id: insumoId, nome: insumoInfo.nome, unidade: insumoInfo.unidade, quantidade: sobrou };
        });

        const termoBusca = buscaEstoque?.value.toLowerCase() || '';
        if (termoBusca) {
            insumosArray = insumosArray.filter(insumo => 
                insumo.nome.toLowerCase().includes(termoBusca)
            );
        }

        if (estoqueOrdenado) {
            insumosArray.sort((a, b) => a.nome.localeCompare(b.nome));
        }

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

        if (document.getElementById('totalInsumos')) {
            document.getElementById('totalInsumos').textContent = insumosArray.length;
            document.getElementById('normalCount').textContent = `${normalCount} normais`;
            document.getElementById('baixoCount').textContent = `${baixoCount} baixos`;
            document.getElementById('criticoCount').textContent = `${criticoCount} críticos`;
        }
        
        console.log('✅ Estoque renderizado:', insumosArray.length, 'itens');
    };

    // Event Listeners
    if (btnGerarPdfEstoque) {
        btnGerarPdfEstoque.addEventListener('click', () => {
            const ultimaContagem = StorageManager.getUltimaContagem();
            if (!ultimaContagem) {
                Utils.mostrarNotificacao('Não há dados de estoque para gerar o relatório.', 'warning');
                return;
            }
            btnGerarPdfEstoque.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Gerando...';
            setTimeout(() => {
                RelatorioPDF.gerarPDF(ultimaContagem, 'estoque', 'Relatorio_Estoque');
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
        buscaEstoque.addEventListener('input', Utils.debounce(renderizarEstoque, 300));
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

    // Renderiza a tela inicialmente
    renderizarEstoque();
});
