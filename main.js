document.addEventListener('DOMContentLoaded', () => {

    // --- FUNÇÕES DE ARMAZENAMENTO (LOCAL STORAGE) ---
    const getInsumos = () => {
        const insumos = localStorage.getItem('insumos');
        return insumos ? JSON.parse(insumos) : [];
    };

    const saveInsumos = (insumos) => {
        localStorage.setItem('insumos', JSON.stringify(insumos));
    };

    const getUltimaContagem = () => {
        const contagem = localStorage.getItem('ultimaContagem');
        return contagem ? JSON.parse(contagem) : null;
    };

    const setUltimaContagem = (contagem) => {
        localStorage.setItem('ultimaContagem', JSON.stringify(contagem));
    };

    const getHistoricoContagens = () => {
        const historico = localStorage.getItem('historicoContagens');
        return historico ? JSON.parse(historico) : [];
    };

    const saveHistoricoContagens = (contagem) => {
        const historico = getHistoricoContagens();
        historico.push(contagem);
        localStorage.setItem('historicoContagens', JSON.stringify(historico));
    };

    const deleteContagem = (id) => {
        let historico = getHistoricoContagens();
        const novoHistorico = historico.filter(contagem => contagem.id !== id);
        localStorage.setItem('historicoContagens', JSON.stringify(novoHistorico));
    };

    const getHistoricoEntradas = () => {
        const historico = localStorage.getItem('historicoEntradas');
        return historico ? JSON.parse(historico) : [];
    };

    const saveHistoricoEntradas = (entrada) => {
        const historico = getHistoricoEntradas();
        historico.push(entrada);
        localStorage.setItem('historicoEntradas', JSON.stringify(historico));
    };
    
    const deleteHistoricoEntrada = (id) => {
        let historico = getHistoricoEntradas();
        const entradaExcluida = historico.find(e => e.id === id);
        if (!entradaExcluida) return;

        let ultimaContagem = getUltimaContagem();
        if (ultimaContagem && ultimaContagem.detalhesContagem[entradaExcluida.insumoId]) {
            ultimaContagem.detalhesContagem[entradaExcluida.insumoId].sobrou -= entradaExcluida.quantidade;
            ultimaContagem.detalhesContagem[entradaExcluida.insumoId].posicaoFinal -= entradaExcluida.quantidade;
            setUltimaContagem(ultimaContagem);
        }

        const novoHistorico = historico.filter(e => e.id !== id);
        localStorage.setItem('historicoEntradas', JSON.stringify(novoHistorico));
    };

    const updateHistoricoEntrada = (id, novaQuantidade) => {
        let historico = getHistoricoEntradas();
        const entradaParaAtualizar = historico.find(e => e.id === id);
        if (!entradaParaAtualizar) return;

        const quantidadeAnterior = entradaParaAtualizar.quantidade;
        const diferenca = novaQuantidade - quantidadeAnterior;

        let ultimaContagem = getUltimaContagem();
        if (ultimaContagem && ultimaContagem.detalhesContagem[entradaParaAtualizar.insumoId]) {
            ultimaContagem.detalhesContagem[entradaParaAtualizar.insumoId].sobrou += diferenca;
            ultimaContagem.detalhesContagem[entradaParaAtualizar.insumoId].posicaoFinal += diferenca;
            setUltimaContagem(ultimaContagem);
        }

        entradaParaAtualizar.quantidade = novaQuantidade;
        localStorage.setItem('historicoEntradas', JSON.stringify(historico));
    };


    // --- FUNÇÕES AUXILIARES DE RELATÓRIO ---
    const gerarRelatorioPDF = (contagem, filenamePrefix) => {
        const insumos = getInsumos();
        const dadosEmpresa = {
            nome: "La Giovana's Pizzaria",
            titulo: "Relatório de Contagem de Insumos"
        };
        
        let dataAtual = new Date().toLocaleDateString('pt-BR');
        let horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        if (!contagem || !contagem.detalhesContagem || Object.keys(contagem.detalhesContagem).length === 0) {
            alert('Não há dados de contagem para gerar o relatório.');
            return;
        }

        let tabelaRows = '';
        Object.keys(contagem.detalhesContagem).forEach(insumoId => {
            const insumoInfo = getInsumos().find(i => i.id === insumoId) || { nome: 'Desconhecido', unidade: 'N/A' };
            const dados = contagem.detalhesContagem[insumoId];
            
            tabelaRows += `
                <tr>
                    <td style="padding: 10px; border: 1px solid #000;">${insumoInfo.nome}</td>
                    <td style="padding: 10px; border: 1px solid #000; text-align: center;">${dados.estoque}</td>
                    <td style="padding: 10px; border: 1px solid #000; text-align: center;">${dados.desceu}</td>
                    <td style="padding: 10px; border: 1px solid #000; text-align: center;">${dados.linhaMontagem}</td>
                    <td style="padding: 10px; border: 1px solid #000; text-align: center;">${dados.sobrou}</td>
                    <td style="padding: 10px; border: 1px solid #000; text-align: center; font-weight: bold; font-size: 16px;">${dados.posicaoFinal}</td>
                </tr>
            `;
        });
        
        let conteudoRelatorio = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #000;">
                <div style="text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #000;">
                    <h1 style="margin: 0; color: #000; font-size: 24px;">${dadosEmpresa.nome}</h1>
                    <p style="margin: 5px 0; font-size: 18px; color: #000;">${dadosEmpresa.titulo}</p>
                </div>
                
                <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #000; border-radius: 8px;">
                    <p style="margin: 5px 0; font-size: 16px;"><strong>Responsável:</strong> ${contagem.responsavel}</p>
                    <p style="margin: 5px 0; font-size: 16px;"><strong>Data da contagem:</strong> ${contagem.data}</p>
                    <p style="margin: 5px 0; font-size: 14px; color: #333;">Nº do Registro: ${contagem.id}</p>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px;">
                    <thead>
                        <tr style="background-color: #333; color: white;">
                            <th style="padding: 12px; border: 1px solid #000; text-align: left;">INSUMO</th>
                            <th style="padding: 12px; border: 1px solid #000; text-align: center;">ESTOQUE</th>
                            <th style="padding: 12px; border: 1px solid #000; text-align: center;">DESCEU</th>
                            <th style="padding: 12px; border: 1px solid #000; text-align: center;">LINHA</th>
                            <th style="padding: 12px; border: 1px solid #000; text-align: center;">SOBROU</th>
                            <th style="padding: 12px; border: 1px solid #000; text-align: center;">POSIÇÃO FINAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tabelaRows}
                    </tbody>
                </table>
                
                <div style="text-align: center; margin-top: 25px; font-size: 12px; color: #6c757d;">
                    Documento gerado em ${dataAtual} às ${horaAtual}.
                </div>
            </div>
        `;

        const options = {
            margin: 0.5,
            filename: `${filenamePrefix}_${contagem.data}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: true },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        html2pdf().set(options).from(conteudoRelatorio).save();
    };

    const gerarRelatorioEstoqueAtual = () => {
        const ultimaContagem = getUltimaContagem();
        const insumos = getInsumos();
        const dataAtual = new Date().toLocaleDateString('pt-BR');

        if (!ultimaContagem || Object.keys(ultimaContagem.detalhesContagem).length === 0) {
            alert('Não há contagem salva para gerar o relatório de estoque.');
            return;
        }

        let tabelaRows = '';
        Object.keys(ultimaContagem.detalhesContagem).forEach(insumoId => {
            const insumoInfo = getInsumos().find(i => i.id === insumoId) || { nome: 'Desconhecido', unidade: 'N/A' };
            const sobrou = ultimaContagem.detalhesContagem[insumoId]?.sobrou || 0;
            tabelaRows += `
                <tr>
                    <td style="padding: 8px; border: 1px solid #000; font-size: 12px;">${insumoInfo.nome}</td>
                    <td style="padding: 8px; border: 1px solid #000; font-size: 12px;">${insumoInfo.unidade}</td>
                    <td style="padding: 8px; border: 1px solid #000; font-size: 12px;">${sobrou}</td>
                </tr>
            `;
        });
        
        let conteudoRelatorio = `
            <div style="font-family: Arial, sans-serif; padding: 2rem;">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <h1 style="margin: 0; font-size: 24px;">La Giovana's Pizzaria</h1>
                    <p style="margin: 5px 0;">Relatório de Posição Atual do Estoque</p>
                    <hr style="border: 1px solid #000; margin-top: 1rem;">
                </div>
                <div style="margin-bottom: 1.5rem; font-size: 14px;">
                    <p style="margin: 0;"><strong>Data da Análise:</strong> ${dataAtual}</p>
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-top: 1rem; border: 1px solid #000;">
                    <thead style="background-color: #333; color: white;">
                        <tr>
                            <th style="padding: 8px; border: 1px solid #000; text-align: left; font-size: 12px;">INSUMO</th>
                            <th style="padding: 8px; border: 1px solid #000; text-align: left; font-size: 12px;">UNIDADE</th>
                            <th style="padding: 8px; border: 1px solid #000; text-align: left; font-size: 12px;">ESTOQUE ATUAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tabelaRows}
                    </tbody>
                </table>
            </div>
        `;

        const options = {
            margin: 1,
            filename: `Relatorio_Estoque_Atual_${dataAtual}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        html2pdf().set(options).from(conteudoRelatorio).save();
    };


    // --- FUNÇÃO PARA INICIALIZAR INSUMOS ---
    function inicializarInsumos() {
        const insumosExistentes = getInsumos(); 
        if (insumosExistentes.length === 0) {
            const insumosPadrao = [
                { id: 'insumo-4queijos', nome: '4 queijos', unidade: 'porção' },
                { id: 'insumo-azeitona', nome: 'Azeitona', unidade: 'balde' },
                { id: 'insumo-bacon', nome: 'Bacon', unidade: 'porção' },
                { id: 'insumo-brocolis', nome: 'Brócolis', unidade: 'pote' },
                { id: 'insumo-calabresa', nome: 'Calabresa', unidade: 'porção' },
                { id: 'insumo-calabresapicante', nome: 'Calabresa picante', unidade: 'porção' },
                { id: 'insumo-camarao', nome: 'Camarão', unidade: 'porção' },
                { id: 'insumo-carnedepanela', nome: 'Carne de panela', unidade: 'porção' },
                { id: 'insumo-cebola', nome: 'Cebola', unidade: 'balde' },
                { id: 'insumo-cebolacaramelizada', nome: 'Cebola caramelizada', unidade: 'pote' },
                { id: 'insumo-chester', nome: 'Chester', unidade: 'porção' },
                { id: 'insumo-coracao', nome: 'Coração', unidade: 'porção' },
                { id: 'insumo-costelao', nome: 'Costelão', unidade: 'porção' },
                { id: 'insumo-doritos', nome: 'Doritos', unidade: 'porção' },
                { id: 'insumo-frangoaomolho', nome: 'Frango ao molho', unidade: 'porção' },
                { id: 'insumo-frangoemcubos', nome: 'Frango em cubos', unidade: 'porção' },
                { id: 'insumo-geleia', nome: 'Geleia de amora', unidade: 'balde' },
                { id: 'insumo-iscasdecarne', nome: 'Iscas de carne', unidade: 'porção' },
                { id: 'insumo-macacaramelizada', nome: 'Maçã caramelizada', unidade: 'pote' },
                { id: 'insumo-molhobarbecue', nome: 'Molho Barbecue', unidade: 'balde' },
                { id: 'insumo-molhopesto', nome: 'Molho pesto', unidade: 'pote' },
                { id: 'insumo-molhoalhoeoleo', nome: 'Molho alho e óleo', unidade: 'pote' },
                { id: 'insumo-molhomaracuja', nome: 'Molho de Maracujá', unidade: 'pote' },
                { id: 'insumo-molhovermelho', nome: 'Molho vermelho pra Camarão', unidade: 'pote' },
                { id: 'insumo-ovoemconserva', nome: 'Ovo em conserva', unidade: 'balde' },
                { id: 'insumo-parmesao', nome: 'Parmesão', unidade: 'unidade' },
                { id: 'insumo-pepperoni', nome: 'Pepperoni', unidade: 'porção' },
                { id: 'insumo-presunto', nome: 'Presunto', unidade: 'porção' },
                { id: 'insumo-queijobrie', nome: 'Queijo brie', unidade: 'porção' },
                { id: 'insumo-queijogorgonzola', nome: 'Queijo gorgonzola', unidade: 'porção' },
                { id: 'insumo-salmao', nome: 'Salmão', unidade: 'porção' },
                { id: 'insumo-strogonoffcarne', nome: 'Strogonoff de carne', unidade: 'porção' },
                { id: 'insumo-strogonofffrango', nome: 'Strogonoff de frango', unidade: 'porção' },
                { id: 'insumo-tomate', nome: 'Tomate', unidade: 'pote' },
                { id: 'insumo-vinagrete', nome: 'Vinagrete', unidade: 'pote' }
            ];
            saveInsumos(insumosPadrao);
        }
    }


    // --- LÓGICA DE PÁGINAS ---
    
    // Lógica para a tela de Estoque (estoque.html)
    const tabelaEstoqueBody = document.getElementById('tabelaEstoque');
    const btnGerarPdfEstoque = document.getElementById('btnGerarPdfEstoque');
    const semEstoqueText = document.getElementById('semEstoque');

    if (tabelaEstoqueBody && btnGerarPdfEstoque) {
        const renderizarEstoque = () => {
            const ultimaContagem = getUltimaContagem();
            const insumos = getInsumos();
            tabelaEstoqueBody.innerHTML = '';

            if (!ultimaContagem || Object.keys(ultimaContagem.detalhesContagem).length === 0) {
                semEstoqueText.style.display = 'block';
                return;
            }
            semEstoqueText.style.display = 'none';

            Object.keys(ultimaContagem.detalhesContagem).forEach(insumoId => {
                const insumoInfo = insumos.find(i => i.id === insumoId) || { nome: 'Desconhecido', unidade: 'N/A' };
                const sobrou = ultimaContagem.detalhesContagem[insumoId]?.sobrou || 0;
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${insumoInfo.nome}</td>
                    <td><span class="badge bg-primary">${insumoInfo.unidade}</span></td>
                    <td class="text-end fw-bold">${sobrou}</td>
                `;
                tabelaEstoqueBody.appendChild(tr);
            });
        };

        btnGerarPdfEstoque.addEventListener('click', gerarRelatorioEstoqueAtual);

        renderizarEstoque();
    }

    // Lógica para a tela de Histórico (historico.html)
    const tabelaHistoricoBody = document.getElementById('tabelaHistorico');
    const semHistoricoText = document.getElementById('semHistorico');
    if (tabelaHistoricoBody) {
        const renderizarHistorico = () => {
            const historico = getHistoricoContagens().reverse();
            tabelaHistoricoBody.innerHTML = '';
            if (historico.length === 0) {
                semHistoricoText.style.display = 'block';
                return;
            }
            semHistoricoText.style.display = 'none';
            historico.forEach(contagem => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${contagem.data}</td>
                    <td>${contagem.responsavel}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-danger btn-excluir-historico me-2" data-id="${contagem.id}"><i class="bi bi-trash"></i></button>
                        <button class="btn btn-sm btn-info btn-baixar-pdf" data-id="${contagem.id}"><i class="bi bi-file-earmark-arrow-down"></i></button>
                    </td>
                `;
                tabelaHistoricoBody.appendChild(tr);
            });

            document.querySelectorAll('.btn-baixar-pdf').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const contagemId = e.currentTarget.dataset.id;
                    const contagem = getHistoricoContagens().find(c => c.id === contagemId);
                    if (contagem) {
                        gerarRelatorioPDF(contagem, `Relatorio_Contagem`);
                    }
                });
            });

            document.querySelectorAll('.btn-excluir-historico').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const contagemId = e.currentTarget.dataset.id;
                    if (confirm('Tem certeza que deseja excluir esta contagem?')) {
                        deleteContagem(contagemId);
                        renderizarHistorico();
                    }
                });
            });
        };

        renderizarHistorico();
    }

    // Lógica para a tela de Gerenciamento (gerenciar.html)
    const formInsumo = document.getElementById('formInsumo');
    const insumoIdInput = document.getElementById('insumoId');
    const insumoNomeInput = document.getElementById('insumoNome');
    const insumoUnidadeSelect = document.getElementById('insumoUnidade');
    const tabelaInsumosBody = document.getElementById('tabelaInsumos');
    const semInsumosText = document.getElementById('semInsumos');
    const btnCancelarEdicao = document.getElementById('btnCancelarEdicao');

    if (formInsumo) {
        const renderizarTabelaInsumos = () => {
            const insumos = getInsumos();
            tabelaInsumosBody.innerHTML = '';
            if (insumos.length === 0) {
                semInsumosText.style.display = 'block';
                return;
            }
            semInsumosText.style.display = 'none';
            insumos.forEach(insumo => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${insumo.nome}</td>
                    <td><span class="badge bg-primary">${insumo.unidade}</span></td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-info me-2 btn-editar" data-id="${insumo.id}"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-sm btn-danger btn-excluir" data-id="${insumo.id}"><i class="bi bi-trash"></i></button>
                    </td>
                `;
                tabelaInsumosBody.appendChild(tr);
            });
            document.querySelectorAll('.btn-editar').forEach(btn => btn.addEventListener('click', (e) => editarInsumo(e.currentTarget.dataset.id)));
            document.querySelectorAll('.btn-excluir').forEach(btn => btn.addEventListener('click', (e) => excluirInsumo(e.currentTarget.dataset.id)));
        };

        const salvarInsumo = (event) => {
            event.preventDefault();
            const nome = insumoNomeInput.value;
            const unidade = insumoUnidadeSelect.value;
            const id = insumoIdInput.value;
            let insumos = getInsumos();
            if (id) {
                const insumoIndex = insumos.findIndex(insumo => insumo.id === id);
                if (insumoIndex !== -1) {
                    insumos[insumoIndex].nome = nome;
                    insumos[insumoIndex].unidade = unidade;
                }
            } else {
                const novoInsumo = {
                    id: `insumo-${Date.now()}`,
                    nome,
                    unidade
                };
                insumos.push(novoInsumo);
            }
            saveInsumos(insumos);
            formInsumo.reset();
            insumoIdInput.value = '';
            renderizarTabelaInsumos();
            btnCancelarEdicao.style.display = 'none';
        };

        const editarInsumo = (id) => {
            const insumo = getInsumos().find(insumo => insumo.id === id);
            if (insumo) {
                insumoIdInput.value = insumo.id;
                insumoNomeInput.value = insumo.nome;
                insumoUnidadeSelect.value = insumo.unidade;
                btnCancelarEdicao.style.display = 'block';
            }
        };

        const excluirInsumo = (id) => {
            if (confirm('Tem certeza que deseja excluir este insumo?')) {
                let insumos = getInsumos().filter(insumo => insumo.id !== id);
                saveInsumos(insumos);
                renderizarTabelaInsumos();
            }
        };

        const cancelarEdicao = () => {
            formInsumo.reset();
            insumoIdInput.value = '';
            btnCancelarEdicao.style.display = 'none';
        };

        formInsumo.addEventListener('submit', salvarInsumo);
        btnCancelarEdicao.addEventListener('click', cancelarEdicao);
        renderizarTabelaInsumos();
    }

    // Lógica para a tela de Entrada (entrada.html)
    const formEntrada = document.getElementById('formEntrada');
    const selectInsumo = document.getElementById('selectInsumo');
    const quantidadeEntradaInput = document.getElementById('quantidadeEntrada');
    const tabelaHistoricoEntradasBody = document.getElementById('tabelaHistoricoEntradas');
    const semEntradasText = document.getElementById('semEntradasText');

    if (formEntrada) {
        const renderizarSelectInsumos = () => {
            const insumos = getInsumos();
            selectInsumo.innerHTML = '<option value="">-- Selecione um insumo --</option>';
            insumos.forEach(insumo => {
                const option = document.createElement('option');
                option.value = insumo.id;
                option.textContent = `${insumo.nome} (${insumo.unidade})`;
                selectInsumo.appendChild(option);
            });
        };

        const renderizarHistoricoEntradas = () => {
            const historico = getHistoricoEntradas().reverse();
            const insumos = getInsumos();
            tabelaHistoricoEntradasBody.innerHTML = '';
            
            if (historico.length === 0) {
                semEntradasText.style.display = 'block';
                return;
            }
            semEntradasText.style.display = 'none';

            historico.forEach(entrada => {
                const insumoInfo = insumos.find(i => i.id === entrada.insumoId) || { nome: 'Insumo Desconhecido', unidade: '' };
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${insumoInfo.nome}</td>
                    <td>${entrada.quantidade}</td>
                    <td>${entrada.data}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-info me-2 btn-editar-entrada" data-id="${entrada.id}"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-sm btn-danger btn-excluir-entrada" data-id="${entrada.id}"><i class="bi bi-trash"></i></button>
                    </td>
                `;
                tabelaHistoricoEntradasBody.appendChild(tr);
            });

            document.querySelectorAll('.btn-editar-entrada').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const entradaId = e.currentTarget.dataset.id;
                    const historico = getHistoricoEntradas();
                    const entrada = historico.find(e => e.id === entradaId);
                    if (entrada) {
                        const novaQuantidade = prompt(`Digite a nova quantidade para ${insumos.find(i => i.id === entrada.insumoId).nome}:`, entrada.quantidade);
                        if (novaQuantidade !== null && !isNaN(novaQuantidade) && parseFloat(novaQuantidade) > 0) {
                            updateHistoricoEntrada(entradaId, parseFloat(novaQuantidade));
                            renderizarHistoricoEntradas();
                            alert('Entrada atualizada com sucesso!');
                        } else if (novaQuantidade !== null) {
                            alert('Quantidade inválida.');
                        }
                    }
                });
            });

            document.querySelectorAll('.btn-excluir-entrada').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const entradaId = e.currentTarget.dataset.id;
                    if (confirm('Tem certeza que deseja excluir esta entrada?')) {
                        deleteHistoricoEntrada(entradaId);
                        renderizarHistoricoEntradas();
                        alert('Entrada excluída com sucesso!');
                    }
                });
            });
        };

        const registrarEntrada = (event) => {
            event.preventDefault();
            const insumoId = selectInsumo.value;
            const quantidade = parseFloat(quantidadeEntradaInput.value);

            if (!insumoId || isNaN(quantidade) || quantidade <= 0) { 
                alert('Por favor, selecione um insumo e digite uma quantidade válida.');
                return;
            }

            const novaEntrada = {
                id: `entrada-${Date.now()}`,
                insumoId: insumoId,
                quantidade: quantidade,
                data: new Date().toISOString().split('T')[0]
            };
            saveHistoricoEntradas(novaEntrada);
            
            let ultimaContagem = getUltimaContagem();
            if (ultimaContagem && ultimaContagem.detalhesContagem) {
                const detalhes = ultimaContagem.detalhesContagem[insumoId];
                if (detalhes) {
                    detalhes.posicaoFinal = parseFloat(detalhes.posicaoFinal || 0) + quantidade;
                    detalhes.sobrou = parseFloat(detalhes.sobrou || 0) + quantidade;
                    setUltimaContagem(ultimaContagem);
                }
            } else {
                const insumoExistente = getInsumos().find(insumo => insumo.id === insumoId);
                if (insumoExistente) {
                    ultimaContagem = {
                        id: 'entrada-inicial',
                        data: new Date().toISOString().split('T')[0],
                        responsavel: 'Sistema',
                        detalhesContagem: {
                            [insumoId]: {
                                estoque: quantidade,
                                desceu: 0,
                                linhaMontagem: 0,
                                sobrou: quantidade,
                                posicaoFinal: quantidade
                            }
                        }
                    };
                    setUltimaContagem(ultimaContagem);
                }
            }
            alert('Entrada de insumo registrada com sucesso!');
            formEntrada.reset();
            renderizarHistoricoEntradas();
        };

        formEntrada.addEventListener('submit', registrarEntrada);
        renderizarSelectInsumos();
        renderizarHistoricoEntradas();
    }

    // Lógica para a tela de Contagem (index.html)
    const formContagem = document.getElementById('formContagem');
    const listaInsumosDiv = document.getElementById('listaInsumos');

    if (formContagem) {
        const renderizarInsumosContagem = () => {
            const insumos = getInsumos();
            const ultimaContagem = getUltimaContagem();
            listaInsumosDiv.innerHTML = '';
            if (insumos.length === 0) {
                listaInsumosDiv.innerHTML = '<p class="text-center text-muted">Nenhum insumo cadastrado. Vá para "Gerenciar Insumos" para adicionar.</p>';
                return;
            }
            insumos.forEach(insumo => {
                const insumoDiv = document.createElement('div');
                insumoDiv.classList.add('insumo-item', 'border', 'p-3', 'rounded', 'mb-3');
                insumoDiv.dataset.id = insumo.id;

                const ultimaPosicaoFinal = ultimaContagem?.detalhesContagem?.[insumo.id]?.posicaoFinal || 0;

                insumoDiv.innerHTML = `
                    <h5 class="insumo-nome">${insumo.nome} <span class="badge bg-primary ms-2">${insumo.unidade}</span></h5>
                    <p class="text-muted small mb-2">Última Posição Final: <span class="fw-bold">${ultimaPosicaoFinal}</span></p>
                    <div class="row g-2 align-items-end">
                        <div class="col-6 col-md-3">
                            <label class="form-label">Estoque</label>
                            <input type="number" step="any" class="form-control form-control-sm" data-campo="estoque" placeholder="Qtd. Estoque" value="${ultimaPosicaoFinal}">
                        </div>
                        <div class="col-6 col-md-3">
                            <label class="form-label">Desceu</label>
                            <input type="number" step="any" class="form-control form-control-sm" data-campo="desceu" placeholder="Qtd. Desceu" value="0">
                        </div>
                        <div class="col-6 col-md-3">
                            <label class="form-label">Linha Montagem</label>
                            <input type="number" step="any" class="form-control form-control-sm" data-campo="linhaMontagem" placeholder="Qtd. Linha" value="0">
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
                });
            });
        };

        const calcularValoresInsumo = (insumoDiv) => {
            const estoque = parseFloat(insumoDiv.querySelector('[data-campo="estoque"]').value) || 0;
            const desceu = parseFloat(insumoDiv.querySelector('[data-campo="desceu"]').value) || 0;
            const linhaMontagem = parseFloat(insumoDiv.querySelector('[data-campo="linhaMontagem"]').value) || 0;
            const sobrou = estoque - desceu;
            const posicaoFinal = sobrou + desceu + linhaMontagem;
            insumoDiv.querySelector('[data-campo="sobrou"]').textContent = sobrou;
            insumoDiv.querySelector('[data-campo="posicaoFinal"]').textContent = posicaoFinal;
        };

        formContagem.addEventListener('submit', (event) => {
            event.preventDefault();
            const responsavel = document.getElementById('responsavel').value;
            const dataContagem = document.getElementById('dataContagem').value;
            if (!responsavel || !dataContagem) {
                alert('Por favor, preencha o nome do responsável e a data da contagem.');
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
                const posicaoFinal = sobrou + desceu + linhaMontagem;
                
                detalhesContagem[id] = { estoque, desceu, linhaMontagem, sobrou, posicaoFinal };

                if (estoque > 0 || desceu > 0 || linhaMontagem > 0) {
                    temDados = true;
                }
            });
            
            if (!temDados) {
                alert('Nenhum insumo foi contado. Por favor, adicione insumos antes de salvar.');
                return;
            }

            const novaContagem = {
                id: `contagem-${Date.now()}`,
                data: dataContagem,
                responsavel: responsavel,
                detalhesContagem
            };

            setUltimaContagem(novaContagem);
            saveHistoricoContagens(novaContagem);
            gerarRelatorioPDF(novaContagem, 'Relatorio_Contagem');
            formContagem.reset();
            renderizarInsumosContagem();
        });
        
        renderizarInsumosContagem();
    }
    
    // Inicialização principal da aplicação
    inicializarInsumos();
});
