const {createProxyMiddleware, responseInterceptor} = require("http-proxy-middleware");
const {includeFunc, replaceFunc} = require('../../utils/helpers');
const globalReplace = require('../../utils/replace');
const globalSpin = require('../../utils/spin');
const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
    // Handle specific image path replacements - serve logo.png directly
    if (req.url === '/images/light.png') {
        const logoPath = path.join(process.cwd(), 'public', 'logo.png');
        
        if (fs.existsSync(logoPath)) {
            const fileBuffer = fs.readFileSync(logoPath);
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Cache-Control', 'public, max-age=31536000');
            res.setHeader('Content-Length', fileBuffer.length);
            return res.end(fileBuffer);
        } else {
            return res.status(404).send('Logo not found');
        }
    }
    
    createProxyMiddleware({
        changeOrigin: true,
        on: {
            proxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
                // Skip text replacement for JavaScript files and other assets to prevent syntax errors
                const contentType = proxyRes.headers['content-type'] || '';
                if (contentType.includes('javascript') || 
                    contentType.includes('application/json') || 
                    req.url.endsWith('.js') || 
                    req.url.endsWith('.json') ||
                    req.url.endsWith('.css')) {
                    return responseBuffer;
                }
                
                if (!['image/png', 'image/jpg', 'image/jpeg', 'image/gif'].includes(proxyRes.headers['content-type'])) {
                    // Apply text replacement but protect URLs from being corrupted
                    let content = responseBuffer.toString('utf8');
                    
                    // Temporarily protect URLs from text replacement
                    const urlRegex = /https?:\/\/[^\s"'<>]+/g;
                    const urls = content.match(urlRegex) || [];
                    const protectedUrls = urls.map((url, index) => `__PROTECTED_URL_${index}__`);
                    
                    // Replace URLs with placeholders (use a more robust replacement)
                    urls.forEach((url, index) => {
                        const placeholder = `__PROTECTED_URL_${index}__`;
                        content = content.split(url).join(placeholder);
                    });
                    
                    // Also protect relative URLs that might be corrupted
                    const relativeUrlRegex = /[a-zA-Z0-9-]+\.vercel\.app[a-zA-Z0-9\/\-\.]+/g;
                    const relativeUrls = content.match(relativeUrlRegex) || [];
                    relativeUrls.forEach((url, index) => {
                        const placeholder = `__PROTECTED_RELATIVE_URL_${index}__`;
                        content = content.split(url).join(placeholder);
                    });
                    
                    // Apply text replacement
                    content = replaceFunc([globalReplace, process.env.REPLACE,(!process.env.SPINOFF) ? globalSpin : null], content);
                    
                    // Restore relative URLs first
                    relativeUrls.forEach((url, index) => {
                        const placeholder = `__PROTECTED_RELATIVE_URL_${index}__`;
                        content = content.replace(placeholder, url);
                    });
                    
                    // Restore URLs
                    protectedUrls.forEach((placeholder, index) => {
                        content = content.replace(placeholder, urls[index]);
                    });
                    
                    const additionalJS = `
                        <script>
                            setInterval(function() {
                                // Use relative URLs for logos to avoid complex Vercel URLs
                                const logoUrl = '/logodark.png';
                                const lightLogoUrl = '/logo.png';
                                
                                // Replace document title from Stockifly to CynexFlow
                                if (document.title.includes('Stockifly')) {
                                    document.title = document.title.replace(/Stockifly/g, 'CynexFlow');
                                }
                                
                                // Replace any dark.png URL with /logodark.png in all img src attributes
                                const images = document.querySelectorAll('img[src*="dark.png"]');
                                images.forEach(function(img) {
                                    if (img.src.includes('dark.png')) {
                                        img.src = logoUrl;
                                        // Fix image sizing to prevent chopping
                                        img.style.maxWidth = '100%';
                                        img.style.height = 'auto';
                                        img.style.objectFit = 'contain';
                                    }
                                });
                                
                                // Replace any light.png URL with /logo.png in all img src attributes
                                const lightImages = document.querySelectorAll('img[src*="light.png"]');
                                lightImages.forEach(function(img) {
                                    if (img.src.includes('light.png')) {
                                        img.src = lightLogoUrl;
                                        // Fix image sizing to prevent chopping
                                        img.style.maxWidth = '100%';
                                        img.style.height = 'auto';
                                        img.style.objectFit = 'contain';
                                    }
                                });
                                
                                // Replace any dark.png URL with /logodark.png in all background-image styles
                                const elements = document.querySelectorAll('*');
                                elements.forEach(function(el) {
                                    const style = window.getComputedStyle(el);
                                    if (style.backgroundImage && style.backgroundImage.includes('dark.png')) {
                                        el.style.backgroundImage = style.backgroundImage.replace(/https?:\\/\\/[^\\/]+\\/images\\/dark\\.png/g, logoUrl);
                                        el.style.backgroundSize = 'contain';
                                        el.style.backgroundRepeat = 'no-repeat';
                                        el.style.backgroundPosition = 'center';
                                    }
                                    // Also replace light.png URLs in background images
                                    if (style.backgroundImage && style.backgroundImage.includes('light.png')) {
                                        el.style.backgroundImage = style.backgroundImage.replace(/https?:\\/\\/[^\\/]+\\/images\\/light\\.png/g, lightLogoUrl);
                                        el.style.backgroundSize = 'contain';
                                        el.style.backgroundRepeat = 'no-repeat';
                                        el.style.backgroundPosition = 'center';
                                    }
                                });
                            }, 100);
                        </script>
                    `;
                    // Apply analytics replacement and inject additional JS/CSS
                    content = content.replace(new RegExp('[A-Z][A-Z0-9]?-[A-Z0-9]{4,10}(?:-[1-9]d{0,3})?'), process.env.ANALYTICS).replace('</head>', '<script>' + includeFunc(process.env.JS) + '</script><style>' + includeFunc(process.env.CSS) + '</style>' + additionalJS + '</head>');
                    
                    return content;
                }
                let image = await Jimp.read(responseBuffer)
                image.flip(true, false).sepia().pixelate(1)
                return image.getBufferAsync(Jimp.AUTO)
            }),
            
        },
        selfHandleResponse: true,
        target: process.env.TARGET,
    })(req, res);
};
