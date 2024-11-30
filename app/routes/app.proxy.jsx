import { authenticate } from '../shopify.server';
import { json } from "@remix-run/node";

export const action = async ({ request }) => {
  console.log("-------------hit app proxy-------------");
  await authenticate.public.appProxy(request);

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }

  if (request.method === 'POST') {
    try {
      const formData = await request.formData();
      const image = formData.get('image');
      const productImageUrl = formData.get('productImageUrl');
      const productTitle = formData.get('productTitle');
      const productType = formData.get('productType');
      console.log(productImageUrl, productTitle, productType)
      
      // Create new FormData for ImgBB API
      const apiFormData = new FormData();
      apiFormData.append('image', image);
      apiFormData.append('key', process.env.IMGHIPPO_API_KEY); // Reusing the same API key

      // Upload to ImgBB
      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: apiFormData
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.data?.message || 'Upload failed');
      }

      // Call ModelLab API with the new image URL
      const modelLabResponse = await fetch('https://modelslab.com/api/v6/image_editing/fashion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key: process.env.MODELLAB_API_KEY,
          prompt: `A realistic photo of a model wearing a ${productTitle}`,
          negative_prompt: "Low quality, unrealistic, bad cloth, warped cloth",
          init_image: result.data.url, // Using ImgBB's URL format
          cloth_image: productImageUrl,
          cloth_type: productType,
          guidance_scale: 7.5,
          num_inference_steps: 21,
          seed: null,
          temp: false,
          webhook: null,
          track_id: null
        })
      });

      const modelLabResult = await modelLabResponse.json();
      console.log(modelLabResult)

      return json({
        success: true,
        id: modelLabResult.id,
        imageUrl: modelLabResult.future_links[0], // Use first future link
      });

    } catch (error) {
      console.error('Error uploading image:', error);
      return json({ 
        error: 'Upload failed',
        message: error.message 
      }, { status: 500 });
    }
  }

  return json({ error: 'Method not allowed' }, { status: 405 });
};

export const loader = async ({ request }) => {
  await authenticate.public.appProxy(request);

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  
  if (!id) {
    return json({ error: 'ID is required' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://modelslab.com/api/v6/image_editing/fetch/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ key: process.env.MODELLAB_API_KEY })
    });
    
    const result = await response.json();
    console.log(result);
    return json({
      success: true,
      status: result.status,
      imageUrl: result.output?.[0]
    });
    
  } catch (error) {
    console.error('Error checking status:', error);
    return json({ 
      error: 'Status check failed',
      message: error.message 
    }, { status: 500 });
  }
};
