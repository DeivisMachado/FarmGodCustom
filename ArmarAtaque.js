(function() {
    'use strict';

    let alreadyTriggered = false;

    function checkRemainingTime() {
        const span = document.querySelector("#remainingTime");
        if (!span) return;

        const raw = span.textContent.trim();

        // Remove coisas como "seconds", "s", "sec", etc.
        const cleaned = raw
            .toLowerCase()
            .replace(/seconds?/g, "")
            .replace(/secs?/g, "")
            .replace(/s/g, "")
            .replace(/[^\d:\-]/g, "")  // remove letras e símbolos
            .trim();

        // FORMAS ACEITAS como 1 segundo:
        const isOneSecond =
            cleaned === "1" ||        // apenas 1
            cleaned === "01" ||       // 01
            cleaned === "0:01" ||     // 0:01
            cleaned === "00:01" ||    // 00:01
            /^0+:0*1$/.test(cleaned); // qualquer combinação tipo 000:001

        if (isOneSecond && !alreadyTriggered) {

            alreadyTriggered = true;

            console.log("🔥 Valor EXATO de 1 segundo detectado:", raw);

            setTimeout(() => {

                const btn =
                    document.querySelector("#troop_confirm_submit") ||
                    document.querySelector("input[type='submit'][value*='Atacar']") ||
                    document.querySelector("button.btn-attack");

                if (btn) {
                    console.log("⚔ Enviando ataque automaticamente!");
                    btn.click();
                } else {
                    console.log("❌ Nenhum botão de ataque encontrado.");
                }

            }, 100);
        }

        // Se houver tempo negativo, pode liberar novamente
        if (raw.includes('-')) {
            alreadyTriggered = false;
        }
    }

    setInterval(checkRemainingTime, 50);

})();
