document.addEventListener('DOMContentLoaded', () => {
    const armyContainer = document.getElementById('army-container');

    // Lade die Indexdatei mit der neuen Struktur
    fetch('/src/files/armylists/index.json')
        .then(response => response.json())
        .then(data => {
            // Iteriere über die Armeelisten in der Indexdatei
            Object.values(data).forEach(army => {
                const armyDiv = document.createElement('div');
                armyDiv.classList.add('army');

                // Basisinformationen aus der Indexdatei anzeigen
                armyDiv.innerHTML = `
                    <h2>${army.name}</h2>
                    <p>Fraktion: ${army.faction}</p>
                    <p>Detachment: ${army.detachment}</p>
                    <p>Größe: ${army.size} Punkte</p>
                `;

                // Lade die spezifische Armee-JSON und füge Details hinzu
                fetch(`/src/files/armylists/${army.path}`)
                    .then(response => response.json())
                    .then(rosterData => renderArmyDetails(rosterData, armyDiv))
                    .catch(error => console.error(`Fehler beim Laden von ${army.path}:`, error));

                armyContainer.appendChild(armyDiv);
            });
        })
        .catch(error => console.error('Fehler beim Laden der Indexdatei:', error));
});

// Funktion zum Rendern von Armee-Details
function renderArmyDetails(data, container) {
    const forces = data.roster.forces;

    forces.forEach(force => {
        const forceDiv = document.createElement('div');
        forceDiv.classList.add('force');

        // Liste der Einheiten
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
