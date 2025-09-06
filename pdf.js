// pdf.js

const RelatorioPDF = {
    // Função para gerar o HTML do relatório de contagem
    gerarHtmlContagem: (contagem, insumos) => {
        const dataContagemFormatada = Utils.formatarData(contagem.data);
        const dataGeracaoFormatada = Utils.formatarData(new Date());

        let tabelaRows = '';
        Object.keys(contagem.detalhesContagem).forEach(insumoId => {
            const insumoInfo = insumos.find(i => i.id === insumoId) || { nome: 'Desconhecido', unidade: 'N/A' };
            const dados = contagem.detalhesContagem[insumoId];
            
            tabelaRows += `
                <tr>
                    <td style="padding: 8px; border: 1px solid #000;">${insumoInfo.nome}</td>
                    <td style="padding: 8px; border: 1px solid #000; text-align: center;">${dados.estoque}</td>
                    <td style="padding: 8px; border: 1px solid #000; text-align: center;">${dados.desceu}</td>
                    <td style="padding: 8px; border: 1px solid #000; text-align: center;">${dados.linhaMontagem}</td>
                    <td style="padding: 8px; border: 1px solid #000; text-align: center;">${dados.sobrou}</td>
                    <td style="padding: 8px; border: 1px solid #000; text-align: center;">${dados.posicaoFinal}</td>
                </tr>
            `;
        });

        // Este HTML se assemelha mais ao seu modelo, mas com estilos simplificados para evitar erros de renderização.
        return `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #000;">
                <div style="text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #000;">
                    <h1 style="margin: 0; color: #000; font-size: 24px;">La Giovana's Pizzaria</h1>
                    <p style="margin: 5px 0; font-size: 18px; color: #000;">Detalhes da Contagem</p>
                </div>
                
                <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #000; border-radius: 8px;">
                    <p style="margin: 5px 0; font-size: 16px;"><strong>Responsável:</strong> ${contagem.responsavel}</p>
                    <p style="margin: 5px 0; font-size: 16px;"><strong>Data da contagem:</strong> ${dataContagemFormatada}</p>
                    <p style="margin: 5px 0; font-size: 14px; color: #333;">Nº do Registro: ${contagem.id}</p>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px;">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            <th style="padding: 12px; border: 1px solid #000; text-align: left;">Insumo</th>
                            <th style="padding: 12px; border: 1px solid #000; text-align: center;">Estoque</th>
                            <th style="padding: 12px; border: 1px solid #000; text-align: center;">Desceu</th>
                            <th style="padding: 12px; border: 1px solid #000; text-align: center;">Linha</th>
                            <th style="padding: 12px; border: 1px solid #000; text-align: center;">Sobrou</th>
                            <th style="padding: 12px; border: 1px solid #000; text-align: center;">Posição Final</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tabelaRows}
                    </tbody>
                </table>
                
                <div style="text-align: center; margin-top: 25px; font-size: 12px; color: #6c757d;">
                    Documento gerado em ${dataGeracaoFormatada}.
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
