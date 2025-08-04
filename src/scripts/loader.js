async function loadPart(file, target) {
    const response = await fetch(file);
    if (response.ok) {
        const content = await response.text();
        if (target === "head") {
            // Parse and append head content
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = content;
            const headElements = tempDiv.querySelectorAll("link, meta, title, script, style");
            headElements.forEach((el) => document.head.appendChild(el));
        } else {
            document.querySelector(target).innerHTML = content;
        }
    } else {
        console.error(`Error loading ${file}:`, response.status);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadPart("/src/sites/imports/head.html", "head");
    loadPart("/src/sites/imports/header.html", "header");
    loadPart("/src/sites/imports/footer.html", "footer");
});
