document.getElementById("toggle-product-info-btn").addEventListener("click", function() {
    document.getElementById("product-info").classList.remove("hidden");
  });
  
  document.getElementById("close-product-info").addEventListener("click", function() {
    document.getElementById("product-info").classList.add("hidden");
    document.getElementById("outfit-preview").classList.add("hidden");
  });
  
  document.querySelector(".upload-btn").addEventListener("click", function() {
    // Create an input element for file upload
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    
    input.onchange = function(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          const uploadedImageContainer = document.querySelector(".uploaded-image");
          uploadedImageContainer.innerHTML = `<img src="${e.target.result}" alt="Uploaded Image" />`;
        };
        reader.readAsDataURL(file);
      }
    };
    
    input.click(); // Trigger the file input dialog
  });

  document.querySelector(".try-on-btn").addEventListener("click", function() {
    const loadingOverlay = document.getElementById("loading-overlay");
    const outfitPreview = document.getElementById("outfit-preview");
  
    // Show the loading overlay
    loadingOverlay.classList.remove("hidden");
  
    // Simulate the try-on process delay (replace this with actual try-on functionality)
    setTimeout(function() {
      // Hide the loading overlay and show the outfit preview
      loadingOverlay.classList.add("hidden");
      document.getElementById("product-info-content").classList.add("hidden");
      outfitPreview.classList.remove("hidden");
    }, 3000); // Adjust time as needed for the try-on processing
  });
  