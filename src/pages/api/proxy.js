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
                            /* Hide Google/Microsoft login buttons */
                            .col-span-3.flex.flex-col.items-center.space-y-3 {
                                display: none !important;
                            }
                            /* Hide status/links section */
                            .mx-4.max-w-md.w-full.rounded.md\\:shadow-lg.mt-4 {
                                display: none !important;
                            }
                            /* Hide Google Sign-in button specifically */
                            .nsm7Bb-HzV7m-LgbsSe {
                                display: none !important;
                            }
                            /* Hide Microsoft login button */
                            button[class*="rounded px-4 py-2 bg-white border border-gray-200"] {
                                display: none !important;
                            }
                            
                            /* Make replaced logos appropriately sized */
                            img[src*="flow.cynex.lk"] {
                                max-width: 200px !important;
                                height: auto !important;
                                max-height: 60px !important;
                            }
                            
                            /* Cynex loading screen */
                            #cynex-loading {
                                position: fixed;
                                top: 0;
                                left: 0;
                                width: 100%;
                                height: 100%;
                                background: #000;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                z-index: 9999;
                                flex-direction: column;
                            }
                            #cynex-loading img {
                                max-width: 80px;
                                height: auto;
                                margin-bottom: 15px;
                            }
                            #cynex-loading .loading-text {
                                color: #fff;
                                font-size: 14px;
                                font-family: Arial, sans-serif;
                            }
                        </style>
                        <div id="cynex-loading">
                            <img src="https://flow.cynex.lk/logo.png" alt="Cynex" />
                            <div class="loading-text">Loading Cynex Invoicing...</div>
                        </div>
                        <script>
                            // Immediate logo replacement - no delay
                            (function() {
                                const vercelUrl = '${'https://flow.cynex.lk/'}';
                                const logoUrl = vercelUrl + '/logodark.png';
                                const lightLogoUrl = vercelUrl + '/logo.png';
                                
                                // Hide loading screen when page is ready
                                function hideLoadingScreen() {
                                    const loadingScreen = document.getElementById('cynex-loading');
                                    if (loadingScreen) {
                                        loadingScreen.style.display = 'none';
                                    }
                                }
                                
                                // Track if logos have been replaced
                                let logosReplaced = false;
                                
                                // Check if logos have been replaced
                                function checkLogosReplaced() {
                                    const darkImages = document.querySelectorAll('img[src*="dark.png"]');
                                    const lightImages = document.querySelectorAll('img[src*="light.png"]');
                                    const invoiceninjaImages = document.querySelectorAll('img[src*="invoiceninja-logo@dark-NBnSUBp5.png"]');
                                    
                                    // Check if any original logos still exist
                                    let hasOriginalLogos = false;
                                    
                                    darkImages.forEach(function(img) {
                                        if (img.src.includes('dark.png') && !img.src.includes('flow.cynex.lk')) {
                                            hasOriginalLogos = true;
                                        }
                                    });
                                    
                                    lightImages.forEach(function(img) {
                                        if (img.src.includes('light.png') && !img.src.includes('flow.cynex.lk')) {
                                            hasOriginalLogos = true;
                                        }
                                    });
                                    
                                    invoiceninjaImages.forEach(function(img) {
                                        if (img.src.includes('invoiceninja-logo@dark-NBnSUBp5.png') && !img.src.includes('flow.cynex.lk')) {
                                            hasOriginalLogos = true;
                                        }
                                    });
                                    
                                    if (!hasOriginalLogos && (darkImages.length > 0 || lightImages.length > 0 || invoiceninjaImages.length > 0)) {
                                        logosReplaced = true;
                                        hideLoadingScreen();
                                    }
                                }
                                
                                // Hide loading screen after 8 seconds maximum (fallback)
                                setTimeout(function() {
                                    if (!logosReplaced) {
                                        hideLoadingScreen();
                                    }
                                }, 8000);
                                
                                // Replace images immediately
                                function replaceImages() {
                                    // Dark images
                                    const darkImages = document.querySelectorAll('img[src*="dark.png"]');
                                    darkImages.forEach(function(img) {
                                        if (img.src.includes('dark.png')) {
                                            img.src = logoUrl;
                                            img.style.maxWidth = '100%';
                                            img.style.height = 'auto';
                                            img.style.objectFit = 'contain';
                                        }
                                    });
                                    
                                    // Light images
                                    const lightImages = document.querySelectorAll('img[src*="light.png"]');
                                    lightImages.forEach(function(img) {
                                        if (img.src.includes('light.png')) {
                                            img.src = lightLogoUrl;
                                            img.style.maxWidth = '100%';
                                            img.style.height = 'auto';
                                            img.style.objectFit = 'contain';
                                        }
                                    });
                                    
                                    // Invoiceninja images
                                    const invoiceninjaImages = document.querySelectorAll('img[src*="invoiceninja-logo@dark-NBnSUBp5.png"]');
                                    invoiceninjaImages.forEach(function(img) {
                                        if (img.src.includes('invoiceninja-logo@dark-NBnSUBp5.png')) {
                                            img.src = lightLogoUrl;
                                            img.style.maxWidth = '100%';
                                            img.style.height = 'auto';
                                            img.style.objectFit = 'contain';
                                        }
                                    });
                                    
                                    // Check if logos have been replaced after each replacement
                                    checkLogosReplaced();
                                }
                                
                                // Run immediately
                                replaceImages();
                                
                                // Also run on DOM ready
                                if (document.readyState === 'loading') {
                                    document.addEventListener('DOMContentLoaded', replaceImages);
                                }
                                
                                // Run on interval for dynamic content
                                setInterval(function() {
                                    // Replace images on interval
                                    replaceImages();
                                
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
                                
                                // Hide Google/Microsoft login buttons (backup to CSS)
                                const loginSections = document.querySelectorAll('.col-span-3.flex.flex-col.items-center.space-y-3');
                                loginSections.forEach(function(section) {
                                    section.style.display = 'none';
                                    section.remove();
                                });
                                
                                // Hide status/links section (backup to CSS)
                                const statusSections = document.querySelectorAll('.mx-4.max-w-md.w-full.rounded');
                                statusSections.forEach(function(section) {
                                    if (section.textContent.includes('Check status') || section.textContent.includes('Applications') || section.textContent.includes('Documentation')) {
                                        section.style.display = 'none';
                                        section.remove();
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
                            })();
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
