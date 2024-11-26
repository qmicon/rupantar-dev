window.addEventListener('DOMContentLoaded', function() {
  document.querySelector(".try-on-btn").disabled = true;
});

document.getElementById("toggle-product-info-btn").addEventListener("click", function() {
  document.getElementById("product-info").classList.remove("hidden");
});

document.getElementById("close-product-info").addEventListener("click", function() {
  document.getElementById("product-info").classList.add("hidden");
});

document.querySelector(".upload-btn").addEventListener("click", function() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  
  input.onchange = function(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        const uploadedImageContainer = document.querySelector(".uploaded-image");
        // Create temporary image to get dimensions
        const tempImg = new Image();
        tempImg.onload = function() {
          const tryOnButton = document.querySelector(".try-on-btn");
          tryOnButton.setAttribute('data-original-width', this.width);
          tryOnButton.setAttribute('data-original-height', this.height);
          // Continue with existing image display
          uploadedImageContainer.innerHTML = `<img src="${e.target.result}" alt="Uploaded Image" />`;
        };
        tempImg.src = e.target.result;
        
        const formData = new FormData();
        formData.append('image', file);
        
        // Get and append product image URL and title
        const productImage = document.querySelector('.product-image img');
        const productImageUrl = productImage.getAttribute('data-product-image');
        const productTitle = productImage.getAttribute('data-product-title');
        const productType = productImage.getAttribute('data-product-type');
        console.log(productImageUrl, productTitle);
        formData.append('productImageUrl', productImageUrl);
        formData.append('productTitle', productTitle);
        formData.append('productType', productType);

        // Disable try-on button and show loading state
        const tryOnButton = document.querySelector(".try-on-btn");
        tryOnButton.disabled = true;
        tryOnButton.classList.add('loading');

        fetch('/tools/rupantarai', {
          method: 'POST',
          body: formData,
          redirect: 'manual'// Include the access token if needed
          })
        .then(response => {
          console.log('Response status:', response.status);
          if (response.status === 200) {
            return response.json();
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        })
        .then(data => {
          console.log('Response data:', data);
          if (data.success) {
            tryOnButton.setAttribute('data-image-id', data.id);
            tryOnButton.disabled = false;
          } else {
            throw new Error(data.error || 'Upload failed');
          }
        })
        .catch(error => {
          console.error('Error uploading image:', error);
          tryOnButton.disabled = true;
          
          // Reset the image container on error
          const uploadedImageContainer = document.querySelector(".uploaded-image");
          const image = uploadedImageContainer.querySelector("img");
          if (image) {
            image.src = ""; // Clears the image by setting the source to an empty string
            image.classList.add("hidden");
          }
          
          showNotification({
            message: 'Unable to process the uploaded image. Please try after sometime.',
            backgroundColor: '#dc3545',
            textColor: 'white',
            duration: 4000
          });
        })
        .finally(() => {
          // Remove loading state regardless of success/failure
          tryOnButton.classList.remove('loading');
        });
      };
      reader.readAsDataURL(file);
    }
  };
  
  input.click();
});

