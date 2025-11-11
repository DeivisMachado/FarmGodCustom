$(document).ready(function () {
    var button = document.createElement('button');

    button.addEventListener("click", sendSpiesToBarbs);
    button.innerText = "Enviar 1 espião para bárbaras";
    button.style.textAlign = "center";
    button.className = "btn btn-instant-free";

    var div = document.createElement('div');

    div.style.display = "unset";
    div.style.marginLeft = "10px"

    div.appendChild(button);

    var continente = document.getElementById("content_value");
    continente.insertBefore(div, continente.firstChild);
});

function sendSpyTo(targetCoord) {
    const origin = game_data.village.id;
    const target = targetCoord;
    const link = `${location.protocol}//${location.host}/game.php?village=${origin}&screen=place&target=${target}`;
    
    const w = window.open(link, '_blank');
    if (!w) {
        UI.ErrorMessage('⚠️ Popup bloqueado! Permita pop-ups para este site.');
        return false; // Stop processing if popups are blocked
    }

    let tries = 0;
    const iv = setInterval(() => {
        try {
            tries++;
            if (tries > 80) { // 16 seconds timeout
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
            if (!doc || doc.readyState !== 'complete') return; // Wait for window to load

            const spyInput = doc.querySelector('input[name="spy"]');

            if (spyInput) {
                spyInput.value = '1';
                spyInput.dispatchEvent(new Event('input', { bubbles: true }));
                spyInput.dispatchEvent(new Event('change', { bubbles: true }));
                clearInterval(iv);
                console.log(`✅ Tropa (1 espião) preenchida para ${target}`);
                // Close the window after 1 second
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
    return true;
}

function sendSpiesToBarbs() {
    let villages = TWMap.villages;
    let vk = TWMap.villageKey;
    let key = {};
    let barbCoords = [];
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
        return;
    }

    UI.InfoMessage(`Encontradas ${barbCoords.length} aldeias bárbaras. Iniciando envio de espiões...`);

    let index = 0;
    function processNext() {
        if (index < barbCoords.length) {
            console.log(`Enviando para ${index + 1}/${barbCoords.length}: ${barbCoords[index]}`);
            if (sendSpyTo(barbCoords[index])) {
                index++;
                // Increase delay to avoid being blocked
                setTimeout(processNext, 1000); // 1 second delay
            } else {
                // Stop if popups are blocked
                UI.ErrorMessage("Processo interrompido pois os popups estão bloqueados.");
            }
        } else {
            UI.SuccessMessage("Finalizado o envio de espiões para " + barbCoords.length + " aldeias.");
        }
    }

    processNext();
}