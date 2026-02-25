// Assuming this is the modified loadHouseAndPosts function implementation.

function loadHouseAndPosts() {
    // Fetch all available posts without pagination
    fetch('/api/posts')
        .then(response => response.json())
        .then(data => {
            displayPosts(data);
        })
        .catch(error => {
            console.error('Error fetching posts:', error);
        });
}

function displayPosts(posts) {
    // Implementation for displaying all posts
    const postsContainer = document.getElementById('posts-container');
    postsContainer.innerHTML = '';
    posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.classList.add('post');
        postElement.innerHTML = `<h2>${post.title}</h2><p>${post.content}</p>`;
        postsContainer.appendChild(postElement);
    });
}