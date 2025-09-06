// ===== TEMPLATES PARA RELATÓRIOS PDF =====
// Arquivo: pdf-templates.js
// Templates centralizados para geração de PDFs

const PDFTemplates = {
    // Cabeçalho padrão para todos os relatórios
    header: (titulo, subtitulo = '') => {
        return `
            <div style="text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #2c3e50;">
                <h1 style="margin: 0; color: #2c3e50; font-size: 24px; font-weight: bold;">La Giovana's Pizzaria</h1>
                <p style="margin: 5px 0; font-size: 18px; color: #2c3e50;">${titulo}</p>
                ${subtitulo ? `<p style="margin: 0; font-size: 14px; color: #7f8c8d;">${subtitulo}</p>` : ''}
            </div>
        `;
    },

    // Caixa de informações (dados da contagem/responsável)
    infoBox: (dados) => {
        const infoItems = Object.entries(dados).map(([chave, valor]) => `
            <p style="margin: 5px 0; font-size: 14px; line-height: 1.4;">
                <strong style="color: #2c3e50;">${chave}:</strong> 
                <span style="color: #34495e;">${valor}</span>
            </p>
        `).join('');

        return `
            <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #bdc3c7; border-radius: 5px; background: #f8f9fa;">
                ${infoItems}
            </div>
        `;
    },

    // Tabela para dados tabulares
    table: (headers, rows, destacarLinhas = true) => {
        const headerRow = headers.map(header => 
            `<th style="padding: 12px; border: 1px solid #2c3e50; background: #2c3e50; color: white; text-align: left; font-size: 12px; font-weight: bold;">${header}</th>`
        ).join('');

        const bodyRows = rows.map((row, index) => {
            const bgColor = destacarLinhas && index % 2 === 0 ? '#f8f9fa' : '#ffffff';
            return `
                <tr style="background-color: ${bgColor};">
                    ${row.map(cell => `
                        <td style="padding: 10px; border: 1px solid #dee2e6; font-size: 11px; vertical-align: top;">
                            ${cell}
                        </td>
                    `).join('')}
                </tr>
            `;
        }).join('');

        return `
            <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-family: Arial, sans-serif;">
                <thead>
                    <tr>${headerRow}</tr>
                </thead>
                <tbody>${bodyRows}</tbody>
            </table>
        `;
    },

    // Rodapé padrão
    footer: (textoAdicional = '') => {
        const dataAtual = new Date().toLocaleDateString('pt-BR');
        const horaAtual = new Date().toLocaleTimeString('pt-BR');
        
        return `
            <div style="text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #bdc3c7; color: #7f8c8d; font-size: 10px;">
                <p style="margin: 5px 0;">Documento gerado em ${dataAtual} às ${horaAtual}</p>
                ${textoAdicional ? `<p style="margin: 5px 0;">${textoAdicional}</p>` : ''}
                <p style="margin: 5px 0;">Sistema de Gestão de Insumos - La Giovana's Pizzaria</p>
            </div>
        `;
    },

    // Template específico para relatório de contagem
    relatorioContagem: (contagem, insumos) => {
        const dadosInfo = {
            'Responsável': contagem.responsavel,
            'Data da Contagem': Utils.formatarData(contagem.data),
            'Nº do Registro': contagem.id.substring(0, 8) + '...'
        };

        const headers = ['Insumo', 'Estoque', 'Desceu', 'Linha', 'Sobrou', 'Posição Final'];
        
        const rows = Object.keys(contagem.detalhesContagem).map(insumoId => {
            const insumoInfo = insumos.find(i => i.id === insumoId) || { nome: 'Desconhecido', unidade: 'N/A' };
            const dados = contagem.detalhesContagem[insumoId];
            
            // Destacar valores críticos em vermelho
            const formatarValor = (valor, isCritico = false) => {
                return isCritico ? 
                    `<span style="color: #e74c3c; font-weight: bold;">${valor}</span>` : 
                    valor;
            };

            return [
                `${insumoInfo.nome} (${insumoInfo.unidade})`,
                formatarValor(dados.estoque),
                formatarValor(dados.desceu),
                formatarValor(dados.linhaMontagem),
                formatarValor(dados.sobrou, dados.sobrou <= CONFIG.estoqueBaixo),
                formatarValor(dados.posicaoFinal, dados.posicaoFinal <= CONFIG.estoqueBaixo)
            ];
        });

        return `
            <div style="font-family: Arial, sans-serif; padding: 25px; color: #2c3e50; font-size: 14px; line-height: 1.4;">
                ${PDFTemplates.header('Relatório de Contagem', 'Detalhes da contagem de insumos')}
                ${PDFTemplates.infoBox(dadosInfo)}
                ${PDFTemplates.table(headers, rows)}
                ${PDFTemplates.footer('Controle de insumos e estoque')}
            </div>
        `;
    },

    // Template específico para relatório de estoque
    relatorioEstoque: (ultimaContagem, insumos) => {
        const dadosInfo = {
            'Data de Referência': Utils.formatarData(ultimaContagem.data),
            'Responsável': ultimaContagem.responsavel || 'N/A',
            'Total de Itens': Object.keys(ultimaContagem.detalhesContagem).length
        };

        const headers = ['Insumo', 'Unidade', 'Estoque Atual', 'Status'];
        
        const rows = Object.keys(ultimaContagem.detalhesContagem).map(insumoId => {
            const insumoInfo = insumos.find(i => i.id === insumoId) || { nome: 'Desconhecido', unidade: 'N/A' };
            const quantidade = ultimaContagem.detalhesContagem[insumoId]?.sobrou || 0;
            
            let status = 'Normal';
            let statusStyle = 'color: #27ae60; font-weight: bold;';
            
            if (quantidade <= CONFIG.estoqueCritico) {
                status = 'CRÍTICO';
                statusStyle = 'color: #e74c3c; font-weight: bold;';
            } else if (quantidade <= CONFIG.estoqueBaixo) {
                status = 'Baixo';
                statusStyle = 'color: #f39c12; font-weight: bold;';
            }

            const quantidadeStyle = quantidade <= CONFIG.estoqueBaixo ? 'color: #e74c3c; font-weight: bold;' : '';

            return [
                insumoInfo.nome,
                insumoInfo.unidade,
                `<span style="${quantidadeStyle}">${quantidade}</span>`,
                `<span style="${statusStyle}">${status}</span>`
            ];
        });

        return `
            <div style="font-family: Arial, sans-serif; padding: 25px; color: #2c3e50; font-size: 14px; line-height: 1.4;">
                ${PDFTemplates.header('Relatório de Estoque Atual', 'Posição atual dos insumos')}
                ${PDFTemplates.infoBox(dadosInfo)}
                ${PDFTemplates.table(headers, rows)}
                ${PDFTemplates.footer('Relatório de posição de estoque')}
            </div>
        `;
    }
};

// Exportar para uso em outros arquivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PDFTemplates;
}
