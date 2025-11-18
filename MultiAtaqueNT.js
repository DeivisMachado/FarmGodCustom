(function(){
    'use strict';

    if (window.Multi4Loaded) return;
    window.Multi4Loaded = true;

    const STORAGE = "multi4_br137";
    const UNITS = ["spear","sword","axe","archer","light","heavy"];

    function log(...a){ console.log("Multi4:", ...a); }
    function save(o){ sessionStorage.setItem(STORAGE, JSON.stringify(o)); }
    function load(){ return JSON.parse(sessionStorage.getItem(STORAGE) || "null"); }
    function clear(){ sessionStorage.removeItem(STORAGE); }

    function setVal(el, v){
        if (!el) return;
        el.value = v;
        el.dispatchEvent(new Event("input",{bubbles:true}));
        el.dispatchEvent(new Event("change",{bubbles:true}));
    }

    function findAttackBtn(){
        return (
            document.querySelector("input[type='submit'][value*='Atacar']") ||
            document.querySelector("#target_attack") ||
            document.querySelector("button.btn-attack")
        );
    }

    function findTargetField(){
        return (
            document.querySelector("input[name='target']") ||
            document.querySelector("#target")
        );
    }

    // ----------------------------------------------------
    // 1) CONFIRMAÇÃO AUTOMÁTICA (URL oficial)
    // ----------------------------------------------------
    if (location.href.includes("try=confirm")){

        log("Página de CONFIRMAÇÃO detectada!");

        const btn = document.querySelector("#troop_confirm_submit");

        if (btn){
            log("Clicando botão de CONFIRMAR ATAQUE...");
            setTimeout(() => btn.click(), 150);
        } else {
            log("⚠ Botão de confirmação NÃO encontrado!");
        }

        return;
    }

    // ----------------------------------------------------
    // 2) PÁGINA DE ATAQUE (screen=place&target=XXXX)
    // ----------------------------------------------------
    if (location.href.includes("screen=place") && location.href.includes("target=")) {

        log("Página de ATAQUE detectada");

        const state = load();
        if (!state) return;

        const targetField = findTargetField();
        if (state.target && targetField){
            setVal(targetField, state.target);
        }

        const troopSet = state.list[state.index];
        UNITS.forEach(u => {
            const el = document.querySelector(`input[name='${u}']`);
            if (el) setVal(el, troopSet[u]);
        });

        const btn = findAttackBtn();
        if (btn){
            log("↳ Enviando ataque automático…");
            state.index++;
            save(state);
            setTimeout(() => btn.click(), 200);
        }

        return;
    }

    // ----------------------------------------------------
    // 3) PRAÇA (screen=place sem target) → envia próximo
    // ----------------------------------------------------
    if (location.href.includes("screen=place") && !location.href.includes("target=")) {

        const state = load();

        if (state && state.index < state.list.length){

            log("De volta à PRAÇA → enviando próximo ataque");

            const targetField = findTargetField();
            const btn = findAttackBtn();

            if (targetField && btn){

                setVal(targetField, state.target);

                const troopSet = state.list[state.index];
                UNITS.forEach(u => {
                    const el = document.querySelector(`input[name='${u}']`);
                    if (el) setVal(el, troopSet[u]);
                });

                state.index++;
                save(state);

                setTimeout(() => btn.click(), 200);
            }

            return;
        }

        // Se terminou
        if (state && state.index >= state.list.length){
            alert("Todos os ataques foram enviados!");
            clear();
        }
    }

    // ----------------------------------------------------
    // 4) MODAL PRINCIPAL (configurar ataques)
    // ----------------------------------------------------
    function openModal(){
        const modal = document.createElement("div");
        modal.style.cssText = `
            position:fixed; top:0; left:0; width:100%; height:100%;
            background:rgba(0,0,0,0.65); z-index:999999;
        `;

        const box = document.createElement("div");
        box.style.cssText = `
            width:700px; margin:50px auto; background:#eee;
            padding:20px; border-radius:8px;
        `;

        box.innerHTML = `
            <h2>Multi Ataque 4x – BR137</h2>
            <p>Coordenada alvo:
            <input id="coordAlvo" style="width:120px" placeholder="123|456"></p>
        `;

        modal.appendChild(box);
        document.body.appendChild(modal);

        for (let i=1;i<=4;i++){
            const div = document.createElement("div");
            div.style.cssText = `
                border:1px solid #666; background:#fff;
                padding:10px; margin:10px 0;
            `;

            div.innerHTML = `
                <h3>Ataque ${i}</h3>
                L: <input class="atk${i}-spear" type="number" value="0">
                E: <input class="atk${i}-sword" type="number" value="0">
                M: <input class="atk${i}-axe" type="number" value="0">
                A: <input class="atk${i}-archer" type="number" value="0">
                Lv: <input class="atk${i}-light" type="number" value="0">
                P: <input class="atk${i}-heavy" type="number" value="0">
            `;

            box.appendChild(div);
        }

        const start = document.createElement("button");
        start.innerHTML = "Atacar 4x (Automático)";
        start.style.cssText = `
            padding:12px 20px; background:#c22; color:#fff;
            font-size:16px; margin-top:10px;
        `;

        start.onclick = () => {

            const queue = [];

            for (let i=1;i<=4;i++){
                queue.push({
                    spear: +document.querySelector(`.atk${i}-spear`).value,
                    sword: +document.querySelector(`.atk${i}-sword`).value,
                    axe: +document.querySelector(`.atk${i}-axe`).value,
                    archer: +document.querySelector(`.atk${i}-archer`).value,
                    light: +document.querySelector(`.atk${i}-light`).value,
                    heavy: +document.querySelector(`.atk${i}-heavy`).value,
                });
            }

            const target = document.querySelector("#coordAlvo").value;

            save({
                list: queue,
                index: 0,
                target: target
            });

            modal.remove();
            location.reload();
        };

        box.appendChild(start);

        modal.onclick = e => { if (e.target === modal) modal.remove(); };
    }

    openModal();

})();
