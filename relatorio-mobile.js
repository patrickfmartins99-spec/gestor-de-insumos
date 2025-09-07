// relatorio-mobile.js - Sistema otimizado para mobile
const RelatorioMobile = {
    gerarRelatorio: function(contagem, insumos) {
        // Verificar se é mobile
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        const janela = window.open('', '_blank');
        if (!janela) {
            alert('Permita pop-ups para visualizar o relatório.');
            return null;
        }

        // Gerar dados CSV
        const generateCSV = () => {
            let csv = 'Insumo,Unidade,Estoque,Desceu,Linha Montagem,Sobrou,Posição Final,Status\n';
            
            Object.entries(contagem.detalhesContagem).forEach(([insumoId, dados]) => {
                const insumo = insumos.find(i => i.id === insumoId) || { nome: 'Desconhecido', unidade: 'N/A' };
                const status = dados.sobrou <= CONFIG.estoqueCritico ? 'CRÍTICO' :
                              dados.sobrou <= CONFIG.estoqueBaixo ? 'BAIXO' : 'NORMAL';
                
                csv += `"${insumo.nome}","${insumo.unidade}",${dados.estoque},${dados.desceu},${dados.linhaMontagem},${dados.sobrou},${dados.posicaoFinal},${status}\n`;
            });

            return csv;
        };

        // CSS otimizado para mobile e impressão
        const estilo = `
            <style>
                * { 
                    box-sizing: border-box; 
                    -webkit-text-size-adjust: 100%; 
                }
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                    margin: 0; 
                    padding: 15px; 
                    background: white;
                    font-size: ${isMobile ? '14px' : '16px'};
                    line-height: 1.4;
                    color: #2c3e50;
                }
                .container { 
                    max-width: 100%; 
                    overflow-x: hidden; 
                }
                .header {
                    text-align: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #3498db;
                }
                h1 { 
                    color: #2c3e50; 
                    font-size: ${isMobile ? '20px' : '24px'};
                    margin: 0 0 10px 0;
                    font-weight: bold;
                }
                .subtitle {
                    color: #7f8c8d;
                    font-size: ${isMobile ? '14px' : '16px'};
                    margin: 0;
                }
                .info-box {
                    background: #f8f9fa;
                    padding: 12px;
                    border-radius: 8px;
                    margin: 0 0 20px 0;
                    border-left: 4px solid #3498db;
                    font-size: ${isMobile ? '12px' : '14px'};
                }
                .table-container {
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                    margin: 0 0 20px 0;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    min-width: ${isMobile ? '600px' : '100%'};
                    font-size: ${isMobile ? '12px' : '14px'};
                }
                th, td {
                    padding: ${isMobile ? '8px 6px' : '10px 8px'};
                    text-align: left;
                    border-bottom: 1px solid #eee;
                }
                th {
                    background: #2c3e50;
                    color: white;
                    font-weight: 600;
                    position: ${isMobile ? 'sticky' : 'static'};
                    left: 0;
                    white-space: nowrap;
                }
                .critico { background: #ff6b6b; color: white; }
                .baixo { background: #ffeaa7; color: #856404; }
                .normal { background: #d9ead3; color: #155724; }
                .botoes {
                    display: flex;
                    gap: 10px;
                    margin: 25px 0 15px 0;
                    flex-wrap: wrap;
                    justify-content: center;
                }
                .btn {
                    flex: 1;
                    min-width: 140px;
                    padding: 15px 20px;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-align: center;
                    -webkit-tap-highlight-color: transparent;
                }
                .btn:active {
                    transform: scale(0.98);
                }
                .btn-print {
                    background: #3498db;
                    color: white;
                }
                .btn-close {
                    background: #e74c3c;
                    color: white;
                }
                .btn-csv {
                    background: #27ae60;
                    color: white;
                }
                .status-badge {
                    display: inline-block;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: bold;
                    margin-left: 5px;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 15px;
                    border-top: 1px solid #bdc3c7;
                    color: #7f8c8d;
                    font-size: 12px;
                }
                @media (max-width: 480px) {
                    body { padding: 10px; }
                    .btn { min-width: 120px; padding: 12px 15px; }
                    table { font-size: 11px; }
                    .info-box { font-size: 11px; }
                }
                @media print {
                    .botoes, .no-print { display: none !important; }
                    body { padding: 5px; margin: 0; }
                    .table-container { overflow: visible; border: none; }
                    table { min-width: 100%; font-size: 10px; }
                    .header { border-bottom: 2px solid #000; }
                    .info-box { border-left: 4px solid #000; }
                }
            </style>
        `;

        // Gerar tabela
        let tabela = '';
        Object.entries(contagem.detalhesContagem).forEach(([insumoId, dados]) => {
            const insumo = insumos.find(i => i.id === insumoId) || { nome: 'Desconhecido', unidade: 'N/A' };
            
            let statusClass = 'normal';
            let statusText = 'NORMAL';
            
            if (dados.sobrou <= CONFIG.estoqueCritico) {
                statusClass = 'critico';
                statusText = 'CRÍTICO';
            } else if (dados.sobrou <= CONFIG.estoqueBaixo) {
                statusClass = 'baixo';
                statusText = 'BAIXO';
            }

            tabela += `
                <tr class="${statusClass}">
                    <td>${insumo.nome}</td>
                    <td>${insumo.unidade}</td>
                    <td>${dados.estoque}</td>
                    <td>${dados.desceu}</td>
                    <td>${dados.linhaMontagem}</td>
                    <td><strong>${dados.sobrou}</strong></td>
                    <td><strong>${dados.posicaoFinal}</strong></td>
                    <td><span class="status-badge">${statusText}</span></td>
                </tr>
            `;
        });

        // HTML final
        janela.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
                <title>Relatório de Contagem - La Giovana's</title>
                ${estilo}
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🍕 La Giovana's Pizzaria</h1>
                        <p class="subtitle">Relatório de Contagem de Insumos</p>
                    </div>
                    
                    <div class="info-box">
                        <strong>Data:</strong> ${Utils.formatarData(contagem.data)}<br>
                        <strong>Responsável:</strong> ${contagem.responsavel}<br>
                        <strong>Total de Itens:</strong> ${Object.keys(contagem.detalhesContagem).length}
                    </div>

                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Insumo</th>
                                    <th>Unid.</th>
                                    <th>Estoque</th>
                                    <th>Desceu</th>
                                    <th>Linha</th>
                                    <th>Sobrou</th>
                                    <th>Pos. Final</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>${tabela}</tbody>
                        </table>
                    </div>

                    <div class="botoes no-print">
                        <button class="btn btn-print" onclick="window.print()">
                            🖨️ Imprimir
                        </button>
                        <button class="btn btn-csv" onclick="exportarCSV()">
                            📥 Exportar CSV
                        </button>
                        <button class="btn btn-close" onclick="window.close()">
                            ❌ Fechar
                        </button>
                    </div>

                    <div class="footer">
                        Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
                    </div>
                </div>

                <script>
                    // Função para exportar CSV
                    function exportarCSV() {
                        const csv = ${JSON.stringify(generateCSV())};
                        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'relatorio_contagem_${Utils.getDataAtual()}.csv';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        
                        URL.revokeObjectURL(url);
                    }

                    // Fechar com gesto (swipe down) em dispositivos móveis
                    let startY = 0;
                    document.addEventListener('touchstart', e => {
                        startY = e.touches[0].clientY;
                    });
                    
                    document.addEventListener('touchmove', e => {
                        if (startY && e.touches[0].clientY - startY > 100) {
                            window.close();
                        }
                    });

                    // Fechar com ESC
                    document.addEventListener('keydown', e => {
                        if (e.key === 'Escape') {
                            window.close();
                        }
                    });
                </script>
            </body>
            </html>
        `);
        
        janela.document.close();
        return janela;
    }
};

// Adicionar ao escopo global para fácil acesso
if (typeof window !== 'undefined') {
    window.RelatorioMobile = RelatorioMobile;
}
