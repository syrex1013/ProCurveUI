import path from 'path';

export const preloadPath = path.join(__dirname, 'dist/preload.js');
export const mainPath = path.join(__dirname, 'dist/main/index.js');
export const htmlPath = path.join(__dirname, 'dist/renderer/index.html');

export const isDevelopment = process.env.NODE_ENV === 'development';
