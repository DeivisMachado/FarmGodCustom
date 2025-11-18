(function() {
    'use strict';

    let alreadyTriggered = false;

    // ---- INDICADOR VISUAL ----
    function showArmedIndicator() {
        if (document.querySelector("#autoAttackStatus")) return;

        const box = document.createElement("div");
        box.id = "autoAttackStatus";
        box.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 140, 0, 0.90);
            color: #fff;
            padding: 10px 15px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: bold;
            z-index: 999999;
            box-shadow: 0 0 10px #0004;
            font-family: Arial, sans-serif;
        `;

        box.textContent = "✓ AUTO-ATAQUE ARMADO";
        document.body.appendChild(box);
    }

    function flashTriggered() {
        const el = document.querySelector("#autoAttackStatus");
        if (!el) return;

        el.style.background = "rgba(180, 0, 0, 0.90)";
        el.textContent = "⚔ ATAQUE ENVIADO!";

        setTimeout(() => {
            el.remove();
        }, 5000);
    }

    showArmedIndicator();


    // ---- MONITOR DO TIMER ----
    function checkRemainingTime() {
        const span = document.querySelector("#remainingTime");
        if (!span) return;

        const raw = span.textContent.trim();

        // Remove texto e símbolos, deixando só números e :
        const cleaned = raw
            .toLowerCase()
            .replace(/seconds?/g, "")
            .replace(/secs?/g, "")
            .replace(/s/g, "")
            .replace(/[^\d:]/g, "")
            .trim();

        // Converter tempo para segundos
        const parts = cleaned.split(":").map(n => parseInt(n || 0));

        let totalSeconds = 0;
        if (parts.length === 3) totalSeconds = parts[0]*3600 + parts[1]*60 + parts[2];
        else if (parts.length === 2) totalSeconds = parts[0]*60 + parts[1];
        else if (parts.length === 1) totalSeconds = parts[0];

        // Detecta exatamente 1
        if (totalSeconds === 1 && !alreadyTriggered) {

            alreadyTriggered = true;
            console.log("🔥 Valor EXATO de 1 segundo detectado:", raw);

            setTimeout(() => {

                const btn =
                    document.querySelector("#troop_confirm_submit") ||
                    document.querySelector("input[type='submit'][value*='Atacar']") ||
                    document.querySelector("button.btn-attack");

                if (btn) {
                    console.log("⚔ Enviando ataque automaticamente!");
                    flashTriggered(); // muda o aviso
                    btn.click();
                } else {
                    console.log("❌ Nenhum botão de ataque encontrado.");
                }

            }, 100);
        }

        // Libera novo disparo quando o tempo fica negativo
        if (raw.includes('-')) {
            alreadyTriggered = false;
        }
    }

    setInterval(checkRemainingTime, 50);

})();
