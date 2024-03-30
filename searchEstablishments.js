document.addEventListener("DOMContentLoaded", function() {
    const searchForm = document.querySelector(".search-form");
    const searchInput = document.querySelector(".search-input");
    const establishmentsContainer = document.querySelector(".main-list");
  
    searchForm.addEventListener("submit", function(event) {
      event.preventDefault(); // Prevent the form from submitting traditionally
  
      const query = searchInput.value.trim();
      if (query) {
        fetch(`/search?query=${encodeURIComponent(query)}`, {
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        })
        .then(response => response.text())
        .then(html => {
          establishmentsContainer.innerHTML = html;
        })
        .catch(error => console.error("Error:", error));
      }
    });
  });
  