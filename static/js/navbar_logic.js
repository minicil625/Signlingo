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