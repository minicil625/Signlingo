document.addEventListener('DOMContentLoaded', function() {
    const moreOptionsButton = document.getElementById('moreOptionsButton');
    const dropupMenu = document.getElementById('dropupMenu');

    if (moreOptionsButton) {
        moreOptionsButton.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent click from closing the menu immediately
            dropupMenu.classList.toggle('show');
        });
    }

    // Close the dropup menu if clicking outside of it
    document.addEventListener('click', (event) => {
        if (dropupMenu && !dropupMenu.contains(event.target) && !moreOptionsButton.contains(event.target)) {
            if (dropupMenu.classList.contains('show')) {
                dropupMenu.classList.remove('show');
            }
        }
    });
});

document.addEventListener("DOMContentLoaded", function() {
    const profileName = document.getElementById("profileName");
    if (profileName) {
        const fullName = profileName.textContent.trim();
        const maxLength = 12;

        if (fullName.length > maxLength) {
            let shortName = fullName.substring(0, maxLength).trimEnd();
            profileName.textContent = shortName + "...";
        }
    }
});