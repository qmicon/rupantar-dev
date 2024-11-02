document.getElementById("toggle-product-info-btn").addEventListener("click", function() {
    document.getElementById("product-info").classList.remove("hidden");
  });

  const productInfoSec = document.getElementById("1st-p");
  const outfitPreviewSec = document.getElementById("2nd-p");
  
  document.getElementById("close-product-info").addEventListener("click", function() {
    document.getElementById("product-info").classList.add("hidden");
    const productInfoSec = document.getElementById("1st-p");
    const outfitPreviewSec = document.getElementById("2nd-p");

    if (productInfoSec.classList.contains("hidden")) productInfoSec.classList.remove("hidden");
    if (!outfitPreviewSec.classList.contains("hidden")) outfitPreviewSec.classList.add("hidden");
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
    const productInfoSec = document.getElementById("1st-p");
    const outfitPreviewSec = document.getElementById("2nd-p");
  
    // Show the loading overlay
    loadingOverlay.classList.remove("hidden");
  
    // Simulate the try-on process delay (replace this with actual try-on functionality)
    setTimeout(function() {
      // Hide the loading overlay and show the outfit preview
      loadingOverlay.classList.add("hidden");
      productInfoSec.classList.add("hidden");
      outfitPreviewSec.classList.remove("hidden");
    }, 3000); // Adjust time as needed for the try-on processing
  });

  document.querySelector(".add-to-cart-btn").addEventListener("click", function(event) {
    // Get the product ID from the data attribute
    const productId = event.target.getAttribute("data-product-id");

    // Construct formData with the product ID
    let formData = {
        'items': [{
            'id': parseInt(productId), // Ensure it's an integer
            'quantity': 1 // Set desired quantity
        }]
    };

    // Send the POST request to Shopify's cart API
    fetch(window.Shopify.routes.root + 'cart/add.js', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        return response.json();
    })
    .then(data => {
        alert("Product successfully added to cart!");
        window.location.href = '/cart';
        // Optional: Add a success message or redirect to the cart
    })
    .catch((error) => {
        console.error("Error adding product to cart:", error);
    });
});

document.querySelector(".new-image-btn").addEventListener("click", function() {
    const productInfoSec = document.getElementById("1st-p");
    const outfitPreviewSec = document.getElementById("2nd-p");
    const uploadedImageContainer = document.querySelector(".uploaded-image");
    const image = uploadedImageContainer.querySelector("img");

    if (image) {
        image.src = ""; // Clears the image by setting the source to an empty string
        image.classList.add("hidden");
    }


    if (productInfoSec.classList.contains("hidden")) productInfoSec.classList.remove("hidden");
    if (!outfitPreviewSec.classList.contains("hidden")) outfitPreviewSec.classList.add("hidden");
  });

  