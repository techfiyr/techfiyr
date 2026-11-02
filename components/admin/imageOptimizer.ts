/*
 * Client-side image optimization for the admin panel.
 * Resizes large images (max 1600px width/height, keeping aspect ratio) and encodes to
 * high-quality WebP in the browser before upload. This keeps form payloads well below
 * Netlify's 6 MB serverless function limit and prevents 10-second timeout errors.
 */

const MAX_DIMENSION = 1600;
const QUALITY = 0.85;

/**
 * Optimizes an image File using HTML5 Canvas.
 * - Converts photos and screenshots to WebP (quality 0.85).
 * - Caps max dimension at 1600px (16:10 / 16:9 responsive size).
 * - Leaves animated GIFs untouched to preserve animation frames.
 * - Falls back safely to the original file if canvas or browser conversion fails.
 */
export async function optimizeImage(file: File, maxDim = MAX_DIMENSION, quality = QUALITY): Promise<File> {
	// Skip non-images or animated GIFs
	if (!file.type.startsWith('image/') || file.type === 'image/gif') {
		return file;
	}

	return new Promise((resolve) => {
		const img = new Image();
		const objectUrl = URL.createObjectURL(file);

		img.onload = () => {
			URL.revokeObjectURL(objectUrl);

			let { width, height } = img;
			if (width <= 0 || height <= 0) {
				resolve(file);
				return;
			}

			// Calculate scaled dimensions keeping aspect ratio
			if (width > maxDim || height > maxDim) {
				if (width > height) {
					height = Math.round((height * maxDim) / width);
					width = maxDim;
				} else {
					width = Math.round((width * maxDim) / height);
					height = maxDim;
				}
			}

			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext('2d');
			if (!ctx) {
				resolve(file);
				return;
			}

			// Use high-quality image smoothing
			ctx.imageSmoothingEnabled = true;
			ctx.imageSmoothingQuality = 'high';
			ctx.drawImage(img, 0, 0, width, height);

			canvas.toBlob(
				(blob) => {
					if (!blob) {
						resolve(file);
						return;
					}

					// If compressed size isn't smaller and no resize occurred, keep original
					if (blob.size >= file.size && width === img.naturalWidth && height === img.naturalHeight) {
						resolve(file);
						return;
					}

					const base = file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'image';
					const optimizedFile = new File([blob], `${base}.webp`, {
						type: 'image/webp',
						lastModified: Date.now(),
					});

					resolve(optimizedFile);
				},
				'image/webp',
				quality
			);
		};

		img.onerror = () => {
			URL.revokeObjectURL(objectUrl);
			resolve(file);
		};

		img.src = objectUrl;
	});
}

/** Formats byte size for friendly UI feedback (e.g. 142 KB, 1.2 MB). */
export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
