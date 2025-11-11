$(document).ready(function () {
    // Cria a interface do usuário para os botões de espionagem
    const mainContainer = document.createElement('div');
    mainContainer.style.padding = "10px";
    mainContainer.style.border = "1px solid #c19a6b";
    mainContainer.style.marginBottom = "10px";

    const title = document.createElement('h3');
    title.innerText = "Espiar Bárbaras (raio de 31 campos)";
    mainContainer.appendChild(title);

    const buttonContainer = document.createElement('div');
    buttonContainer.id = "spy_buttons_container";
    mainContainer.appendChild(buttonContainer);
    
    const content = document.getElementById("content_value");
    content.insertBefore(mainContainer, content.firstChild);

    // Carrega as aldeias e cria os botões
    loadAndCreateSpyButtons();
});

function loadAndCreateSpyButtons() {
    const buttonContainer = document.getElementById('spy_buttons_container');
    buttonContainer.innerHTML = ''; // Limpa botões antigos

    const villages = TWMap.villages;
    const villageKeys = TWMap.villageKey;
    const currentX = game_data.village.x;
    const currentY = game_data.village.y;
    const maxDistance = 31;
    let foundCount = 0;

    for (const key of villageKeys) {
        const village = villages[key];
        if (village.owner == "0") { // É uma aldeia bárbara
            const coord = TWMap.CoordByXY(key);
            const distance = TWMap.context.FATooltip.distance(currentX, currentY, coord[0], coord[1]);

            if (distance <= maxDistance) {
                foundCount++;
                const coordString = `${coord[0]}|${coord[1]}`;
                
                const button = document.createElement('button');
                button.innerHTML = `Espiar ${coordString} (<strong>${distance.toFixed(1)}</strong> campos)`;
                button.className = "btn";
                button.style.margin = "3px";
                
                button.addEventListener('click', function() {
                    sendSpyTo(coordString);
                    button.disabled = true;
                    button.style.backgroundColor = '#a1a1a1';
                    button.innerHTML = `✔️ Enviado para ${coordString}`;
                });

                buttonContainer.appendChild(button);
            }
        }
    }

    if (foundCount === 0) {
        buttonContainer.innerHTML = '<p>Nenhuma aldeia bárbara encontrada no raio de 31 campos.</p>';
        UI.InfoMessage("Nenhuma aldeia bárbara encontrada no raio definido.");
    } else {
        UI.InfoMessage(`Encontradas ${foundCount} aldeias bárbaras para espionar.`);
    }
}

function sendSpyTo(targetCoord) {
    const origin = game_data.village.id;
    const link = `${location.protocol}//${location.host}/game.php?village=${origin}&screen=place&target=${targetCoord}`;
    
    const w = window.open(link, '_blank');
    if (!w) {
        UI.ErrorMessage("O envio de espião foi interrompido porque o popup foi bloqueado pelo navegador.");
        return false;
    }

    let tries = 0;
    const iv = setInterval(() => {
        try {
            tries++;
            if (tries > 80) { // Timeout de ~16 segundos
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
    return true;
}