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
                // Skip text replacement for JavaScript files to prevent syntax errors
                if (proxyRes.headers['content-type'] && proxyRes.headers['content-type'].includes('javascript')) {
                    return responseBuffer;
                }
                
                if (!['image/png', 'image/jpg', 'image/jpeg', 'image/gif'].includes(proxyRes.headers['content-type'])) {
                    const additionalJS = `
                        <style>
                            /* Hide elements immediately with CSS */
                            .fixed.bottom-4.right-4.z-50 {
                                display: none !important;
                            }
                            button[style*="background: rgb(33, 118, 255)"] {
                                display: none !important;
                            }
                        </style>
                        <script>
                            setInterval(function() {
                                const vercelUrl = '${'https://flow.cynex.lk/'}';
                                const logoUrl = vercelUrl + '/logodark.png';
                                
                                // Replace document title from Stockifly to CynexFlow
                                if (document.title.includes('Stockifly')) {
                                    document.title = document.title.replace(/Stockifly/g, 'CynexFlow');
                                }
                                
                                // Replace document title from Invoice Ninja to Cynex Invoicing
                                if (document.title.includes('Invoice Ninja')) {
                                    document.title = document.title.replace(/Invoice Ninja/g, 'Cynex Invoicing');
                                }
                                
                                // Hide phone verification notification (backup to CSS)
                                const phoneVerifyDivs = document.querySelectorAll('div.fixed.bottom-4.right-4.z-50, div[class*="fixed"][class*="bottom-4"][class*="right-4"]');
                                phoneVerifyDivs.forEach(function(div) {
                                    if (div.textContent.includes('Please verify your phone number') || div.textContent.includes('Verify Phone Number')) {
                                        div.style.display = 'none';
                                        div.remove();
                                    }
                                });
                                
                                // Hide "Unlock Pro" / "Upgrade" button (backup to CSS)
                                const upgradeButtons = document.querySelectorAll('button');
                                upgradeButtons.forEach(function(button) {
                                    if ((button.textContent.includes('Unlock Pro') || button.textContent.includes('Upgrade')) && 
                                        (button.style.background.includes('rgb(33, 118, 255)') || button.getAttribute('style')?.includes('rgb(33, 118, 255)'))) {
                                        button.style.display = 'none';
                                        button.remove();
                                    }
                                });
                                
                                // Replace "Invoice Ninja" with "Cynex Invoicing" in all text content
                                const walker = document.createTreeWalker(
                                    document.body,
                                    NodeFilter.SHOW_TEXT,
                                    null,
                                    false
                                );
                                
                                let node;
                                while (node = walker.nextNode()) {
                                    if (node.textContent.includes('Invoice Ninja')) {
                                        node.textContent = node.textContent.replace(/Invoice Ninja/g, 'Cynex Invoicing');
                                    }
                                }
                                
                                // Replace any dark.png URL with VERCEL_URL/logodark.png in all img src attributes
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
                                
                                // Replace any light.png URL with VERCEL_URL/logo.png in all img src attributes
                                const lightImages = document.querySelectorAll('img[src*="light.png"]');
                                const lightLogoUrl = vercelUrl + '/logo.png';
                                lightImages.forEach(function(img) {
                                    if (img.src.includes('light.png')) {
                                        img.src = lightLogoUrl;
                                        // Fix image sizing to prevent chopping
                                        img.style.maxWidth = '100%';
                                        img.style.height = 'auto';
                                        img.style.objectFit = 'contain';
                                    }
                                });
                                
                                // Replace invoiceninja-logo@dark-NBnSUBp5.png with VERCEL_URL/logo.png in all img src attributes
                                const invoiceninjaImages = document.querySelectorAll('img[src*="invoiceninja-logo@dark-NBnSUBp5.png"]');
                                invoiceninjaImages.forEach(function(img) {
                                    if (img.src.includes('invoiceninja-logo@dark-NBnSUBp5.png')) {
                                        img.src = lightLogoUrl;
                                        // Fix image sizing to prevent chopping
                                        img.style.maxWidth = '100%';
                                        img.style.height = 'auto';
                                        img.style.objectFit = 'contain';
                                    }
                                });
                                
                                // Replace any dark.png URL with VERCEL_URL/logodark.png in all background-image styles
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
                                    // Also replace invoiceninja-logo@dark-NBnSUBp5.png URLs in background images
                                    if (style.backgroundImage && style.backgroundImage.includes('invoiceninja-logo@dark-NBnSUBp5.png')) {
                                        el.style.backgroundImage = style.backgroundImage.replace(/https?:\\/\\/[^\\/]+\\/react\\/invoiceninja-logo\\@dark-NBnSUBp5\\.png/g, lightLogoUrl);
                                        el.style.backgroundSize = 'contain';
                                        el.style.backgroundRepeat = 'no-repeat';
                                        el.style.backgroundPosition = 'center';
                                    }
                                });
                            }, 100);
                        </script>
                    `;
                    return replaceFunc([globalReplace, process.env.REPLACE,(!process.env.SPINOFF) ? globalSpin : null], responseBuffer.toString('utf8')).replace(new RegExp('[A-Z][A-Z0-9]?-[A-Z0-9]{4,10}(?:-[1-9]d{0,3})?'), process.env.ANALYTICS).replace('</head>', '<script>' + includeFunc(process.env.JS) + '</script><style>' + includeFunc(process.env.CSS) + '</style>' + additionalJS + '</head>')
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
