(function() {
    'use strict';

    let alreadyTriggered = false;

    function checkRemainingTime() {
        const span = document.querySelector("#remainingTime");
        if (!span) return;

        const text = span.textContent.trim();

        // Detecta 1s (várias formas, dependendo do formato do contador)
        const isOneSecond =
            text === "1" ||
            text === "1s" ||
            text.includes("1 second") ||
            text.endsWith(":01") ||
            text.match(/(^1\b| 1\b)/);

        if (isOneSecond && !alreadyTriggered) {

            alreadyTriggered = true; // impede múltiplos cliques

            console.log("🔥 1 segundo detectado — aguardando 100ms…");

            setTimeout(() => {

                const btn =
                    document.querySelector("#troop_confirm_submit") ||     // confirmação
                    document.querySelector("input[type='submit'][value*='Atacar']") || // ataque
                    document.querySelector("button.btn-attack");

                if (btn) {
                    console.log("⚔ Enviando ataque automaticamente!");
                    btn.click();
                } else {
                    console.log("❌ Nenhum botão para enviar ataque encontrado.");
                }

            }, 100);
        }

        // Opcional: quando fica negativo, pode resetar
        if (text.includes('-')) {
            alreadyTriggered = false;
        }
    }

    setInterval(checkRemainingTime, 50); // alta precisão

})();
