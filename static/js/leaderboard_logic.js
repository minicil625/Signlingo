document.addEventListener('DOMContentLoaded', function() {
    const searchForm = document.getElementById('friendSearchForm');
    const searchInput = document.getElementById('friendSearchInput');
    const resultsContainer = document.getElementById('friendsListContainer');
    
    // ▼▼▼ NEW: Get a reference to the main leaderboard list ▼▼▼
    const friendsLeaderboardList = document.getElementById('friendsLeaderboardList');

    // This is our fake user database.
    const dummyUsers = [
        { id: 101, name: 'Alex Johnson' },
        { id: 102, name: 'Brenda Smith' },
        { id: 103, name: 'Charlie Brown' },
        { id: 104, name: 'Diana Prince' },
        { id: 105, name: 'Ethan Hunt' },
        { id: 106, name: 'Fiona Glenanne' },
        { id: 107, name: 'George Costanza' },
        { id: 108, name: 'Hannah Abbott' },
        { id: 109, name: 'Ian Malcolm' },
        { id: 110, name: 'Jessica Rabbit' }
    ];

    // This function simulates searching our dummy database.
    const handleSearch = (event) => {
        // ... (This function remains unchanged)
        event.preventDefault();
        const query = searchInput.value.trim().toLowerCase();
        resultsContainer.innerHTML = `<div class="text-center p-4">Searching...</div>`;
        setTimeout(() => {
            if (query.length < 2) {
                resultsContainer.innerHTML = `<div class="text-center p-4 text-muted"><p>Please enter at least 2 characters.</p></div>`;
                return;
            }
            const results = dummyUsers.filter(user => user.name.toLowerCase().includes(query));
            renderSearchResults(results);
        }, 500);
    };

    // This function renders the search results in the modal.
    const renderSearchResults = (users) => {
        // ... (This function also remains unchanged)
        resultsContainer.innerHTML = '';
        if (users.length === 0) {
            resultsContainer.innerHTML = `<div class="text-center p-4 text-muted">No users found.</div>`;
            return;
        }
        users.forEach(user => {
            const userCardHTML = `
                <div class="player-card">
                    <div class="player-info">
                        <div class="player-avatar">${user.name[0]}</div>
                        <span class="player-name">${user.name}</span>
                    </div>
                    <button class="btn-add-friend" data-user-id="${user.id}">
                        <i class="fas fa-user-plus"></i>
                    </button>
                </div>
            `;
            resultsContainer.insertAdjacentHTML('beforeend', userCardHTML);
        });
    };

    // ▼▼▼ NEW: Function to add a friend to the main leaderboard ▼▼▼
    const addFriendToLeaderboard = (userData) => {
        // Calculate the new rank based on the number of friends already in the list
        const newRank = friendsLeaderboardList.children.length + 1;

        // Create the HTML for the new leaderboard row
        const friendRowHTML = `
            <div class="player-card">
                <div class="player-info">
                    <div class="player-rank">
                        ${newRank}
                    </div>
                    <div class="player-avatar">
                        ${userData.name[0]}
                    </div>
                    <span class="player-name">${userData.name}</span>
                </div>
                <div class="player-points">
                    <span class="points-value">0</span>
                    <span class="points-label">XP</span>
                </div>
            </div>
        `;

        // Append the new row to the list
        friendsLeaderboardList.insertAdjacentHTML('beforeend', friendRowHTML);
    };
    
    // Add the event listener to the form
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
    }
    
    // ▼▼▼ UPDATED: Click listener now also adds the friend to the main list ▼▼▼
    resultsContainer.addEventListener('click', function(event) {
        const button = event.target.closest('.btn-add-friend');
        if (button) {
            const playerCard = button.closest('.player-card');
            
            // Get the user's data from the card that was clicked
            const userId = button.dataset.userId;
            const userName = playerCard.querySelector('.player-name').textContent;
            
            // Call the new function to add the friend to the main list
            addFriendToLeaderboard({ id: userId, name: userName });
            
            // Animate and remove the card from the search results
            playerCard.classList.add('player-card--removing');
            setTimeout(() => {
                playerCard.remove();
            }, 300);

            console.log(`User ${userName} (ID: ${userId}) was successfully added.`);
        }
    });
});