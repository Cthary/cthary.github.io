async function loadPart(file, target) {
    const response = await fetch(file);
    if (response.ok) {
        const content = await response.text();
        if (target === 'head') {
            // Parse and append head content
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;
            const headElements = tempDiv.querySelectorAll('link, meta, title, script, style');
            headElements.forEach((el) => document.head.appendChild(el));
        } else {
            document.querySelector(target).innerHTML = content;
        }
    } else {
        console.error(`Error loading ${file}:`, response.status);
    }
}

async function loadHeaderWithSubMenu() {
    // Lade den Header
    await loadPart('/src/sites/imports/header.html', 'header');

    // Füge dynamisch den Subheader hinzu
    const subMenu = document.querySelector('.sub-header #sub-menu');
    if (subMenu) {
        const currentPath = window.location.pathname;
        const subHeaderContent = {
            "/src/sites/armylists/bloodangels.html": [
                { name: "Blood Angels", link: "/src/sites/armylists/bloodangels.html" },
                { name: "Tyranids", link: "/src/sites/armylists/tyranids.html" },
            ],
            "/src/sites/armylists/tyranids.html": [
                { name: "Blood Angels", link: "/src/sites/armylists/bloodangels.html" },
                { name: "Tyranids", link: "/src/sites/armylists/tyranids.html" },
            ]
        };

        const items = subHeaderContent[currentPath];
        if (items) {
            items.forEach(item => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = item.link;
                a.textContent = item.name;
                li.appendChild(a);
                subMenu.appendChild(li);
            });
        }
    } else {
        console.error('Sub-header element not found!');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // Lade alle Teile
    await loadPart('/src/sites/imports/head.html', 'head');
    await loadHeaderWithSubMenu();
    await loadPart('/src/sites/imports/footer.html', 'footer');
});
