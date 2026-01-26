/**
 * Compress an image file before upload
 * @param {File} file - The image file to compress
 * @param {number} maxWidth - Maximum width (default: 1920)
 * @param {number} maxHeight - Maximum height (default: 1080)
 * @param {number} quality - Compression quality 0-1 (default: 0.8)
 * @returns {Promise<File>} - Compressed image file
 */
export async function compressImage(file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions
                let width = img.width;
                let height = img.height;

                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = width * ratio;
                    height = height * ratio;
                }

                // Create canvas
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                // Draw and compress
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to blob
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Failed to compress image'));
                            return;
                        }

                        // Create new file from blob
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        });

                        resolve(compressedFile);
                    },
                    'image/jpeg',
                    quality
                );
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target.result;
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Compress a video file (basic compression by reducing resolution)
 * Note: This is a simple client-side compression. For better results, use server-side transcoding.
 * @param {File} file - The video file
 * @returns {Promise<File>} - Returns original file (client-side video compression is limited)
 */
export async function compressVideo(file) {
    // Client-side video compression is very limited
    // For now, we'll just return the original file
    // TODO: Implement server-side transcoding for better compression
    console.warn('Client-side video compression is not implemented. Consider server-side transcoding.');
    return file;
}

/**
 * Check if a file should be compressed
 * @param {File} file
 * @returns {boolean}
 */
export function shouldCompress(file) {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return imageTypes.includes(file.type) && file.size > 500000; // Compress if > 500KB
}
