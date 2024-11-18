document.addEventListener("DOMContentLoaded", () => {
    const header = document.getElementById("main-header");
    const currentPath = window.location.pathname;

    // Hauptnavigation einfügen
    header.innerHTML = `
        <nav>
            <ul>
                <li><a href="/index.html">Home</a></li>
                <li><a href="/src/sites/projekte.html">Projekte</a></li>
                <li><a href="/src/sites/lebenslauf.html">Lebenslauf</a></li>
                <li><a href="/src/sites/kontakt.html">Kontakt</a></li>
                <li><a href="/src/sites/armylists.html">Warhammer 40k Armee-Listen</a></li>
            </ul>
        </nav>
        <div class="sub-header">
            <nav>
                <ul id="sub-menu"></ul>
            </nav>
        </div>
    `;

    // Subheader-Inhalte basierend auf der Seite
    const subMenu = document.getElementById("sub-menu");
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
            const li = document.createElement("li");
            const a = document.createElement("a");
            a.href = item.link;
            a.textContent = item.name;
            li.appendChild(a);
            subMenu.appendChild(li);
        });
    }
});
