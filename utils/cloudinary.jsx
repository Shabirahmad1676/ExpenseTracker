// utils/cloudinary.js
export const uploadImageToCloudinary = async (imageUri, uploadPreset = "expense") => {
  const formData = new FormData();
  formData.append("file", {
    uri: imageUri,
    type: "image/jpeg",
    name: "upload.jpg",
  });
  formData.append("upload_preset", uploadPreset);

  
  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/djpsorllx/image/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (data.secure_url) {
      return data.secure_url; // ✅ Cloudinary hosted URL
    } else {
      throw new Error("Upload failed");
    }
  } catch (err) {
    console.error("Cloudinary Upload Error:", err);
    throw new Error(`Cloudinary upload failed: ${err.message || 'Unknown error'}`);
  }
};
