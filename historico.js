// Lógica para a página de Histórico de Contagens (historico.html)

document.addEventListener('DOMContentLoaded', () => {
    const tabelaHistoricoBody = document.getElementById('tabelaHistorico');
    const semHistoricoText = document.getElementById('semHistorico');
    const modalContagem = new bootstrap.Modal(document.getElementById('modalContagem'));
    const modalConfirmacaoExclusao = new bootstrap.Modal(document.getElementById('modalConfirmacaoExclusao'));
    const btnConfirmarExclusao = document.getElementById('btnConfirmarExclusao');

    // Função para renderizar a tabela de histórico
    const renderizarHistorico = () => {
        console.log('🔄 Renderizando histórico...');
        const historico = StorageManager.getHistoricoContagens();
        
        tabelaHistoricoBody.innerHTML = '';
        if (document.getElementById('loadingHistorico')) {
            document.getElementById('loadingHistorico').style.display = 'none';
        }
        
        if (!historico || historico.length === 0) {
            if (semHistoricoText) semHistoricoText.style.display = 'block';
            console.log('⚠️ Nenhum histórico encontrado');
            return;
        }
        
        if (semHistoricoText) semHistoricoText.style.display = 'none';
        
        // Reverter para mostrar os mais recentes primeiro
        historico.reverse().forEach(contagem => {
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
                    RelatorioPDF.gerarPDF(contagem, 'contagem', `Relatorio_Contagem`);
                }
            });
        });

        document.querySelectorAll('.btn-excluir-historico').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const contagemId = e.currentTarget.dataset.id;
                btnConfirmarExclusao.dataset.id = contagemId;
                modalConfirmacaoExclusao.show();
            });
        });
        
        console.log('✅ Histórico renderizado:', historico.length, 'contagens');
    };

    // Função para exibir os detalhes da contagem no modal
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
        
        modalContagem.show();
    };

    // Configurar modal de confirmação
    btnConfirmarExclusao.addEventListener('click', function() {
        const contagemId = this.dataset.id;
        if (StorageManager.deleteContagem(contagemId)) {
            renderizarHistorico();
            Utils.mostrarNotificacao('Contagem excluída com sucesso!', 'success');
            modalConfirmacaoExclusao.hide();
        }
    });

    renderizarHistorico();
});
