document.addEventListener("DOMContentLoaded", function () {
    const applyButton = document.getElementById("apply-button");
    const filteredEstablishmentsContainer = document.getElementById("filtered-establishments-container");
  
    applyButton.addEventListener("click", function () {
      const selectedRatings = Array.from(document.querySelectorAll('input[name="stars"]:checked'))
                              .map(checkbox => parseInt(checkbox.value, 10));
  
      // Construct the query string
      const queryString = selectedRatings.map(rating => `stars=${rating}`).join("&");
  
      // Send AJAX request
      fetch(`/view-establishment.hbs?${queryString}`)
        .then(response => response.text())
        .then(data => {
          // Update the content of the filtered-establishments-container with the filtered establishments HTML
          filteredEstablishmentsContainer.innerHTML = data;
        })
        .catch(error => {
          console.error("Error:", error);
        });
    });
  });