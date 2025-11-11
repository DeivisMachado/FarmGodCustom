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

    for (var k in key) {
        var village = villages[key[k]];
        if (village.owner == "0") {
            var coordAtual = TWMap.CoordByXY(key[k]);
            barbCoords.push(coordAtual[0] + "|" + coordAtual[1]);
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
                if(!w.closed) w.close();
                return;
            }
            if (w.closed) {
                clearInterval(iv);
                return;
            }
            
            const doc = w.document;
            if (!doc || doc.readyState !== 'complete') return;

            const spyInput = doc.querySelector('input[name="spy"]');

            if (spyInput) {
                spyInput.value = '1';
                spyInput.dispatchEvent(new Event('input', { bubbles: true }));
                spyInput.dispatchEvent(new Event('change', { bubbles: true }));
                clearInterval(iv);
                console.log(`✅ Tropa (1 espião) preenchida para ${targetCoord}`);
                
                // Fecha a janela após 1 segundo
                setTimeout(() => {
                    if(!w.closed) w.close();
                }, 1000);
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