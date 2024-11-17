document.addEventListener('DOMContentLoaded', () => {
    const tabsContainer = document.getElementById('tabs-container');
    const contentContainer = document.getElementById('content-container');

    fetch('/src/files/armylists/index.json')
        .then(response => response.json())
        .then(data => {
            const armiesByFaction = groupArmiesByFaction(data);

            Object.keys(armiesByFaction).forEach(faction => {
                const factionTab = createFactionTab(faction, armiesByFaction[faction]);
                tabsContainer.appendChild(factionTab);
            });

            if (Object.keys(armiesByFaction).length > 0) {
                const firstFaction = Object.keys(armiesByFaction)[0];
                const firstDetachment = armiesByFaction[firstFaction][0];
                loadArmyDetails(firstDetachment.path, contentContainer);
            }
        })
        .catch(error => console.error('Fehler beim Laden der Armeeliste:', error));
});

function groupArmiesByFaction(data) {
    const grouped = {};
    Object.values(data).forEach(army => {
        if (!grouped[army.faction]) {
            grouped[army.faction] = [];
        }
        grouped[army.faction].push(army);
    });
    return grouped;
}

function createFactionTab(faction, armies) {
    const tab = document.createElement('div');
    tab.classList.add('tab');

    const title = document.createElement('h2');
    title.textContent = faction;
    tab.appendChild(title);

    const detachmentList = document.createElement('ul');
    armies.forEach(army => {
        const detachmentItem = document.createElement('li');
        detachmentItem.textContent = army.Detachment;

        detachmentItem.addEventListener('click', () => {
            const contentContainer = document.getElementById('content-container');
            contentContainer.innerHTML = '';
            loadArmyDetails(army.path, contentContainer);
        });

        detachmentList.appendChild(detachmentItem);
    });

    tab.appendChild(detachmentList);
    return tab;
}

function loadArmyDetails(filePath, container) {
    fetch(`/src/files/armylists/${filePath}`)
        .then(response => response.json())
        .then(data => {
            const roster = data.roster;
            const forces = roster.forces;

            forces.forEach(force => {
                const forceDiv = document.createElement('div');
                forceDiv.classList.add('force');

                const unitList = document.createElement('ul');
                force.selections.forEach(selection => {
                    if (selection.type === 'model' || selection.type === 'unit') {
                        const unitItem = document.createElement('li');
                        const costs = selection.costs.find(cost => cost.name === 'pts')?.value || 0;

                        unitItem.innerHTML = `
                            <strong>${selection.name}</strong> (Punkte: ${costs})
                            <ul>
                                ${selection.selections.map(opt => `<li>${opt.name}</li>`).join('')}
                            </ul>
                        `;
                        unitList.appendChild(unitItem);
                    }
                });

                forceDiv.appendChild(unitList);
                container.appendChild(forceDiv);
            });
        })
        .catch(error => console.error(`Fehler beim Laden von ${filePath}:`, error));
}
