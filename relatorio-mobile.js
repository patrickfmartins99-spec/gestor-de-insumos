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

        // Função para formatar números inteligentemente (sem .00 desnecessários)
        const formatarNumeroInteligente = (numero) => {
            const num = parseFloat(numero);
            if (isNaN(num)) return '0';
            
            // Se for número inteiro, remove decimais
            if (num % 1 === 0) {
                return num.toString();
            }
            // Se tiver decimais, mantém 2 casas
            return num.toFixed(2);
        };

        // Gerar dados CSV
        const generateCSV = () => {
            let csv = 'Insumo,Unidade,Estoque,Desceu,Linha Montagem,Sobrou,Posição Final,Status\n';
            
            Object.entries(contagem.detalhesContagem).forEach(([insumoId, dados]) => {
                const insumo = insumos.find(i => i.id === insumoId) || { nome: 'Desconhecido', unidade: 'N/A' };
                const status = dados.sobrou <= CONFIG.estoqueCritico ? 'CRÍTICO' :
                              dados.sobrou <= CONFIG.estoqueBaixo ? 'BAIXO' : 'NORMAL';
                
                csv += `"${insumo.nome}","${insumo.unidade}",${formatarNumeroInteligente(dados.estoque)},${formatarNumeroInteligente(dados.desceu)},${formatarNumeroInteligente(dados.linhaMontagem)},${formatarNumeroInteligente(dados.sobrou)},${formatarNumeroInteligente(dados.posicaoFinal)},${status}\n`;
            });

            return csv;
        };

        // CSS otimizado para mobile com fontes maiores
        const estilo = `
            <style>
                * { 
                    box-sizing: border-box; 
                    -webkit-text-size-adjust: 100%; 
                }
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                    margin: 0; 
                    padding: 20px; 
                    background: white;
                    font-size: 16px;
                    line-height: 1.6;
                    color: #2c3e50;
                }
                .container { 
                    max-width: 100%; 
                    overflow-x: hidden; 
                }
                .header {
                    text-align: center;
                    margin-bottom: 25px;
                    padding-bottom: 15px;
                    border-bottom: 3px solid #e74c3c;
                }
                h1 { 
                    color: #2c3e50; 
                    font-size: 24px;
                    margin: 0 0 10px 0;
                    font-weight: bold;
                }
                .subtitle {
                    color: #7f8c8d;
                    font-size: 16px;
                    margin: 0;
                    font-weight: 500;
                }
                .info-box {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 10px;
                    margin: 0 0 25px 0;
                    border-left: 5px solid #3498db;
                    font-size: 15px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .table-container {
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                    margin: 0 0 25px 0;
                    border: 2px solid #ddd;
                    border-radius: 10px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    min-width: 700px;
                    font-size: 15px;
                }
                th, td {
                    padding: 14px 10px;
                    text-align: left;
                    border-bottom: 2px solid #eee;
                }
                th {
                    background: #2c3e50;
                    color: white;
                    font-weight: 600;
                    font-size: 15px;
                    position: sticky;
                    left: 0;
                    white-space: nowrap;
                }
                .critico { 
                    background: #ff4444 !important; 
                    color: white !important;
                    font-weight: bold;
                }
                .baixo { 
                    background: #ffcc00 !important; 
                    color: #333 !important;
                    font-weight: bold;
                }
                .normal { 
                    background: #d4edda !important;
                }
                .botoes {
                    display: flex;
                    gap: 12px;
                    margin: 30px 0 20px 0;
                    flex-wrap: wrap;
                    justify-content: center;
                }
                .btn {
                    flex: 1;
                    min-width: 160px;
                    padding: 16px 24px;
                    border: none;
                    border-radius: 10px;
                    font-weight: 600;
                    font-size: 17px;
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
                    padding: 6px 12px;
                    border-radius: 15px;
                    font-size: 13px;
                    font-weight: bold;
                    margin-left: 8px;
                }
                .destaque {
                    font-weight: bold;
                    font-size: 16px;
                }
                .footer {
                    text-align: center;
                    margin-top: 35px;
                    padding-top: 20px;
                    border-top: 2px solid #bdc3c7;
                    color: #7f8c8d;
                    font-size: 14px;
                }
                @media (max-width: 480px) {
                    body { padding: 15px; font-size: 15px; }
                    .btn { min-width: 140px; padding: 14px 18px; font-size: 16px; }
                    table { font-size: 14px; }
                    th, td { padding: 12px 8px; }
                    .info-box { font-size: 14px; padding: 12px; }
                }
                @media print {
                    .botoes, .no-print { display: none !important; }
                    body { 
                        padding: 15px; 
                        margin: 0; 
                        font-size: 14pt !important;
                    }
                    .table-container { overflow: visible; border: none; }
                    table { 
                        min-width: 100%; 
                        font-size: 12pt !important;
                    }
                    th, td {
                        padding: 10pt 8pt !important;
                        font-size: 11pt !important;
                    }
                    .header { border-bottom: 2px solid #000; }
                    .info-box { 
                        border-left: 4px solid #000;
                        font-size: 12pt !important;
                    }
                    .destaque { font-size: 13pt !important; }
                }
            </style>
        `;

        // Gerar tabela com números formatados
        let tabela = '';
        Object.entries(contagem.detalhesContagem).forEach(([insumoId, dados]) => {
            const insumo = insumos.find(i => i.id === insumoId) || { nome: 'Desconhecido', unidade: 'N/A' };
            
            let statusClass = 'normal';
            let statusText = 'NORMAL';
            let statusIcon = '✅';
            
            if (dados.sobrou <= CONFIG.estoqueCritico) {
                statusClass = 'critico';
                statusText = 'CRÍTICO';
                statusIcon = '🚫';
            } else if (dados.sobrou <= CONFIG.estoqueBaixo) {
                statusClass = 'baixo';
                statusText = 'BAIXO';
                statusIcon = '⚠️';
            }

            tabela += `
                <tr class="${statusClass}">
                    <td><strong>${insumo.nome}</strong></td>
                    <td>${insumo.unidade}</td>
                    <td>${formatarNumeroInteligente(dados.estoque)}</td>
                    <td>${formatarNumeroInteligente(dados.desceu)}</td>
                    <td>${formatarNumeroInteligente(dados.linhaMontagem)}</td>
                    <td class="destaque">${formatarNumeroInteligente(dados.sobrou)}</td>
                    <td class="destaque">${formatarNumeroInteligente(dados.posicaoFinal)}</td>
                    <td><span class="status-badge">${statusIcon} ${statusText}</span></td>
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
                        <strong>📅 Data:</strong> ${Utils.formatarData(contagem.data)}<br>
                        <strong>👤 Responsável:</strong> ${contagem.responsavel}<br>
                        <strong>📊 Total de Itens:</strong> ${Object.keys(contagem.detalhesContagem).length}
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
