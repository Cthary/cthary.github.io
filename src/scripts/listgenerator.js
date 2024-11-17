document.addEventListener('DOMContentLoaded', () => {
    const armyContainer = document.getElementById('army-container');

    // Lade die Indexdatei mit der Liste aller JSON-Dateien
    fetch('/src/files/armylists/index.json')
        .then(response => response.json())
        .then(files => {
            files.forEach(file => {
                fetch(`/src/files/armylists/${file}`)
                    .then(response => response.json())
                    .then(data => renderArmyList(data, armyContainer))
                    .catch(error => console.error(`Fehler beim Verarbeiten von ${file}:`, error));
            });
        })
        .catch(error => console.error('Fehler beim Abrufen der Indexdatei:', error));
});

// Funktion, um eine Armee-Liste zu rendern
function renderArmyList(data, container) {
    const roster = data.roster;
    const forces = roster.forces;

    forces.forEach(force => {
        const forceDiv = document.createElement('div');
        forceDiv.classList.add('force');

        // Fraktion und Detachment
        const detachmentName = force.selections.find(sel => sel.type === 'upgrade')?.name || 'Unbekannt';
        forceDiv.innerHTML = `
            <h3>Fraktion: ${force.categories.find(cat => cat.name.startsWith('Faction'))?.name || 'Unbekannt'}</h3>
            <p>Detachment: ${detachmentName}</p>
        `;

        // Einheitenübersicht
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
}
