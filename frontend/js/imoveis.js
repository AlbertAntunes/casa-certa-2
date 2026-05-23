const grid = document.getElementById('grid-imoveis');

async function carregarImoveis() {

    try {

        const resposta =
            await fetch('/api/imoveis');

        const imoveis =
            await resposta.json();

        renderizarImoveis(imoveis);

    } catch (erro) {

        console.log(
            'Erro ao carregar imóveis:',
            erro
        );

    }

}

function pegarImagemPrincipal(imovel){

    if(
        imovel.imovel_imagens &&
        imovel.imovel_imagens.length > 0
    ){

        return imovel
            .imovel_imagens[0]
            .url;

    }

    return 'assets/sem-imagem.jpg';

}

function criarCard(imovel) {

    const imagemUrl = imovel.foto_capa || (imovel.fotos && imovel.fotos[0]) || '/img/placeholder.jpg';

    return `

    <div class="imovel-card">

        <img
            src="${imagemUrl}"
            alt="${imovel.titulo}"
        >

        <div class="card-content">

            <span class="tipo-badge">
                ${imovel.tipo || 'Imóvel'}
            </span>

            <h3>
                ${imovel.titulo || ''}
            </h3>

            <p class="bairro">
                📍 ${imovel.bairro || ''}
            </p>

            <div class="info-row">

                <span>
                    🛏 ${imovel.quartos || 0} quartos
                </span>

                <span>
                    🚿 ${imovel.banheiros || 0} banheiros
                </span>

            </div>

            <strong class="preco">

                R$ ${Number(
                    imovel.preco || 0
                ).toLocaleString('pt-BR')}

            </strong>

            <a
                class="btn-detalhes"
                href="imovel.html?id=${imovel.id}"
            >

                Ver detalhes →

            </a>

        </div>

    </div>

    `;

}

function renderizarImoveis(imoveis) {
    // 1. Localiza o elemento grid de forma segura
    const grid = document.getElementById('imoveis-grid') || document.getElementById('lista-imoveis-container');
    if (!grid) return;

    // 2. Limpa o grid para não duplicar imóveis na tela
    grid.innerHTML = '';

    // 3. Garante que temos uma lista (Array) válida para rodar o loop
    let listaFiltrada = [];
    if (Array.isArray(imoveis)) {
        listaFiltrada = imoveis;
    } else if (imoveis && Array.isArray(imoveis.data)) {
        listaFiltrada = imoveis.data;
    } else {
        console.warn("Aviso: O formato de imóveis recebido não é um array válido:", imoveis);
        grid.innerHTML = '<p style="color: var(--text3); text-align: center; grid-column: 1/-1;">Nenhum imóvel disponível no momento.</p>';
        return;
    }

    // 4. Se a lista estiver vazia, encerra sem dar erro
    if (listaFiltrada.length === 0) {
        grid.innerHTML = '<p style="color: var(--text3); text-align: center; grid-column: 1/-1;">Nenhum imóvel encontrado.</p>';
        return;
    }

    // 5. Monta o HTML acumulando em uma variável (Melhora muito a performance)
    let htmlAcumulado = '';
    
    listaFiltrada.forEach(imovel => {
        // TRATAMENTO DA FOTO DA CAPA:
        // Se 'imovel.fotos' for um array com itens, pegamos a primeira foto [0].
        // Se vier como string direta, usamos ela. Se não tiver nada, usa um placeholder.
        let fotoCapa = '/img/placeholder.jpg';
        
        if (imovel.fotos) {
            if (Array.isArray(imovel.fotos) && imovel.fotos.length > 0) {
                fotoCapa = imovel.fotos[0];
            } else if (typeof imovel.fotos === 'string' && imovel.fotos.trim() !== '') {
                fotoCapa = imovel.fotos;
            }
        }

        // Criamos uma cópia segura do imóvel garantindo que a foto da capa seja uma URL limpa
        const imovelTratado = {
            ...imovel,
            foto_capa: fotoCapa // agora você pode usar imovel.foto_capa dentro de criarCard() se quiser
        };

        // Alimenta o acumulador chamando a sua função original
        htmlAcumulado += criarCard(imovelTratado);
    });

    // Injeta tudo de uma vez no DOM, limpando textos fantasmas
    grid.innerHTML = htmlAcumulado;

    // Dispara o filtro ativo para garantir que os cards recém-inseridos
    // fiquem visíveis sem precisar que o usuário clique manualmente.
    setTimeout(() => {
        const tabAtiva = document.querySelector('.filter-tab.active');
        if (tabAtiva) tabAtiva.click();
    }, 50);
}