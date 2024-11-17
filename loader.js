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

document.addEventListener('DOMContentLoaded', () => {
    loadPart('src/sites/head.html', 'head');
    loadPart('src/sites/header.html', 'header');
    loadPart('src/sites/footer.html', 'footer');
});
