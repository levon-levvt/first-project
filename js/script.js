// Lade Projekte aus JSON
async function loadProjects() {
    try {
        const response = await fetch('../data/data.json');
        const data = await response.json();
        
        const container = document.getElementById('projects-container');
        container.innerHTML = '';
        
        data.projects.forEach(project => {
            const card = document.createElement('div');
            card.className = 'project-card';
            card.innerHTML = `
                <h3>${project.title}</h3>
                <p>${project.description}</p>
                <p><strong>Technologien:</strong> ${project.technologies.join(', ')}</p>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Fehler beim Laden der Projekte:', error);
    }
}

// Smooth Scrolling für Navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Projekte laden wenn Seite geladen ist
document.addEventListener('DOMContentLoaded', loadProjects);
