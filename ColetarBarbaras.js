// Variáveis globais para armazenar coordenadas e o índice atual
let barbCoords = [];
let currentIndex = 0;
let spyButton;

$(document).ready(function () {
    // Cria o botão
    spyButton = document.createElement('button');
    spyButton.addEventListener("click", sendNextSpy);
    spyButton.className = "btn btn-instant-free";
    spyButton.style.textAlign = "center";

    // Adiciona o botão à página
    var div = document.createElement('div');
    div.style.display = "unset";
    div.style.marginLeft = "10px"
    div.appendChild(spyButton);

    var content = document.getElementById("content_value");
    content.insertBefore(div, content.firstChild);

    // Carrega as coordenadas das bárbaras ao iniciar
    loadBarbCoords();
});

function loadBarbCoords() {
    let villages = TWMap.villages;
    let vk = TWMap.villageKey;
    let key = {};
    let contador = 0;

    for (let j in vk) {
        key[contador] = vk[j];
        contador++;
    }

    for (const k in key) {
        const village = villages[key[k]];
        if (village.owner === "0") {
            const coordAtual = TWMap.CoordByXY(key[k]);
            const distance = TWMap.context.FATooltip.distance(game_data.village.x, game_data.village.y, coordAtual[0], coordAtual[1]);
            console.log(`Aldeia Bárbara em ${coordAtual[0]}|${coordAtual[1]} está a ${distance.toFixed(2)} de distância.`);
            if (distance <= 31) {
                barbCoords.push(`${village}`);
            }
        }
    }

    if (barbCoords.length === 0) {
        UI.InfoMessage("Nenhuma aldeia bárbara encontrada no mapa.");
        spyButton.innerText = "Nenhuma Bábara";
        spyButton.disabled = true;
    } else {
        UI.InfoMessage(`Encontradas ${barbCoords.length} aldeias bárbaras.`);
        updateButtonText();
    }
}

function updateButtonText() {
    spyButton.innerText = `Próximo Alvo (${currentIndex}/${barbCoords.length})`;
}

function sendNextSpy() {
    if (currentIndex >= barbCoords.length) {
        UI.SuccessMessage("Todas os alvos foram processados.");
        spyButton.innerText = "Finalizado";
        spyButton.disabled = true;
        return;
    }

    const targetCoord = barbCoords[currentIndex];
    console.log(`Enviando para ${currentIndex + 1}/${barbCoords.length}: ${targetCoord}`);
    
    if (sendSpyTo(targetCoord)) {
        currentIndex++;
        updateButtonText();
    } else {
        // Para o processo se os popups estiverem bloqueados
        UI.ErrorMessage("Processo interrompido pois os popups estão bloqueados.");
        spyButton.innerText = "Popups Bloqueados";
        spyButton.disabled = true;
    }

    if (currentIndex >= barbCoords.length) {
        UI.SuccessMessage("Finalizado o envio de espiões para todas as aldeias.");
        spyButton.innerText = "Finalizado";
        spyButton.disabled = true;
    }
}

function sendSpyTo(targetCoord) {
    const origin = game_data.village.id;
    const link = `${location.protocol}//${location.host}/game.php?village=${origin}&screen=place&target=${targetCoord}`;
    
    const w = window.open(link, '_blank');
    if (!w) {
        return false; // Indica que o popup foi bloqueado
    }

    let tries = 0;
    const iv = setInterval(() => {
        try {
            tries++;
            if (tries > 80) { // Timeout de 16 segundos
                clearInterval(iv);
                console.warn('Não foi possível preencher tropas para', link);
                return;
            }
            if (w.closed) {
                clearInterval(iv);
                return;
            }
            
            const doc = w.document;
            if (!doc || doc.readyState !== 'complete') return;

            const inputs = [...doc.querySelectorAll('input')];
            const findBy = regex => inputs.find(inp => {
                const s = (inp.name || '') + ' ' + (inp.id || '') + ' ' + (inp.getAttribute('data-unit') || '');
                return regex.test(s);
            });

            const spyIn = findBy(/spy|espiao|espião/i);

            if (spyIn) {
                spyIn.value = '1';
                spyIn.dispatchEvent(new Event('input', { bubbles: true }));
                spyIn.dispatchEvent(new Event('change', { bubbles: true }));
                clearInterval(iv);
                console.log(`✅ Tropa (1 espião) preenchida para ${targetCoord}`);
            }
        } catch (err) { 
            if (err.name !== 'SecurityError') {
                console.error(err);
                clearInterval(iv);
            }
        }
    }, 200);
    return true; // Indica sucesso
}