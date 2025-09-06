// ===== LÓGICA PARA A PÁGINA DE CONTAGEM DE INSUMOS =====
// Arquivo: index.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('📊 Inicializando página de contagem...');
    
    const formContagem = document.getElementById('formContagem');
    const listaInsumosDiv = document.getElementById('listaInsumos');
    const responsavelInput = document.getElementById('responsavel');
    const dataContagemInput = document.getElementById('dataContagem');

    // Preencher data atual por padrão
    if (dataContagemInput) {
        dataContagemInput.value = Utils.getDataAtual();
    }

    // Função para renderizar os insumos no formulário de contagem
    const renderizarInsumosContagem = () => {
        console.log('🔄 Renderizando insumos para contagem...');
        
        const insumos = StorageManager.getInsumos();
        const ultimaContagem = StorageManager.getUltimaContagem();
        
        // Limpar container
        listaInsumosDiv.innerHTML = '';

        if (!insumos || insumos.length === 0) {
            listaInsumosDiv.innerHTML = `
                <div class="alert alert-warning text-center">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Nenhum insumo cadastrado. 
                    <a href="gerenciar.html" class="alert-link">Vá para "Gerenciar Insumos"</a> 
                    para adicionar insumos.
                </div>
            `;
            console.log('⚠️ Nenhum insumo para contagem');
            return;
        }

        // Adicionar título da seção
        const tituloSection = document.createElement('div');
        tituloSection.className = 'mb-3';
        tituloSection.innerHTML = `
            <h3 class="text-center text-muted">
                <i class="bi bi-list-check me-2"></i>Itens para Contagem
            </h3>
            <p class="text-center small text-muted">
                Total: ${insumos.length} insumos cadastrados
            </p>
        `;
        listaInsumosDiv.appendChild(tituloSection);

        // Renderizar cada insumo
        insumos.forEach(insumo => {
            const insumoDiv = document.createElement('div');
            insumoDiv.classList.add('insumo-item', 'border', 'p-3', 'rounded', 'mb-3');
            insumoDiv.dataset.id = insumo.id;
            insumoDiv.dataset.nome = insumo.nome;

            const ultimoSobrou = ultimaContagem?.detalhesContagem?.[insumo.id]?.sobrou || 0;
            const estoqueInicial = ultimoSobrou;
            
            const ultimaPosicaoClass = Utils.isEstoqueBaixo(ultimoSobrou) ? 'text-danger fw-bold' : 'text-success';

            insumoDiv.innerHTML = `
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h5 class="insumo-nome mb-0">${insumo.nome}</h5>
                    <span class="badge bg-primary">${insumo.unidade}</span>
                </div>
                
                <p class="text-muted small mb-3">
                    <i class="bi bi-info-circle me-1"></i>
                    Última posição: <span class="${ultimaPosicaoClass}">${ultimoSobrou}</span>
                </p>
                
                <div class="row g-2 align-items-end">
                    <div class="col-6 col-md-3">
                        <label class="form-label small fw-bold">Estoque</label>
                        <input type="number" step="0.01" min="0" 
                               class="form-control form-control-sm campo-numerico" 
                               data-campo="estoque" 
                               placeholder="Qtd. Estoque" 
                               value="${estoqueInicial}"
                               aria-label="Estoque de ${insumo.nome}">
                    </div>
                    
                    <div class="col-6 col-md-3">
                        <label class="form-label small fw-bold">Desceu</label>
                        <input type="number" step="0.01" min="0" 
                               class="form-control form-control-sm campo-numerico" 
                               data-campo="desceu" 
                               placeholder="Qtd. Desceu" 
                               value="0"
                               aria-label="Quantidade que desceu de ${insumo.nome}">
                    </div>
                    
                    <div class="col-6 col-md-3">
                        <label class="form-label small fw-bold">Linha Montagem</label>
                        <input type="number" step="0.01" min="0" 
                               class="form-control form-control-sm campo-numerico" 
                               data-campo="linhaMontagem" 
                               placeholder="Qtd. Linha" 
                               value="0"
                               aria-label="Quantidade na linha de montagem de ${insumo.nome}">
                    </div>
                    
                    <div class="col-6 col-md-3">
                        <div class="d-flex flex-column justify-content-end h-100">
                            <label class="form-label small fw-bold">Sobrou</label>
                            <p class="mb-0 fw-bold fs-5 text-success text-center" 
                               data-campo="sobrou"
                               aria-live="polite">0</p>
                        </div>
                    </div>
                </div>
                
                <div class="row g-2 mt-2">
                    <div class="col-12">
                        <div class="d-flex justify-content-between align-items-center">
                            <label class="form-label small fw-bold">Posição Final</label>
                            <p class="mb-0 fw-bold fs-4 text-primary" 
                               data-campo="posicaoFinal"
                               aria-live="polite">0</p>
                        </div>
                    </div>
                </div>
            `;
            
            listaInsumosDiv.appendChild(insumoDiv);
            calcularValoresInsumo(insumoDiv);
            
            // Adicionar event listeners aos inputs
            const inputs = insumoDiv.querySelectorAll('.campo-numerico');
            inputs.forEach(input => {
                input.addEventListener('input', () => calcularValoresInsumo(insumoDiv));
                input.addEventListener('blur', (e) => validarInputNumerico(e.target));
            });
        });

        console.log('✅ Insumos para contagem renderizados:', insumos.length, 'itens');
    };

    // Função para validar input numérico
    const validarInputNumerico = (input) => {
        let valor = input.value.trim();
        
        // Permitir apenas números e ponto decimal
        valor = valor.replace(/[^0-9.]/g, '');
        
        // Validar se tem mais de um ponto decimal
        const pontos = valor.split('.').length - 1;
        if (pontos > 1) {
            valor = valor.substring(0, valor.lastIndexOf('.'));
        }
        
        // Garantir valor mínimo de 0
        if (valor === '' || parseFloat(valor) < 0) {
            valor = '0';
        }
        
        // Format para 2 casas decimais se necessário
        if (valor.includes('.')) {
            const partes = valor.split('.');
            if (partes[1].length > 2) {
                valor = parseFloat(valor).toFixed(2);
            }
        }
        
        input.value = valor;
    };

    // Função para calcular os valores com base nos inputs do usuário
    const calcularValoresInsumo = (insumoDiv) => {
        const estoque = Utils.validarNumero(insumoDiv.querySelector('[data-campo="estoque"]').value);
        const desceu = Utils.validarNumero(insumoDiv.querySelector('[data-campo="desceu"]').value);
        const linhaMontagem = Utils.validarNumero(insumoDiv.querySelector('[data-campo="linhaMontagem"]').value);
        
        const sobrou = estoque - desceu;
        const posicaoFinal = sobrou + linhaMontagem;
        
        // Atualizar valores na interface
        const sobrouElement = insumoDiv.querySelector('[data-campo="sobrou"]');
        const posicaoFinalElement = insumoDiv.querySelector('[data-campo="posicaoFinal"]');
        
        sobrouElement.textContent = sobrou.toFixed(2);
        posicaoFinalElement.textContent = posicaoFinal.toFixed(2);
        
        // Aplicar estilos condicionais
        sobrouElement.className = `mb-0 fw-bold fs-5 text-center ${Utils.isEstoqueBaixo(sobrou) ? 'text-danger' : 'text-success'}`;
        posicaoFinalElement.className = `mb-0 fw-bold fs-4 ${Utils.isEstoqueBaixo(posicaoFinal) ? 'text-danger' : 'text-primary'}`;
        
        // Adicionar indicador visual para valores críticos
        if (Utils.isEstoqueBaixo(sobrou)) {
            insumoDiv.classList.add('estoque-baixo');
        } else {
            insumoDiv.classList.remove('estoque-baixo');
        }
    };

    // Função para validar o formulário antes do envio
    const validarFormulario = () => {
        const responsavel = responsavelInput.value.trim();
        const dataContagem = dataContagemInput.value;
        
        if (!responsavel) {
            Notificacoes.mostrarNotificacao('Por favor, informe o nome do responsável pela contagem.', 'warning');
            responsavelInput.focus();
            return false;
        }
        
        if (!dataContagem) {
            Notificacoes.mostrarNotificacao('Por favor, selecione a data da contagem.', 'warning');
            dataContagemInput.focus();
            return false;
        }
        
        return true;
    };

    // Função para coletar dados da contagem
    const coletarDadosContagem = () => {
        const detalhesContagem = {};
        const insumosNaTela = document.querySelectorAll('.insumo-item');
        let temDados = false;

        insumosNaTela.forEach(insumoDiv => {
            const id = insumoDiv.dataset.id;
            const nome = insumoDiv.dataset.nome;
            
            const estoque = Utils.validarNumero(insumoDiv.querySelector('[data-campo="estoque"]').value);
            const desceu = Utils.validarNumero(insumoDiv.querySelector('[data-campo="desceu"]').value);
            const linhaMontagem = Utils.validarNumero(insumoDiv.querySelector('[data-campo="linhaMontagem"]').value);
            const sobrou = estoque - desceu;
            const posicaoFinal = sobrou + linhaMontagem;

            detalhesContagem[id] = { 
                nome,
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

        return { detalhesContagem, temDados };
    };

    // Lógica para submissão do formulário de contagem
    formContagem.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        console.log('📝 Enviando formulário de contagem...');
        
        // Validar formulário
        if (!validarFormulario()) {
            return;
        }

        // Coletar dados
        const { detalhesContagem, temDados } = coletarDadosContagem();
        
        if (!temDados) {
            Notificacoes.mostrarNotificacao('Nenhum insumo foi contado. Preencha pelo menos um campo antes de salvar.', 'warning');
            return;
        }

        // Criar objeto de contagem
        const novaContagem = {
            id: Utils.gerarId('contagem-'),
            data: dataContagemInput.value,
            responsavel: responsavelInput.value.trim(),
            timestamp: new Date().toISOString(),
            detalhesContagem
        };

        // Mostrar loading
        const submitBtn = formContagem.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvando...';
        submitBtn.disabled = true;

        try {
            // Salvar dados
            const salvouContagem = StorageManager.setUltimaContagem(novaContagem);
            const salvouHistorico = StorageManager.saveHistoricoContagens(novaContagem);
            
            if (salvouContagem && salvouHistorico) {
                console.log('✅ Contagem salva com sucesso:', novaContagem);
                
                // Gerar PDF
                Notificacoes.mostrarNotificacao('Contagem salva! Gerando relatório PDF...', 'info');
                
                setTimeout(() => {
                    RelatorioPDF.gerarPDF(novaContagem, 'contagem', 'Relatorio_Contagem');
                    
                    // Resetar formulário
                    formContagem.reset();
                    dataContagemInput.value = Utils.getDataAtual();
                    renderizarInsumosContagem();
                    
                    Notificacoes.mostrarNotificacao('Contagem salva e relatório gerado com sucesso!', 'success');
                }, 1000);
                
            } else {
                throw new Error('Erro ao salvar contagem');
            }
            
        } catch (error) {
            console.error('❌ Erro ao salvar contagem:', error);
            Notificacoes.mostrarNotificacao('Erro ao salvar contagem. Tente novamente.', 'error');
            
        } finally {
            // Restaurar botão
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });

    // Adicionar validação em tempo real nos inputs numéricos
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('campo-numerico')) {
            validarInputNumerico(e.target);
        }
    });

    // Botão para limpar todos os campos
    const adicionarBotaoLimpar = () => {
        const botaoLimpar = document.createElement('button');
        botaoLimpar.type = 'button';
        botaoLimpar.className = 'btn btn-outline-secondary btn-sm mb-3';
        botaoLimpar.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i>Limpar Campos';
        botaoLimpar.onclick = () => {
            if (confirm('Limpar todos os campos preenchidos?')) {
                document.querySelectorAll('.campo-numerico').forEach(input => {
                    if (input.dataset.campo === 'estoque') {
                        // Manter apenas o estoque (valores iniciais)
                        const insumoDiv = input.closest('.insumo-item');
                        const ultimaContagem = StorageManager.getUltimaContagem();
                        const insumoId = insumoDiv.dataset.id;
                        const ultimoSobrou = ultimaContagem?.detalhesContagem?.[insumoId]?.sobrou || 0;
                        input.value = ultimoSobrou;
                    } else {
                        input.value = '0';
                    }
                    calcularValoresInsumo(input.closest('.insumo-item'));
                });
                Notificacoes.mostrarNotificacao('Campos limpos com sucesso!', 'success');
            }
        };
        
        listaInsumosDiv.parentNode.insertBefore(botaoLimpar, listaInsumosDiv);
    };

    // Inicializar página
    const inicializarPagina = () => {
        renderizarInsumosContagem();
        adicionarBotaoLimpar();
        
        // Focar no campo de responsável
        if (responsavelInput) {
            setTimeout(() => {
                responsavelInput.focus();
            }, 500);
        }
        
        console.log('✅ Página de contagem inicializada');
    };

    // Iniciar
    inicializarPagina();
});

// Função global para teste rápido
window.testarContagemRapida = () => {
    const insumos = StorageManager.getInsumos();
    if (insumos.length > 0) {
        document.getElementById('responsavel').value = 'Usuário Teste';
        
        // Preencher alguns campos aleatórios
        const insumoDivs = document.querySelectorAll('.insumo-item');
        insumoDivs.forEach((div, index) => {
            if (index < 3) { // Apenas os 3 primeiros
                const estoqueInput = div.querySelector('[data-campo="estoque"]');
                const desceuInput = div.querySelector('[data-campo="desceu"]');
                
                estoqueInput.value = (Math.random() * 100 + 10).toFixed(2);
                desceuInput.value = (Math.random() * 30 + 5).toFixed(2);
                
                // Disparar evento de input para calcular
                const event = new Event('input', { bubbles: true });
                estoqueInput.dispatchEvent(event);
                desceuInput.dispatchEvent(event);
            }
        });
        
        Notificacoes.mostrarNotificacao('Campos de teste preenchidos!', 'info');
    }
};
