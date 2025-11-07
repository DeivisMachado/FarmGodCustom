// Hungarian translation provided by =Krumpli=

ScriptAPI.register('FarmGod', true, 'Warre', 'nl.tribalwars@coma.innogames.de');

window.FarmGod = {};
window.FarmGod.Library = (function () {
  /**** TribalWarsLibrary.js ****/
  // ... (manter biblioteca existente)

  return {
    getUnitSpeeds,
    processPage,
    processAllPages,
    getDistance,
    subtractArrays,
    getCurrentServerTime,
    timestampFromString,
  };
})();

window.FarmGod.Translation = (function () {
  const msg = {
    // ... (manter traduções existentes)
    pt_PT: {
      missingFeatures:
        'O script requer uma conta premium e o Assistente de Saque!',
      options: {
        title: 'Opções do FarmGod',
        warning:
          '<b>Atenção:</b><br>- Certifique-se de que o modelo A está definido como microfarm padrão e B como um microfarm maior<br>- Certifique-se de que os filtros de farm estão configurados corretamente antes de usar o script',
        filterImage:
          'https://higamy.github.io/TW/Scripts/Assets/farmGodFilters.png',
        group: 'Enviar farms do grupo:',
        distance: 'Máximo de campos para farms:',
        time: 'Quanto tempo em minutos deve haver entre farms:',
        losses: 'Enviar farm para vilas com perdas parciais:',
        maxloot: 'Enviar uma farm B se a última pilhagem foi completa:',
        newbarbs: 'Adicionar novas aldeias bárbaras para farmar:',
        button: 'Planejar farms',
        wallLevel: 'Nível da Muralha',
        customAttack: 'Ataque Personalizado'
      },
      table: {
        noFarmsPlanned:
          'Não é possível enviar farms com as configurações especificadas.',
        origin: 'Origem',
        target: 'Alvo',
        fields: 'Campos',
        farm: 'Farm',
        goTo: 'Ir para',
        wall: 'Muralha'
      },
      messages: {
        villageChanged: 'Vila alterada com sucesso!',
        villageError:
          'Todas as farms para a vila atual já foram enviadas!',
        sendError: 'Erro: farm não enviada!',
        troopsFilled: 'Tropas preenchidas para ataque',
        popupBlocked: '⚠️ Popup bloqueado! Permita pop-ups para este site.'
      },
    },
    // ... (manter outras traduções)
  };

  const get = function () {
    let lang = msg.hasOwnProperty(game_data.locale)
      ? game_data.locale
      : 'int';
    return msg[lang];
  };

  return {
    get,
  };
})();