document.querySelector(".try-on-btn").addEventListener("click", function() {
  const loadingOverlay = document.getElementById("loading-overlay");
  const imageId = this.getAttribute('data-image-id');

  loadingOverlay.classList.remove("hidden");

  function checkStatus() {
    fetch(`/tools/rupantarai?id=${imageId}`, {
      method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        if (data.status === 'processing') {
          setTimeout(checkStatus, 5000);
        } else if (data.status === 'success') {
          const productInfoSec = document.getElementById("1st-p");
          const outfitPreviewSec = document.getElementById("2nd-p");
          const productImage = document.querySelector('.product-image img');
          const tryOnButton = document.querySelector(".try-on-btn");
          
          // Get original dimensions
          const originalWidth = parseInt(tryOnButton.getAttribute('data-original-width'));
          const originalHeight = parseInt(tryOnButton.getAttribute('data-original-height'));
          
          // Create a new image to load the generated result
          const generatedImage = new Image();
          generatedImage.crossOrigin = "anonymous";
          
          // Create imageLoadPromise that includes canvas processing
          const imageLoadPromise = new Promise((resolve, reject) => {
            generatedImage.onload = function() {
              // Create canvas
              const canvas = document.createElement('canvas');
              canvas.width = originalWidth;
              canvas.height = originalHeight;
              const ctx = canvas.getContext('2d');
              
              // Draw and resize the image
              ctx.drawImage(generatedImage, 0, 0, originalWidth, originalHeight);
              
              // Set processed image to product image
              productImage.src = canvas.toDataURL('image/jpeg');
              productImage.onload = resolve;
              productImage.onerror = reject;
            };
            generatedImage.onerror = reject;
            generatedImage.src = data.imageUrl;
          });

          // Wait for image processing and loading before updating UI
          imageLoadPromise
            .then(() => {
              loadingOverlay.classList.add("hidden");
              productInfoSec.classList.add("hidden");
              outfitPreviewSec.classList.remove("hidden");
            })
            .catch(() => {
              throw new Error('Failed to load generated image');
            });
        } else {
          throw new Error('Failed to generate image');
        }
      } else {
        throw new Error(data.error || 'Failed to generate image');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      loadingOverlay.classList.add("hidden");
      showNotification({
        message: 'Error generating try-on image. Please try again.',
        backgroundColor: '#dc3545',
        textColor: 'white',
        duration: 4000
      });
    });
  }

  checkStatus();
});

function showNotification(options = {}) {
  const {
    message = 'Added to cart successfully!',
    backgroundColor = '#4CAF50',
    textColor = 'white',
    duration = 3000
  } = options;

  const notification = document.getElementById('notification');
  notification.querySelector('.message').textContent = message;
  notification.style.setProperty('--notification-bg', backgroundColor);
  notification.style.setProperty('--notification-color', textColor);
  
  notification.classList.remove('hidden');
  notification.classList.add('show');
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.classList.add('hidden'), 300);
  }, duration);
}

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
          return response.json().then(errorData => {
              throw new Error(errorData.description || "Error adding to cart");
          });
      }
      return response.json();
  })
  .then(data => {
      showNotification({
          message: 'Successfully added to cart!',
          backgroundColor: '#007bff',
          textColor: 'white',
          duration: 3000
      });
      
      window.location.href = '/cart';
  })
  .catch((error) => {
      console.error("Error adding product to cart:", error);
      showNotification({
          message: error.message,
          backgroundColor: '#dc3545',
          textColor: 'white',
          duration: 4000
      });
  });
});

document.querySelector(".new-image-btn").addEventListener("click", function() {
  const productInfoSec = document.getElementById("1st-p");
  const outfitPreviewSec = document.getElementById("2nd-p");
  const uploadedImageContainer = document.querySelector(".uploaded-image");
  const image = uploadedImageContainer.querySelector("img");
  const productImage = document.querySelector('.product-image img');

  if (image) {
      image.src = ""; // Clears the image by setting the source to an empty string
      image.classList.add("hidden");
  }

  // Reset product image to original source
  productImage.src = productImage.getAttribute('data-product-image');

  document.querySelector(".try-on-btn").disabled = true;

  if (productInfoSec.classList.contains("hidden")) productInfoSec.classList.remove("hidden");
  if (!outfitPreviewSec.classList.contains("hidden")) outfitPreviewSec.classList.add("hidden");
});

// Add popup functionality
document.querySelector('.product-image img').addEventListener('click', function() {
  const popup = document.getElementById('imagePopup');
  const popupImage = popup.querySelector('.popup-image');
  popupImage.src = this.src;
  popup.classList.remove('hidden');
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
});

document.querySelector('.popup-close-btn').addEventListener('click', function() {
  const popup = document.getElementById('imagePopup');
  popup.classList.add('hidden');
  document.body.style.overflow = ''; // Restore scrolling
});

// Close popup when clicking outside the image
document.getElementById('imagePopup').addEventListener('click', function(e) {
  if (e.target === this) {
    this.classList.add('hidden');
    document.body.style.overflow = ''; // Restore scrolling
  }
});

