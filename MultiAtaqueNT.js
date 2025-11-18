(function() {
    'use strict';

    if (window.MultiAtaqueLoaded) return;
    window.MultiAtaqueLoaded = true;

    const STORAGE_KEY = "multi4_queue_v3";
    const UNITS = ["spear","sword","axe","archer","light","heavy"];

    function log(...args) {
        try { console.log("Multi4:", ...args); } catch(e){}
    }

    function save(state) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function load() {
        return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
    }

    function clearState() {
        sessionStorage.removeItem(STORAGE_KEY);
    }

    function setNativeValue(el, value) {
        if (!el) return;
        el.value = value;

        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
    }

    function findTargetInput() {
        const selectors = [
            "input[name='target']",
            "input[id='target']",
            "input[name='village']",
            "input[type='text'][placeholder*='|']",
        ];

        for (const s of selectors) {
            const el = document.querySelector(s);
            if (el) return el;
        }

        return null;
    }

    function findAttackButton() {
        const selectors = [
            "input[type='submit'][value*='Atacar']",
            "#target_attack",
            "button#target_attack",
        ];

        for (const s of selectors) {
            const el = document.querySelector(s);
            if (el) return el;
        }

        return null;
    }

    // -------------------------------------------------------
    // CONFIRMAÇÃO AUTOMÁTICA (AJUSTADO PELO SEU HTML REAL)
    // -------------------------------------------------------
    if (location.href.includes("try=confirm")) {
        console.log("CONFIRM PAGE — buscando #troop_confirm_submit");

        const btn = document.querySelector("#troop_confirm_submit");

        if (btn) {
            console.log("Botão encontrado → ENVIANDO ATAQUE");
            setTimeout(() => btn.click(), 150);
        } else {
            console.log("⚠ ERRO: Botão de confirmação não encontrado.");
        }

        return;
    }

    // -------------------------------------------------------
    // SE HÁ FILA → CONTINUAR ENVIO
    // -------------------------------------------------------
    const saved = load();

    if (saved && saved.index < saved.list.length) {
        log("Reiniciando próximo ataque", saved);

        const attempt = () => {
            const target = findTargetInput();
            const btnAtk = findAttackButton();

            if (target && btnAtk) {

                // set coordenada
                setNativeValue(target, saved.target);

                // set tropas
                const pack = saved.list[saved.index];
                UNITS.forEach(u => {
                    const inp = document.querySelector(`input[name='${u}']`);
                    if (inp) setNativeValue(inp, pack[u]);
                });

                // avança fila
                saved.index++;
                save(saved);

                // clica
                setTimeout(() => btnAtk.click(), 120);

                return true;
            }

            return false;
        };

        let tries = 0;
        const iv = setInterval(() => {
            tries++;
            if (attempt()) clearInterval(iv);
            if (tries > 100) clearInterval(iv);
        }, 80);

        return;
    }

    // -------------------------------------------------------
    // MODAL PRINCIPAL
    // -------------------------------------------------------
    function openModal() {
        const modal = document.createElement("div");
        modal.style.position = "fixed";
        modal.style.top = 0;
        modal.style.left = 0;
        modal.style.width = "100%";
        modal.style.height = "100%";
        modal.style.background = "rgba(0,0,0,0.6)";
        modal.style.zIndex = 999999;

        const box = document.createElement("div");
        box.style.width = "700px";
        box.style.margin = "50px auto";
        box.style.background = "#eee";
        box.style.padding = "20px";
        box.style.borderRadius = "8px";
        box.style.maxHeight = "85%";
        box.style.overflow = "auto";

        box.innerHTML = `
            <h2>Multi Ataque 4x</h2>
            <p>Coordenada alvo: <input id="coordAlvo" style="width:120px" placeholder="123|456"></p>
            <p>Configure as tropas para cada ataque:</p>
        `;

        modal.appendChild(box);
        document.body.appendChild(modal);

        for (let i = 1; i <= 4; i++) {
            const atk = document.createElement("div");
            atk.style.border = "1px solid #999";
            atk.style.padding = "12px";
            atk.style.margin = "10px 0";
            atk.style.background = "#fff";

            atk.innerHTML = `
                <h3>Ataque ${i}</h3>
                Lanceiro: <input type="number" class="atk${i}-spear" value="0"> 
                Espada: <input type="number" class="atk${i}-sword" value="0">
                Machado: <input type="number" class="atk${i}-axe" value="0">
                Arqueiro: <input type="number" class="atk${i}-archer" value="0">
                Leve: <input type="number" class="atk${i}-light" value="0">
                Pesado: <input type="number" class="atk${i}-heavy" value="0">
                <br><br>
                <button data-id="${i}" class="btnSingle" style="padding:5px 15px">Atacar ${i}</button>
            `;

            box.appendChild(atk);
        }

        // botão 4x
        const seq = document.createElement("button");
        seq.innerHTML = "Atacar 4x (sequência automática)";
        seq.style.padding = "10px 20px";
        seq.style.marginTop = "10px";
        seq.style.background = "#c33";
        seq.style.color = "#fff";
        seq.style.fontSize = "16px";
        box.appendChild(seq);

        seq.onclick = () => {
            const q = [];

            for (let i = 1; i <= 4; i++) {
                q.push({
                    spear: +document.querySelector(`.atk${i}-spear`).value || 0,
                    sword: +document.querySelector(`.atk${i}-sword`).value || 0,
                    axe: +document.querySelector(`.atk${i}-axe`).value || 0,
                    archer: +document.querySelector(`.atk${i}-archer`).value || 0,
                    light: +document.querySelector(`.atk${i}-light`).value || 0,
                    heavy: +document.querySelector(`.atk${i}-heavy`).value || 0
                });
            }

            const target = document.querySelector("#coordAlvo").value;

            save({
                list: q,
                index: 0,
                target
            });

            modal.remove();
            location.reload(); // força execução automática
        };

        // ataques individuais
        box.querySelectorAll(".btnSingle").forEach(b => {
            b.addEventListener("click", () => {
                const id = b.dataset.id;
                UNITS.forEach(u => {
                    const pageInput = document.querySelector(`input[name="${u}"]`);
                    const modalInput = document.querySelector(`.atk${id}-${u}`);
                    if (pageInput && modalInput) {
                        setNativeValue(pageInput, modalInput.value);
                    }
                });

                const btn = findAttackButton();
                if (btn) btn.click();
            });
        });

        modal.onclick = e => {
            if (e.target === modal) modal.remove();
        };
    }

    openModal();

})();
