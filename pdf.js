// ===== GERADOR DE RELATÓRIOS PDF =====
// Arquivo: pdf.js
// Lógica de geração e exportação de PDFs

const RelatorioPDF = {
    // Configurações padrão para os PDFs
    config: {
        margin: [10, 10, 10, 10],
        filename: 'relatorio_insumos.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            width: 794, // Largura fixa para A4 em pixels (210mm * 3.78)
            windowWidth: 794
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait' 
        }
    },

    // Função para gerar HTML do relatório de contagem
    gerarHtmlContagem: (contagem, insumos) => {
        try {
            return PDFTemplates.relatorioContagem(contagem, insumos);
        } catch (error) {
            console.error('Erro ao gerar HTML de contagem:', error);
            return RelatorioPDF.gerarHtmlContagemFallback(contagem, insumos);
        }
    },

    // Fallback para contagem
    gerarHtmlContagemFallback: (contagem, insumos) => {
        const dataContagemFormatada = Utils.formatarData(contagem.data);
        
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
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #000;">
                <div style="text-align: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #000;">
                    <h1 style="margin: 0; color: #000; font-size: 24px;">La Giovana's Pizzaria</h1>
                    <p style="margin: 5px 0; font-size: 18px;">Relatório de Contagem</p>
                </div>
                
                <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ccc; background: #f9f9f9;">
                    <p style="margin: 5px 0; font-size: 16px;"><strong>Responsável:</strong> ${contagem.responsavel}</p>
                    <p style="margin: 5px 0; font-size: 16px;"><strong>Data:</strong> ${dataContagemFormatada}</p>
                    <p style="margin: 5px 0; font-size: 14px; color: #666;"><strong>ID:</strong> ${contagem.id}</p>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 15px;">
                    <thead>
                        <tr style="background-color: #2c3e50; color: white;">
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
                
                <div style="text-align: center; margin-top: 25px; font-size: 12px; color: #999;">
                    Gerado em ${new Date().toLocaleDateString('pt-BR')}
                </div>
            </div>
        `;
    },

    // Função para gerar HTML do relatório de estoque
    gerarHtmlEstoque: (ultimaContagem, insumos) => {
        try {
            return PDFTemplates.relatorioEstoque(ultimaContagem, insumos);
        } catch (error) {
            console.error('Erro ao gerar HTML de estoque:', error);
            return RelatorioPDF.gerarHtmlEstoqueFallback(ultimaContagem, insumos);
        }
    },

    // Função principal para gerar PDF (VERSÃO CORRIGIDA)
    gerarPDF: (dados, tipoRelatorio, filenamePrefix = 'Relatorio') => {
        console.log('📄 Iniciando geração de PDF...');
        
        const insumos = StorageManager.getInsumos();
        
        if (!dados || Object.keys(dados.detalhesContagem || {}).length === 0) {
            Utils.mostrarNotificacao('Não há dados para gerar o relatório.', 'warning');
            return false;
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

            // Configurações
            const options = {
                ...RelatorioPDF.config,
                filename: filename
            };

            // Método 1: Usando div temporária (approach mais confiável)
            const element = document.createElement('div');
            element.innerHTML = htmlConteudo;
            
            // Estilo para garantir que não interfere com a página
            element.style.position = 'fixed';
            element.style.left = '0';
            element.style.top = '0';
            element.style.zIndex = '-1000';
            element.style.opacity = '0';
            element.style.pointerEvents = 'none';
            element.style.width = '210mm';
            element.style.minHeight = '297mm';
            
            document.body.appendChild(element);

            // Gerar PDF
            return new Promise((resolve) => {
                html2pdf()
                    .set(options)
                    .from(element)
                    .save()
                    .then(() => {
                        console.log('✅ PDF gerado com sucesso');
                        Utils.mostrarNotificacao('PDF gerado com sucesso!', 'success');
                        resolve(true);
                    })
                    .catch((error) => {
                        console.error('❌ Erro ao gerar PDF:', error);
                        
                        // Tentar método alternativo
                        RelatorioPDF.tentarMetodoAlternativo(htmlConteudo, filename)
                            .then(success => {
                                if (success) {
                                    resolve(true);
                                } else {
                                    Utils.mostrarNotificacao('Erro ao gerar PDF. Tente novamente.', 'error');
                                    resolve(false);
                                }
                            });
                    })
                    .finally(() => {
                        // Remover elemento com delay
                        setTimeout(() => {
                            if (element.parentNode) {
                                document.body.removeChild(element);
                            }
                        }, 3000);
                    });
            });

        } catch (error) {
            console.error('❌ Erro na geração do PDF:', error);
            Utils.mostrarNotificacao('Erro ao preparar relatório.', 'error');
            return false;
        }
    },

    // Método alternativo mais robusto
    tentarMetodoAlternativo: (htmlConteudo, filename) => {
        return new Promise((resolve) => {
            console.log('🔄 Tentando método alternativo...');
            
            try {
                // Criar iframe para isolamento completo
                const iframe = document.createElement('iframe');
                iframe.style.position = 'fixed';
                iframe.style.left = '-9999px';
                iframe.style.top = '0';
                iframe.style.width = '210mm';
                iframe.style.height = '297mm';
                iframe.style.border = 'none';
                
                document.body.appendChild(iframe);
                
                iframe.onload = function() {
                    const doc = iframe.contentDocument || iframe.contentWindow.document;
                    doc.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="UTF-8">
                            <style>
                                body { 
                                    margin: 0; 
                                    padding: 20px; 
                                    font-family: Arial, sans-serif;
                                    width: 210mm;
                                }
                                @media print {
                                    body { padding: 0; }
                                }
                            </style>
                        </head>
                        <body>
                            ${htmlConteudo}
                        </body>
                        </html>
                    `);
                    doc.close();
                    
                    // Usar html2pdf dentro do iframe
                    const iframeWindow = iframe.contentWindow;
                    
                    iframeWindow.html2pdf()
                        .set({
                            margin: [10, 10, 10, 10],
                            filename: filename,
                            image: { type: 'jpeg', quality: 0.98 },
                            html2canvas: { 
                                scale: 2,
                                useCORS: true,
                                logging: false,
                                backgroundColor: '#ffffff'
                            },
                            jsPDF: { 
                                unit: 'mm', 
                                format: 'a4', 
                                orientation: 'portrait' 
                            }
                        })
                        .from(iframeWindow.document.body)
                        .save()
                        .then(() => {
                            console.log('✅ PDF gerado com método alternativo');
                            Utils.mostrarNotificacao('PDF gerado com sucesso!', 'success');
                            resolve(true);
                        })
                        .catch((error) => {
                            console.error('❌ Erro no método alternativo:', error);
                            resolve(false);
                        })
                        .finally(() => {
                            setTimeout(() => {
                                if (iframe.parentNode) {
                                    document.body.removeChild(iframe);
                                }
                            }, 3000);
                        });
                };
                
            } catch (error) {
                console.error('❌ Erro no método alternativo:', error);
                resolve(false);
            }
        });
    },

    // Função para visualização imediata (fallback)
    visualizarParaImpressao: (dados, tipoRelatorio) => {
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

        // Abrir em nova janela para impressão
        const janela = window.open('', '_blank');
        if (!janela) {
            Utils.mostrarNotificacao('Permita pop-ups para visualizar o relatório.', 'warning');
            return;
        }

        janela.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Relatório - La Giovana's</title>
                <meta charset="UTF-8">
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        padding: 30px; 
                        margin: 0;
                        background: white;
                    }
                    @media print {
                        body { padding: 15px; }
                        .no-print { display: none !important; }
                    }
                    .botoes {
                        position: fixed;
                        bottom: 20px;
                        right: 20px;
                        z-index: 1000;
                    }
                    button {
                        padding: 12px 24px;
                        margin-left: 10px;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 16px;
                    }
                    .imprimir {
                        background: #007bff;
                        color: white;
                    }
                    .fechar {
                        background: #6c757d;
                        color: white;
                    }
                </style>
            </head>
            <body>
                ${htmlConteudo}
                <div class="botoes no-print">
                    <button class="imprimir" onclick="window.print()">🖨️ Imprimir</button>
                    <button class="fechar" onclick="window.close()">❌ Fechar</button>
                </div>
            </body>
            </html>
        `);
        janela.document.close();
        
        Utils.mostrarNotificacao('Relatório aberto para impressão.', 'info');
    }
};

// Funções globais para teste
window.testarPDF = () => {
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
};

window.visualizarPDF = (tipo = 'contagem') => {
    const dados = tipo === 'estoque' ? 
        StorageManager.getUltimaContagem() : 
        StorageManager.getHistoricoContagens()[0];
    
    if (dados) {
        RelatorioPDF.visualizarParaImpressao(dados, tipo);
    } else {
        Utils.mostrarNotificacao('Nenhum dado disponível para visualização.', 'warning');
    }
};

// Verificar se a biblioteca está carregada
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (typeof html2pdf === 'undefined') {
            console.error('❌ html2pdf.js não carregado!');
            Utils.mostrarNotificacao(
                'Erro: Biblioteca de PDF não carregada. Recarregue a página.', 
                'error'
            );
        } else {
            console.log('✅ html2pdf.js carregado com sucesso');
        }
    }, 1000);
});
