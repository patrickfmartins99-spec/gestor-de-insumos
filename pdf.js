// ===== GERADOR DE RELATÓRIOS PDF =====
// Arquivo: pdf.js
// Lógica de geração e exportação de PDFs

const RelatorioPDF = {
    // Configurações padrão para os PDFs
    config: {
        margin: [10, 10, 10, 10], // [top, right, bottom, left] em mm
        filename: 'relatorio_insumos.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: 1200 // Largura fixa para consistência
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait' 
        }
    },

    // Função para gerar HTML do relatório de contagem
    gerarHtmlContagem: (contagem, insumos) => {
        console.log('📊 Gerando HTML para relatório de contagem...');
        
        try {
            // Usar o template específico para contagem
            const html = PDFTemplates.relatorioContagem(contagem, insumos);
            console.log('✅ HTML de contagem gerado com sucesso');
            return html;
        } catch (error) {
            console.error('❌ Erro ao gerar HTML de contagem:', error);
            return RelatorioPDF.gerarHtmlContagemFallback(contagem, insumos);
        }
    },

    // Fallback caso o template principal falhe
    gerarHtmlContagemFallback: (contagem, insumos) => {
        const dataContagemFormatada = Utils.formatarData(contagem.data);
        const dataGeracaoFormatada = Utils.formatarData(new Date());

        let tabelaRows = '';
        Object.keys(contagem.detalhesContagem).forEach(insumoId => {
            const insumoInfo = insumos.find(i => i.id === insumoId) || { nome: 'Desconhecido', unidade: 'N/A' };
            const dados = contagem.detalhesContagem[insumoId];
            
            tabelaRows += `
                <tr>
                    <td style="padding: 8px; border: 1px solid #000;">${insumoInfo.nome}</td>
                    <td style="padding: 8px; border: 1px solid #000; text-align: center;">${dados.estoque || 0}</td>
                    <td style="padding: 8px; border: 1px solid #000; text-align: center;">${dados.desceu || 0}</td>
                    <td style="padding: 8px; border: 1px solid #000; text-align: center;">${dados.linhaMontagem || 0}</td>
                    <td style="padding: 8px; border: 1px solid #000; text-align: center;">${dados.sobrou || 0}</td>
                    <td style="padding: 8px; border: 1px solid #000; text-align: center;">${dados.posicaoFinal || 0}</td>
                </tr>
            `;
        });

        return `
            <div style="font-family: Arial, sans-serif; padding: 15px; color: #000;">
                <div style="text-align: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #000;">
                    <h1 style="margin: 0; color: #000; font-size: 20px;">La Giovana's Pizzaria</h1>
                    <p style="margin: 5px 0; font-size: 16px;">Relatório de Contagem</p>
                </div>
                
                <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #ccc;">
                    <p style="margin: 3px 0; font-size: 14px;"><strong>Responsável:</strong> ${contagem.responsavel}</p>
                    <p style="margin: 3px 0; font-size: 14px;"><strong>Data:</strong> ${dataContagemFormatada}</p>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            <th style="padding: 8px; border: 1px solid #000;">Insumo</th>
                            <th style="padding: 8px; border: 1px solid #000;">Estoque</th>
                            <th style="padding: 8px; border: 1px solid #000;">Desceu</th>
                            <th style="padding: 8px; border: 1px solid #000;">Linha</th>
                            <th style="padding: 8px; border: 1px solid #000;">Sobrou</th>
                            <th style="padding: 8px; border: 1px solid #000;">Posição Final</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tabelaRows}
                    </tbody>
                </table>
                
                <div style="text-align: center; margin-top: 20px; font-size: 10px; color: #999;">
                    Gerado em ${dataGeracaoFormatada}
                </div>
            </div>
        `;
    },

    // Função para gerar HTML do relatório de estoque
    gerarHtmlEstoque: (ultimaContagem, insumos) => {
        console.log('📊 Gerando HTML para relatório de estoque...');
        
        try {
            // Usar o template específico para estoque
            const html = PDFTemplates.relatorioEstoque(ultimaContagem, insumos);
            console.log('✅ HTML de estoque gerado com sucesso');
            return html;
        } catch (error) {
            console.error('❌ Erro ao gerar HTML de estoque:', error);
            return RelatorioPDF.gerarHtmlEstoqueFallback(ultimaContagem, insumos);
        }
    },

    // Fallback para estoque
    gerarHtmlEstoqueFallback: (ultimaContagem, insumos) => {
        const dataRefFormatada = Utils.formatarData(ultimaContagem.data);
        const dataGeracaoFormatada = Utils.formatarData(new Date());

        let tabelaRows = '';
        Object.keys(ultimaContagem.detalhesContagem).forEach(insumoId => {
            const insumoInfo = insumos.find(i => i.id === insumoId) || { nome: 'Desconhecido', unidade: 'N/A' };
            const quantidade = ultimaContagem.detalhesContagem[insumoId]?.sobrou || 0;
            
            let status = 'Normal';
            let statusColor = 'green';
            
            if (quantidade <= CONFIG.estoqueCritico) {
                status = 'CRÍTICO';
                statusColor = 'red';
            } else if (quantidade <= CONFIG.estoqueBaixo) {
                status = 'Baixo';
                statusColor = 'orange';
            }

            tabelaRows += `
                <tr>
                    <td style="padding: 8px; border: 1px solid #000;">${insumoInfo.nome}</td>
                    <td style="padding: 8px; border: 1px solid #000; text-align: center;">${insumoInfo.unidade}</td>
                    <td style="padding: 8px; border: 1px solid #000; text-align: center; color: ${quantidade <= CONFIG.estoqueBaixo ? 'red' : 'black'};">${quantidade}</td>
                    <td style="padding: 8px; border: 1px solid #000; text-align: center; color: ${statusColor}; font-weight: bold;">${status}</td>
                </tr>
            `;
        });

        return `
            <div style="font-family: Arial, sans-serif; padding: 15px; color: #000;">
                <div style="text-align: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #000;">
                    <h1 style="margin: 0; color: #000; font-size: 20px;">La Giovana's Pizzaria</h1>
                    <p style="margin: 5px 0; font-size: 16px;">Relatório de Estoque</p>
                </div>
                
                <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #ccc;">
                    <p style="margin: 3px 0; font-size: 14px;"><strong>Data de Referência:</strong> ${dataRefFormatada}</p>
                    <p style="margin: 3px 0; font-size: 14px;"><strong>Total de Itens:</strong> ${Object.keys(ultimaContagem.detalhesContagem).length}</p>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            <th style="padding: 8px; border: 1px solid #000;">Insumo</th>
                            <th style="padding: 8px; border: 1px solid #000;">Unidade</th>
                            <th style="padding: 8px; border: 1px solid #000;">Estoque</th>
                            <th style="padding: 8px; border: 1px solid #000;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tabelaRows}
                    </tbody>
                </table>
                
                <div style="text-align: center; margin-top: 20px; font-size: 10px; color: #999;">
                    Gerado em ${dataGeracaoFormatada}
                </div>
            </div>
        `;
    },

    // Função principal para gerar PDF (CORRIGIDA)
    gerarPDF: (dados, tipoRelatorio, filenamePrefix = 'Relatorio') => {
        console.log(`📄 Iniciando geração de PDF: ${tipoRelatorio}`);
        
        const insumos = StorageManager.getInsumos();
        
        if (!dados || Object.keys(dados.detalhesContagem || {}).length === 0) {
            Utils.mostrarNotificacao('Não há dados para gerar o relatório.', 'warning');
            return;
        }

        let htmlConteudo = '';
        let filename = '';

        try {
            switch (tipoRelatorio) {
                case 'contagem':
                    htmlConteudo = RelatorioPDF.gerarHtmlContagem(dados, insumos);
                    filename = `${filenamePrefix}_Contagem_${Utils.getDataAtual()}.pdf`;
                    break;
                    
                case 'estoque':
                    htmlConteudo = RelatorioPDF.gerarHtmlEstoque(dados, insumos);
                    filename = `${filenamePrefix}_Estoque_${Utils.getDataAtual()}.pdf`;
                    break;
                    
                default:
                    throw new Error('Tipo de relatório não suportado');
            }

            // Configurações específicas para este PDF
            const options = {
                ...RelatorioPDF.config,
                filename: filename
            };

            // CORREÇÃO: Criar elemento temporário completamente fora da tela
            const element = document.createElement('div');
            element.style.position = 'absolute';
            element.style.left = '-9999px'; // Fora da tela
            element.style.top = '0';
            element.style.width = '210mm'; // Largura A4
            element.innerHTML = htmlConteudo;

            // Adicionar ao body mas manter invisível
            document.body.appendChild(element);

            // Gerar PDF - método correto
            html2pdf()
                .set(options)
                .from(element)
                .save()
                .then(() => {
                    console.log('✅ PDF gerado com sucesso');
                    Utils.mostrarNotificacao('PDF gerado com sucesso!', 'success');
                })
                .catch((error) => {
                    console.error('❌ Erro ao gerar PDF:', error);
                    Utils.mostrarNotificacao('Erro ao gerar PDF. Verifique o console.', 'error');
                    
                    // Fallback: tentar método alternativo
                    setTimeout(() => {
                        RelatorioPDF.tentarMetodoAlternativo(element, options);
                    }, 1000);
                })
                .finally(() => {
                    // Remover elemento temporário com delay para garantir que o PDF foi gerado
                    setTimeout(() => {
                        if (element && element.parentNode) {
                            document.body.removeChild(element);
                        }
                    }, 1000);
                });

        } catch (error) {
            console.error('❌ Erro na geração do PDF:', error);
            Utils.mostrarNotificacao('Erro ao preparar relatório.', 'error');
        }
    },

    // Método alternativo para geração de PDF
    tentarMetodoAlternativo: (element, options) => {
        console.log('🔄 Tentando método alternativo de geração de PDF...');
        
        try {
            // Método alternativo usando approach diferente
            html2pdf()
                .set(options)
                .from(element)
                .toPdf()
                .get('pdf')
                .then(function(pdf) {
                    pdf.save(options.filename);
                    Utils.mostrarNotificacao('PDF gerado com método alternativo!', 'success');
                })
                .catch(function(error) {
                    console.error('❌ Erro no método alternativo:', error);
                    Utils.mostrarNotificacao('Falha ao gerar PDF. Tente novamente.', 'error');
                });
        } catch (error) {
            console.error('❌ Erro no método alternativo:', error);
        }
    },

    // Função para visualizar PDF sem baixar (para teste)
    visualizarPDF: (dados, tipoRelatorio) => {
        const insumos = StorageManager.getInsumos();
        let htmlConteudo = '';

        switch (tipoRelatorio) {
            case 'contagem':
                htmlConteudo = RelatorioPDF.gerarHtmlContagem(dados, insumos);
                break;
            case 'estoque':
                htmlConteudo = RelatorioPDF.gerarHtmlEstoque(dados, insumos);
                break;
        }

        // Abrir em nova janela para visualização
        const janela = window.open('', '_blank');
        janela.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Visualização de Relatório</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    @media print {
                        body { padding: 0; margin: 0; }
                    }
                </style>
            </head>
            <body>
                ${htmlConteudo}
                <div style="margin-top: 20px; text-align: center;">
                    <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Imprimir
                    </button>
                    <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
                        Fechar
                    </button>
                </div>
            </body>
            </html>
        `);
        janela.document.close();
    },

    // Função de teste para desenvolvimento
    testarGeracaoPDF: () => {
        console.log('🧪 Testando geração de PDF...');
        
        const contagemTeste = {
            id: 'teste-' + Date.now(),
            responsavel: 'Usuário Teste',
            data: new Date().toISOString().split('T')[0],
            detalhesContagem: {
                'insumo-4queijos': {
                    estoque: 50,
                    desceu: 20,
                    linhaMontagem: 5,
                    sobrou: 30,
                    posicaoFinal: 35
                },
                'insumo-calabresa': {
                    estoque: 30,
                    desceu: 15,
                    linhaMontagem: 3,
                    sobrou: 15,
                    posicaoFinal: 18
                }
            }
        };

        RelatorioPDF.gerarPDF(contagemTeste, 'contagem', 'Teste');
    },

    // Nova função: gerar PDF com opções customizadas
    gerarPDFComOpcoes: (dados, tipoRelatorio, options = {}) => {
        const opcoesPadrao = {
            margin: [10, 10, 10, 10],
            filename: `relatorio_${Utils.getDataAtual()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        const opcoesFinais = { ...opcoesPadrao, ...options };
        RelatorioPDF.gerarPDF(dados, tipoRelatorio, opcoesFinais);
    }
};

// Adicionar função global para teste
window.testarPDF = RelatorioPDF.testarGeracaoPDF;
window.visualizarPDF = RelatorioPDF.visualizarPDF;
window.gerarPDFCustom = RelatorioPDF.gerarPDFComOpcoes;

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 Módulo de PDF carregado');
    
    // Verificar se html2pdf está carregado
    if (typeof html2pdf === 'undefined') {
        console.error('❌ html2pdf.js não está carregado!');
        Utils.mostrarNotificacao('Erro: Biblioteca de PDF não carregada. Recarregue a página.', 'error');
    } else {
        console.log('✅ html2pdf.js carregado com sucesso');
    }
});
