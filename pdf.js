// pdf.js

const RelatorioPDF = {
    // Função para gerar o HTML do relatório de contagem
    gerarHtmlContagem: (contagem, insumos) => {
        let tabelaRows = '';
        Object.keys(contagem.detalhesContagem).forEach(insumoId => {
            const insumoInfo = insumos.find(i => i.id === insumoId) || { nome: 'Desconhecido', unidade: 'N/A' };
            const dados = contagem.detalhesContagem[insumoId];
            
            // Lógica para colorir as linhas com base no status do estoque
            let rowClass = '';
            if (Utils.isEstoqueBaixo(dados.posicaoFinal)) {
                rowClass = 'text-danger';
            }

            tabelaRows += `
                <tr class="${rowClass}">
                    <td>${insumoInfo.nome}</td>
                    <td>${insumoInfo.unidade}</td>
                    <td class="text-end">${dados.posicaoFinal}</td>
                </tr>
            `;
        });

        // O HTML retornado deve ser uma string completa, fácil de renderizar.
        // O design foi simplificado para evitar bugs de renderização do html2pdf.js.
        return `
            <div class="pdf-container">
                <div class="pdf-header text-center">
                    <h1 class="pdf-title">Relatório de Contagem</h1>
                    <p class="pdf-subtitle">La Giovana's Pizzaria</p>
                </div>
                <div class="pdf-info">
                    <p><strong>Responsável:</strong> ${contagem.responsavel}</p>
                    <p><strong>Data da Contagem:</strong> ${Utils.formatarData(contagem.data)}</p>
                </div>
                <table class="pdf-table">
                    <thead>
                        <tr>
                            <th>Insumo</th>
                            <th>Unidade</th>
                            <th class="text-end">Posição Final</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tabelaRows}
                    </tbody>
                </table>
                <div class="pdf-footer text-center">
                    <small>Relatório gerado em ${Utils.formatarData(new Date())}</small>
                </div>
            </div>
        `;
    },

    // Função para gerar o HTML do relatório de estoque atual
    gerarHtmlEstoqueAtual: (ultimaContagem, insumos) => {
        let tabelaRows = '';
        Object.keys(ultimaContagem.detalhesContagem).forEach(insumoId => {
            const insumoInfo = insumos.find(i => i.id === insumoId) || { nome: 'Desconhecido', unidade: 'N/A' };
            const sobrou = ultimaContagem.detalhesContagem[insumoId]?.sobrou || 0;
            
            let rowClass = '';
            if (Utils.isEstoqueBaixo(sobrou)) {
                rowClass = 'text-danger';
            }
            
            tabelaRows += `
                <tr class="${rowClass}">
                    <td>${insumoInfo.nome}</td>
                    <td>${insumoInfo.unidade}</td>
                    <td class="text-end">${sobrou}</td>
                </tr>
            `;
        });

        return `
            <div class="pdf-container">
                <div class="pdf-header text-center">
                    <h1 class="pdf-title">Relatório de Estoque Atual</h1>
                    <p class="pdf-subtitle">La Giovana's Pizzaria</p>
                </div>
                <div class="pdf-info">
                    <p><strong>Última Contagem:</strong> ${Utils.formatarData(ultimaContagem.data)}</p>
                </div>
                <table class="pdf-table">
                    <thead>
                        <tr>
                            <th>Insumo</th>
                            <th>Unidade</th>
                            <th class="text-end">Estoque Atual</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tabelaRows}
                    </tbody>
                </table>
                <div class="pdf-footer text-center">
                    <small>Relatório gerado em ${Utils.formatarData(new Date())}</small>
                </div>
            </div>
        `;
    },

    // Função principal que orquestra a geração do PDF
    gerarPDF: (dados, tipoRelatorio, filenamePrefix) => {
        const insumos = StorageManager.getInsumos();
        let htmlConteudo = '';
        
        switch (tipoRelatorio) {
            case 'contagem':
                htmlConteudo = RelatorioPDF.gerarHtmlContagem(dados, insumos);
                break;
            case 'estoque':
                htmlConteudo = RelatorioPDF.gerarHtmlEstoqueAtual(dados, insumos);
                break;
            default:
                Utils.mostrarNotificacao('Tipo de relatório não suportado.', 'warning');
                return;
        }
        
        const options = {
            margin: [20, 10, 20, 10], // Margem top, right, bottom, left (em mm)
            filename: `${filenamePrefix}_${Utils.getDataAtual()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Adiciona o conteúdo a uma div temporária para que o html2pdf.js renderize corretamente
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlConteudo;
        tempDiv.style.cssText = 'position: fixed; left: -9999px;';
        document.body.appendChild(tempDiv);

        html2pdf().set(options).from(tempDiv).save().finally(() => {
            document.body.removeChild(tempDiv);
        });
    }
};

