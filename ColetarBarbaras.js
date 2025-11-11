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
    const villages = TWMap.villages;
    const villageKeys = TWMap.villageKey; // This is an array of xy-strings
    const currentX = game_data.village.x;
    const currentY = game_data.village.y;
    const maxFields = 31;

    barbCoords = []; // Reset the array

    for (const xy of villageKeys) {
        const village = villages[xy];
        if (village.owner === "0") { // Check if it's a barbarian village
            const coordAtual = TWMap.CoordByXY(xy); // Returns [x, y] as strings
            const targetX = parseInt(coordAtual[0], 10);
            const targetY = parseInt(coordAtual[1], 10);

            const distance = TWMap.context.FATooltip.distance(currentX, currentY, targetX, targetY);
            console.log(`Aldeia Bárbara em ${targetX}|${targetY} está a ${distance.toFixed(2)} de distância.`);

            if (distance <= maxFields) {
                barbCoords.push(`${targetX}|${targetY}`);
            }
        }
    }

    if (barbCoords.length === 0) {
        UI.InfoMessage("Nenhuma aldeia bárbara encontrada no raio de 31 campos.");
        spyButton.innerText = "Nenhuma Bábara";
        spyButton.disabled = true;
    } else {
        UI.InfoMessage(`Encontradas ${barbCoords.length} aldeias bárbaras no raio de 31 campos.`);
        // Sort by distance, closest first
        barbCoords.sort((a, b) => {
            const coordA = a.split('|');
            const coordB = b.split('|');
            const distA = TWMap.context.FATooltip.distance(currentX, currentY, parseInt(coordA[0], 10), parseInt(coordA[1], 10));
            const distB = TWMap.context.FATooltip.distance(currentX, currentY, parseInt(coordB[0], 10), parseInt(coordB[1], 10));
            return distA - distB;
        });
        currentIndex = 0; // Reset index
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
    console.log('Abrindo link de envio de espião para', targetCoord);
    
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