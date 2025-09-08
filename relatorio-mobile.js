// relatorio-mobile.js - Versão profissional e sóbria
const RelatorioMobile = {
    gerarRelatorio: function(contagem, insumos) {
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        const janela = window.open('', '_blank');
        if (!janela) {
            alert('Permita pop-ups para visualizar o relatório.');
            return null;
        }

        // Função para formatar números inteligentemente
        const formatarNumeroInteligente = (numero) => {
            const num = parseFloat(numero);
            if (isNaN(num)) return '0';
            if (num % 1 === 0) return num.toString();
            return num.toFixed(2);
        };

        // CSS profissional e sóbrio
        const estilo = `
            <style>
                * { 
                    box-sizing: border-box; 
                    -webkit-text-size-adjust: 100%; 
                }
                body { 
                    font-family: 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
                    margin: 0; 
                    padding: 25px; 
                    background: white;
                    font-size: 14px;
                    line-height: 1.5;
                    color: #2c3e50;
                }
                .container { 
                    max-width: 100%; 
                    margin: 0 auto;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #2c3e50;
                }
                h1 { 
                    color: #2c3e50; 
                    font-size: 22px;
                    margin: 0 0 5px 0;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                }
                .subtitle {
                    color: #7f8c8d;
                    font-size: 14px;
                    margin: 0;
                    font-weight: 400;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .info-box {
                    background: #f8f9fa;
                    padding: 20px;
                    margin: 0 0 30px 0;
                    border-left: 4px solid #2c3e50;
                    font-size: 14px;
                    border-radius: 2px;
                }
                .info-box strong {
                    color: #2c3e50;
                    font-weight: 600;
                }
                .table-container {
                    overflow-x: auto;
                    margin: 0 0 30px 0;
                    border: 1px solid #ddd;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    min-width: 800px;
                    font-size: 13px;
                }
                th, td {
                    padding: 12px 10px;
                    text-align: left;
                    border-bottom: 1px solid #eee;
                }
                th {
                    background: #2c3e50;
                    color: white;
                    font-weight: 600;
                    font-size: 13px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    border: none;
                }
                .critico { 
                    background: #fff5f5; 
                    color: #c0392b;
                    font-weight: 600;
                }
                .baixo { 
                    background: #fffbf0; 
                    color: #d35400;
                }
                .normal { 
                    background: #f8f9fa;
                }
                .status {
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    padding: 4px 8px;
                    border-radius: 3px;
                    display: inline-block;
                }
                .status-critico {
                    background: #c0392b;
                    color: white;
                }
                .status-baixo {
                    background: #f39c12;
                    color: white;
                }
                .status-normal {
                    background: #27ae60;
                    color: white;
                }
                .botoes {
                    display: flex;
                    gap: 15px;
                    margin: 40px 0 20px 0;
                    justify-content: center;
                }
                .btn {
                    padding: 12px 25px;
                    border: 1px solid #2c3e50;
                    border-radius: 3px;
                    font-weight: 600;
                    font-size: 14px;
                    cursor: pointer;
                    background: white;
                    color: #2c3e50;
                    transition: all 0.2s ease;
                    text-decoration: none;
                    display: inline-block;
                }
                .btn:hover {
                    background: #2c3e50;
                    color: white;
                }
                .footer {
                    text-align: center;
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    color: #7f8c8d;
                    font-size: 12px;
                }
                .destaque {
                    font-weight: 600;
                    font-size: 14px;
                }
                @media (max-width: 768px) {
                    body { padding: 20px; }
                    .btn { padding: 10px 20px; }
                }
                @media print {
                    .botoes { display: none !important; }
                    body { 
                        padding: 15mm; 
                        font-size: 12pt !important;
                    }
                    table { font-size: 11pt !important; }
                    th, td { padding: 8pt 6pt !important; }
                    .header { border-bottom: 1px solid #000; }
                    .info-box { border-left: 3px solid #000; }
                }
            </style>
        `;

        // Gerar tabela profissional
        let tabela = '';
        Object.entries(contagem.detalhesContagem).forEach(([insumoId, dados]) => {
            const insumo = insumos.find(i => i.id === insumoId) || { nome: 'Desconhecido', unidade: 'N/A' };
            
            let statusClass = 'normal';
            let statusText = 'NORMAL';
            let statusBadgeClass = 'status-normal';
            
            if (dados.sobrou <= CONFIG.estoqueCritico) {
                statusClass = 'critico';
                statusText = 'CRÍTICO';
                statusBadgeClass = 'status-critico';
            } else if (dados.sobrou <= CONFIG.estoqueBaixo) {
                statusClass = 'baixo';
                statusText = 'BAIXO';
                statusBadgeClass = 'status-baixo';
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
                    <td><span class="status ${statusBadgeClass}">${statusText}</span></td>
                </tr>
            `;
        });

        // HTML final profissional
        janela.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Relatório de Estoque - La Giovana's</title>
                ${estilo}
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>LA GIOVANA'S PIZZARIA</h1>
                        <p class="subtitle">Relatório de Contagem de Estoque</p>
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
                        <button class="btn" onclick="window.print()">Imprimir</button>
                        <button class="btn" onclick="exportarCSV()">Exportar CSV</button>
                        <button class="btn" onclick="window.close()">Fechar</button>
                    </div>

                    <div class="footer">
                        Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}
                    </div>
                </div>

                <script>
                    function exportarCSV() {
                        const csv = 'Insumo,Unidade,Estoque,Desceu,Linha Montagem,Sobrou,Posição Final,Status\\n' +
                            ${JSON.stringify(
                                Object.entries(contagem.detalhesContagem).map(([insumoId, dados]) => {
                                    const insumo = insumos.find(i => i.id === insumoId) || { nome: 'Desconhecido', unidade: 'N/A' };
                                    const status = dados.sobrou <= CONFIG.estoqueCritico ? 'CRÍTICO' :
                                                dados.sobrou <= CONFIG.estoqueBaixo ? 'BAIXO' : 'NORMAL';
                                    return `"${insumo.nome}","${insumo.unidade}",${formatarNumeroInteligente(dados.estoque)},${formatarNumeroInteligente(dados.desceu)},${formatarNumeroInteligente(dados.linhaMontagem)},${formatarNumeroInteligente(dados.sobrou)},${formatarNumeroInteligente(dados.posicaoFinal)},${status}"`;
                                }).join('\\n')
                            )};
                        
                        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'estoque_${Utils.getDataAtual()}.csv';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    }
                </script>
            </body>
            </html>
        `);
        
        janela.document.close();
        return janela;
    }
};

if (typeof window !== 'undefined') {
    window.RelatorioMobile = RelatorioMobile;
}
