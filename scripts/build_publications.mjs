// Update the build_publications.mjs script

// Function to update the publication elements
function updatePublications() {
    const publications = getPublications(); // Assume this function gets the raw publication data.
    const publicationsDiv = document.getElementById('publications');
    publicationsDiv.innerHTML = ''; // Clear existing content

    publications.forEach(pub => {
        const pubDiv = document.createElement('div');
        pubDiv.className = 'pub';
        pubDiv.id = pub.citationKey; // Set the id to citationKey

        // Create title link if DOI/URL exists
        const titleLink = document.createElement('a');
        titleLink.textContent = pub.title;
        if (pub.doi || pub.url || pub.URL) {
            titleLink.href = pub.doi || pub.url || pub.URL;
            titleLink.target = '_blank'; // Open in new tab
        }
        pubDiv.appendChild(titleLink);

        // Add DOI/URL icon if available
        if (pub.doi || pub.url || pub.URL) {
            const iconLink = document.createElement('span');
            iconLink.innerHTML = ' 🔗'; // Add link icon
            pubDiv.appendChild(iconLink);
        }

        publicationsDiv.appendChild(pubDiv); // Append the publication div
    });

    // Update nav bar
    const nav = document.getElementById('nav');
    nav.innerHTML = ''; // Clear existing nav content
    nav.innerHTML += '<a href="home.html">Home</a>';
    nav.innerHTML += '<a href="publications.html">Publications</a>';
    nav.innerHTML += '<a href="contact.html">Contact</a>';
}

updatePublications(); // Call function to execute the updates
