// Lógica para a página de Contagem de Insumos (index.html)

document.addEventListener('DOMContentLoaded', () => {
    const formContagem = document.getElementById('formContagem');
    const listaInsumosDiv = document.getElementById('listaInsumos');

    // Função para renderizar os insumos no formulário de contagem
    const renderizarInsumosContagem = () => {
        console.log('🔄 Renderizando insumos para contagem...');
        const insumos = StorageManager.getInsumos();
        const ultimaContagem = StorageManager.getUltimaContagem();
        
        listaInsumosDiv.innerHTML = '';

        if (!insumos || insumos.length === 0) {
            listaInsumosDiv.innerHTML = '<p class="text-center text-muted">Nenhum insumo cadastrado. Vá para "Gerenciar Insumos" para adicionar.</p>';
            console.log('⚠️ Nenhum insumo para contagem');
            return;
        }

        insumos.forEach(insumo => {
            const insumoDiv = document.createElement('div');
            insumoDiv.classList.add('insumo-item', 'border', 'p-3', 'rounded', 'mb-3');
            insumoDiv.dataset.id = insumo.id;

            const ultimoSobrou = ultimaContagem?.detalhesContagem?.[insumo.id]?.sobrou || 0;
            const estoqueInicial = ultimoSobrou;
            
            const ultimaPosicaoClass = Utils.isEstoqueBaixo(ultimoSobrou) ? 'text-danger fw-bold' : '';

            insumoDiv.innerHTML = `
                <h5 class="insumo-nome">${insumo.nome} <span class="badge bg-primary ms-2">${insumo.unidade}</span></h5>
                <p class="text-muted small mb-2">Último Sobrou: <span class="${ultimaPosicaoClass}">${ultimoSobrou}</span></p>
                <div class="row g-2 align-items-end">
                    <div class="col-6 col-md-3">
                        <label class="form-label">Estoque</label>
                        <input type="number" step="0.01" min="0" class="form-control form-control-sm" data-campo="estoque" placeholder="Qtd. Estoque" value="${estoqueInicial}">
                    </div>
                    <div class="col-6 col-md-3">
                        <label class="form-label">Desceu</label>
                        <input type="number" step="0.01" min="0" class="form-control form-control-sm" data-campo="desceu" placeholder="Qtd. Desceu" value="0">
                    </div>
                    <div class="col-6 col-md-3">
                        <label class="form-label">Linha Montagem</label>
                        <input type="number" step="0.01" min="0" class="form-control form-control-sm" data-campo="linhaMontagem" placeholder="Qtd. Linha" value="0">
                    </div>
                    <div class="col-6 col-md-3 d-flex flex-column justify-content-end">
                        <label class="form-label">Sobrou</label>
                        <p class="mb-0 fw-bold fs-4 text-success" data-campo="sobrou">0</p>
                    </div>
                </div>
                <div class="row g-2 mt-2">
                    <div class="col-6 col-md-6">
                        <label class="form-label">Posição Final</label>
                        <p class="mb-0 fw-bold fs-4 text-primary" data-campo="posicaoFinal">0</p>
                    </div>
                </div>
            `;
            listaInsumosDiv.appendChild(insumoDiv);
            calcularValoresInsumo(insumoDiv);
            
            const inputs = insumoDiv.querySelectorAll('input[type="number"]');
            inputs.forEach(input => {
                input.addEventListener('input', () => calcularValoresInsumo(insumoDiv));
                input.addEventListener('blur', (e) => {
                    if (e.target.value < 0) e.target.value = 0;
                    calcularValoresInsumo(insumoDiv);
                });
            });
        });
        
        console.log('✅ Insumos para contagem renderizados:', insumos.length, 'itens');
    };

    // Função para calcular os valores com base nos inputs do usuário
    const calcularValoresInsumo = (insumoDiv) => {
        const estoque = parseFloat(insumoDiv.querySelector('[data-campo="estoque"]').value) || 0;
        const desceu = parseFloat(insumoDiv.querySelector('[data-campo="desceu"]').value) || 0;
        const linhaMontagem = parseFloat(insumoDiv.querySelector('[data-campo="linhaMontagem"]').value) || 0;
        
        const sobrou = estoque - desceu;
        const posicaoFinal = sobrou + linhaMontagem;
        
        insumoDiv.querySelector('[data-campo="sobrou"]').textContent = sobrou.toFixed(2);
        insumoDiv.querySelector('[data-campo="posicaoFinal"]').textContent = posicaoFinal.toFixed(2);
        
        insumoDiv.querySelector('[data-campo="sobrou"]').className = 
            `mb-0 fw-bold fs-4 ${Utils.isEstoqueBaixo(sobrou) ? 'text-danger' : 'text-success'}`;
        
        insumoDiv.querySelector('[data-campo="posicaoFinal"]').className = 
            `mb-0 fw-bold fs-4 ${Utils.isEstoqueBaixo(posicaoFinal) ? 'text-danger' : 'text-primary'}`;
    };

    // Lógica para submissão do formulário de contagem
    formContagem.addEventListener('submit', (event) => {
        event.preventDefault();
        
        const responsavel = document.getElementById('responsavel').value.trim();
        const dataContagem = document.getElementById('dataContagem').value;

        if (!responsavel || !dataContagem) {
            Utils.mostrarNotificacao('Por favor, preencha o nome do responsável e a data da contagem.', 'warning');
            return;
        }

        const detalhesContagem = {};
        const insumosNaTela = document.querySelectorAll('.insumo-item');
        let temDados = false;

        insumosNaTela.forEach(insumoDiv => {
            const id = insumoDiv.dataset.id;
            const estoque = parseFloat(insumoDiv.querySelector('[data-campo="estoque"]').value) || 0;
            const desceu = parseFloat(insumoDiv.querySelector('[data-campo="desceu"]').value) || 0;
            const linhaMontagem = parseFloat(insumoDiv.querySelector('[data-campo="linhaMontagem"]').value) || 0;
            const sobrou = estoque - desceu;
            const posicaoFinal = sobrou + linhaMontagem;

            detalhesContagem[id] = { 
                estoque, 
                desceu, 
                linhaMontagem, 
                sobrou, 
                posicaoFinal
            };

            if (estoque > 0 || desceu > 0 || linhaMontagem > 0) {
                temDados = true;
            }
        });

        if (!temDados) {
            Utils.mostrarNotificacao('Nenhum insumo foi contado. Por favor, adicione insumos antes de salvar.', 'warning');
            return;
        }

        const novaContagem = {
            id: `contagem-${Date.now()}`,
            data: dataContagem,
            responsavel: responsavel,
            detalhesContagem
        };

        if (StorageManager.setUltimaContagem(novaContagem) && StorageManager.saveHistoricoContagens(novaContagem)) {
            // Chama a nova função global para gerar o PDF
            RelatorioPDF.gerarPDF(novaContagem, 'contagem', 'Relatorio_Contagem');
            formContagem.reset();
            renderizarInsumosContagem();
            Utils.mostrarNotificacao('Contagem salva e relatório gerado com sucesso!', 'success');
        }
    });

    // Preencher data atual por padrão
    document.getElementById('dataContagem')?.setAttribute('value', Utils.getDataAtual());
    renderizarInsumosContagem();
});