window.FarmGod.Main = (function (Library, Translation) {
  const lib = Library;
  const t = Translation.get();
  let curVillage = null;
  let farmBusy = false;

  // ... (manter funções init, bindEventHandlers, buildOptions, buildGroupSelect)

  const buildTable = function (plan) {
    let html = `<div class="vis farmGodContent"><h4>FarmGod</h4><table class="vis" width="100%">
                <tr><div id="FarmGodProgessbar" class="progress-bar live-progress-bar progress-bar-alive" style="width:98%;margin:5px auto;"><div style="background: rgb(146, 194, 0);"></div><span class="label" style="margin-top:0px;"></span></div></tr>
                <tr>
                  <th style="text-align:center;">${t.table.origin}</th>
                  <th style="text-align:center;">${t.table.target}</th>
                  <th style="text-align:center;">${t.table.fields}</th>
                  <th style="text-align:center;">${t.table.wall}</th>
                  <th style="text-align:center;">${t.table.farm}</th>
                </tr>`;

    if (!$.isEmptyObject(plan)) {
      for (let prop in plan) {
        if (game_data.market == 'nl') {
          html += `<tr><td colspan="5" style="background: #e7d098;"><input type="button" class="btn switchVillage" data-id="${plan[prop][0].origin.id}" value="${t.table.goTo} ${plan[prop][0].origin.name} (${plan[prop][0].origin.coord})" style="float:right;"></td></tr>`;
        }

        plan[prop].forEach((val, i) => {
          const wallLevel = val.target.wallLevel || 0;
          const templateClass = wallLevel > 0 ? 'custom' : val.template.name;
          const templateId = wallLevel > 0 ? 'custom' : val.template.id;
          
          html += `<tr class="farmRow row_${i % 2 == 0 ? 'a' : 'b'}">
                    <td style="text-align:center;"><a href="${game_data.link_base_pure}info_village&id=${val.origin.id}">${val.origin.name} (${val.origin.coord})</a></td>
                    <td style="text-align:center;"><a href="${game_data.link_base_pure}info_village&id=${val.target.id}">${val.target.coord}</a></td>
                    <td style="text-align:center;">${val.fields.toFixed(2)}</td>
                    <td style="text-align:center;">${wallLevel}</td>
                    <td style="text-align:center;"><a href="#" data-origin="${val.origin.id}" data-target="${val.target.id}" data-template="${templateId}" data-wall="${wallLevel}" class="farmGod_icon farm_icon farm_icon_${templateClass}" style="margin:auto;" title="${wallLevel > 0 ? `${t.options.customAttack} (${t.table.wall}: ${wallLevel})` : ''}"></a></td>
                  </tr>`;
        });
      }
    } else {
      html += `<tr><td colspan="5" style="text-align: center;">${t.table.noFarmsPlanned}</td></tr>`;
    }

    html += `</table></div>`;

    return html;
  };

  const getData = function (group, newbarbs, losses) {
    let data = {
      villages: {},
      commands: {},
      farms: { templates: {}, farms: {} },
    };

    // ... (manter villagesProcessor e commandsProcessor existentes)

    let farmProcessor = ($html) => {
      if ($.isEmptyObject(data.farms.templates)) {
        let unitSpeeds = lib.getUnitSpeeds();

        $html
          .find('form[action*="action=edit_all"]')
          .find('input[type="hidden"][name*="template"]')
          .closest('tr')
          .map((i, el) => {
            let $el = $(el);

            return (data.farms.templates[
              $el
                .prev('tr')
                .find('a.farm_icon')
                .first()
                .attr('class')
                .match(/farm_icon_(.*)\s/)[1]
            ] = {
              id: $el
                .find('input[type="hidden"][name*="template"][name*="[id]"]')
                .first()
                .val()
                .toNumber(),
              units: $el
                .find('input[type="text"], input[type="number"]')
                .map((index, element) => {
                  return $(element).val().toNumber();
                })
                .get(),
              speed: Math.max(
                ...$el
                  .find('input[type="text"], input[type="number"]')
                  .map((index, element) => {
                    return $(element).val().toNumber() > 0
                      ? unitSpeeds[$(element).attr('name').trim().split('[')[0]]
                      : 0;
                  })
                  .get()
              ),
            });
          });

        // Adiciona template customizado para aldeias com muralha
        data.farms.templates['custom'] = {
          id: 'custom',
          units: [0, 0, 100, 1, 0, 0, 10, 0], // [spear,sword,axe,spy,light,heavy,ram,catapult]
          speed: unitSpeeds['ram'] // Usa velocidade do aríete como base
        };
      }

      $html
        .find('#plunder_list')
        .find('tr[id^="village_"]')
        .map((i, el) => {
          let $el = $(el);
          
          // Detecta nível da muralha
          const resTd = $el.find('td span.icon.header.wood').closest('td');
          const wallTd = resTd.length ? resTd.next() : null;
          const wallLevel = wallTd ? parseInt(wallTd.text().replace(/\D/g, '')) || 0 : 0;

          const coord = $el
            .find('a[href*="screen=report&mode=all&view="]')
            .first()
            .text()
            .toCoord();

          data.farms.farms[coord] = {
            id: $el.attr('id').split('_')[1].toNumber(),
            color: $el
              .find('img[src*="graphic/dots/"]')
              .attr('src')
              .match(/dots\/(green|yellow|red|blue|red_blue)/)?.[1] || '',
            max_loot: $el.find('img[src*="max_loot/1"]').length > 0,
            wallLevel: wallLevel
          };
        });

      return data;
    };

    // ... (manter findNewbarbs e filterFarms existentes)

    return Promise.all([
      lib.processAllPages(
        TribalWars.buildURL('GET', 'overview_villages', {
          mode: 'combined',
          group: group,
        }),
        villagesProcessor
      ),
      lib.processAllPages(
        TribalWars.buildURL('GET', 'overview_villages', {
          mode: 'commands',
          type: 'attack',
        }),
        commandsProcessor
      ),
      lib.processAllPages(
        TribalWars.buildURL('GET', 'am_farm'),
        farmProcessor
      ),
      findNewbarbs(),
    ])
      .then(filterFarms)
      .then(() => {
        return data;
      });
  };

  const createPlanning = function (optionDistance, optionTime, optionMaxloot, data) {
    let plan = { counter: 0, farms: {} };
    let serverTime = Math.round(lib.getCurrentServerTime() / 1000);

    for (let prop in data.villages) {
      let orderedFarms = Object.keys(data.farms.farms)
        .map((key) => {
          return { coord: key, dis: lib.getDistance(prop, key) };
        })
        .sort((a, b) => (a.dis > b.dis ? 1 : -1));

      orderedFarms.forEach((el) => {
        let farmIndex = data.farms.farms[el.coord];
        let wallLevel = farmIndex.wallLevel || 0;
        let template_name = wallLevel > 0 ? 'custom' : 
          (optionMaxloot && farmIndex.hasOwnProperty('max_loot') && farmIndex.max_loot ? 'b' : 'a');
        let template = data.farms.templates[template_name];
        
        let unitsLeft = lib.subtractArrays(data.villages[prop].units, template.units);

        let distance = lib.getDistance(prop, el.coord);
        let arrival = Math.round(
          serverTime +
          distance * template.speed * 60 +
          Math.round(plan.counter / 5)
        );
        let maxTimeDiff = Math.round(optionTime * 60);
        let timeDiff = true;

        if (data.commands.hasOwnProperty(el.coord)) {
          if (!farmIndex.hasOwnProperty('color') && data.commands[el.coord].length > 0)
            timeDiff = false;
          data.commands[el.coord].forEach((timestamp) => {
            if (Math.abs(timestamp - arrival) < maxTimeDiff)
              timeDiff = false;
          });
        } else {
          data.commands[el.coord] = [];
        }

        if (unitsLeft && timeDiff && distance < optionDistance) {
          plan.counter++;
          if (!plan.farms.hasOwnProperty(prop)) plan.farms[prop] = [];

          plan.farms[prop].push({
            origin: {
              coord: prop,
              name: data.villages[prop].name,
              id: data.villages[prop].id,
            },
            target: { 
              coord: el.coord, 
              id: farmIndex.id,
              wallLevel: wallLevel 
            },
            fields: distance,
            template: { name: template_name, id: template.id },
          });

          data.villages[prop].units = unitsLeft;
          data.commands[el.coord].push(arrival);
        }
      });
    }

    return plan;
  };

  const sendFarm = function ($this) {
    let n = Timing.getElapsedTimeSinceLoad();
    if (
      !farmBusy &&
      !(
        Accountmanager.farm.last_click &&
        n - Accountmanager.farm.last_click < 200
      )
    ) {
      farmBusy = true;
      Accountmanager.farm.last_click = n;
      let $pb = $('#FarmGodProgessbar');

      const templateId = $this.data('template');
      const wallLevel = $this.data('wall') || 0;

      if (templateId === 'custom') {
        // Abre a tela de ataque em nova aba para ataques customizados
        const link = `${location.protocol}//${location.host}/game.php?village=${$this.data('origin')}&screen=place&target=${$this.data('target')}`;
        const w = window.open(link, '_blank');
        if (!w) {
          UI.ErrorMessage(t.messages.popupBlocked);
          $pb.data('current', $pb.data('current') + 1);
          UI.updateProgressBar($pb, $pb.data('current'), $pb.data('max'));
          farmBusy = false;
          return;
        }

        let tries = 0;
        const iv = setInterval(() => {
          try {
            tries++;
            if (tries > 80) {
              clearInterval(iv);
              console.warn('Não foi possível preencher tropas para', link);
              $pb.data('current', $pb.data('current') + 1);
              UI.updateProgressBar($pb, $pb.data('current'), $pb.data('max'));
              $this.closest('.farmRow').remove();
              farmBusy = false;
              return;
            }

            const doc = w.document;
            if (!doc) return;

            const inputs = [...doc.querySelectorAll('input')];
            const findBy = regex => inputs.find(inp => {
              const s = (inp.name || '') + ' ' + (inp.id || '') + ' ' + (inp.getAttribute('data-unit') || '');
              return regex.test(s);
            });

            const axeIn = findBy(/axe|machado/i);
            const spyIn = findBy(/spy|espiao|espião/i);
            const ramIn = findBy(/ram|ariete/i);

            if (axeIn || spyIn || ramIn) {
              if (axeIn) { axeIn.value = '100'; axeIn.dispatchEvent(new Event('input', { bubbles: true })); axeIn.dispatchEvent(new Event('change', { bubbles: true })); }
              if (spyIn) { spyIn.value = '1'; spyIn.dispatchEvent(new Event('input', { bubbles: true })); spyIn.dispatchEvent(new Event('change', { bubbles: true })); }
              if (ramIn) { ramIn.value = '10'; ramIn.dispatchEvent(new Event('input', { bubbles: true })); ramIn.dispatchEvent(new Event('change', { bubbles: true })); }
              
              clearInterval(iv);
              UI.SuccessMessage(t.messages.troopsFilled);
              $pb.data('current', $pb.data('current') + 1);
              UI.updateProgressBar($pb, $pb.data('current'), $pb.data('max'));
              $this.closest('.farmRow').remove();
              farmBusy = false;
            }
          } catch (err) {
            console.error(err);
            clearInterval(iv);
            farmBusy = false;
          }
        }, 200);
      } else {
        // Usa o sistema normal de farm para templates padrão
        TribalWars.post(
          Accountmanager.send_units_link.replace(
            /village=(\d+)/,
            'village=' + $this.data('origin')
          ),
          null,
          {
            target: $this.data('target'),
            template_id: templateId,
            source: $this.data('origin'),
          },
          function (r) {
            UI.SuccessMessage(r.success);
            $pb.data('current', $pb.data('current') + 1);
            UI.updateProgressBar($pb, $pb.data('current'), $pb.data('max'));
            $this.closest('.farmRow').remove();
            farmBusy = false;
          },
          function (r) {
            UI.ErrorMessage(r || t.messages.sendError);
            $pb.data('current', $pb.data('current') + 1);
            UI.updateProgressBar($pb, $pb.data('current'), $pb.data('max'));
            $this.closest('.farmRow').remove();
            farmBusy = false;
          }
        );
      }
    }
  };

  return {
    init,
  };
})(window.FarmGod.Library, window.FarmGod.Translation);

(() => {
  window.FarmGod.Main.init();
})();