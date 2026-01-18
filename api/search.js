export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { categories } = req.body;

        if (!categories || !Array.isArray(categories)) {
            return res.status(400).json({ error: 'Categories array is required' });
        }

        const serpApiKey = process.env.SERPAPI_KEY;
        const results = {};

        // Common coupon codes by retailer
        const couponDatabase = {
            'ASOS': { code: 'EXTRA20', discount: '20% off' },
            'H&M': { code: 'HMNEW15', discount: '15% off first order' },
            'Nordstrom': { code: 'STYLE10', discount: '$10 off $50+' },
            'Zara': { code: 'WELCOME10', discount: '10% off' },
            'Madewell': { code: 'INSIDER25', discount: '25% off' },
            'Anthropologie': { code: 'ANTHRO20', discount: '20% off full price' },
            'Target': { code: 'CIRCLE10', discount: '10% with Target Circle' },
            'Amazon': { code: 'FASHION15', discount: '15% select styles' },
            'Amazon.com': { code: 'FASHION15', discount: '15% select styles' },
            'Revolve': { code: 'NEWREVOLVE', discount: '10% first order' },
            'Shopbop': { code: 'STYLE15', discount: '15% off' },
            'Urban Outfitters': { code: 'UONEW10', discount: '10% off' },
            'Free People': { code: 'FREESHIP', discount: 'Free shipping' },
            'Gap': { code: 'GAPFRIEND', discount: '40% off' },
            'Old Navy': { code: 'ONMORE', discount: '30% off' },
            'Banana Republic': { code: 'BRCARD', discount: '20% off' },
            'J.Crew': { code: 'SHOPNOW', discount: '25% off' },
            'Everlane': { code: 'WELCOME10', discount: '10% first order' },
            'Lululemon': { code: 'SWEAT15', discount: '15% off' },
            'Nike': { code: 'SPORT20', discount: '20% off select' },
            'Adidas': { code: 'ADIDAS15', discount: '15% off' }
        };

        for (const category of categories) {
            try {
                if (serpApiKey) {
                    // Use real SerpAPI
                    const searchUrl = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(category.searchQuery)}&api_key=${serpApiKey}&num=6&gl=us`;
                    const response = await fetch(searchUrl);

                    if (response.ok) {
                        const data = await response.json();
                        const products = (data.shopping_results || []).slice(0, 4).map(item => {
                            const source = item.source || 'Shop';
                            return {
                                title: item.title,
                                price: item.extracted_price || item.price,
                                originalPrice: item.old_price ? parseFloat(item.old_price.replace(/[^0-9.]/g, '')) : null,
                                image: item.thumbnail,
                                link: item.link,
                                source: source,
                                rating: item.rating,
                                reviews: item.reviews,
                                coupon: couponDatabase[source] || null
                            };
                        });

                        results[category.name] = {
                            ...category,
                            products
                        };
                        continue;
                    }
                }

                // Fallback to mock data if no API key or request failed
                results[category.name] = {
                    ...category,
                    products: await getMockProducts(category, couponDatabase)
                };

            } catch (error) {
                console.warn(`Search failed for ${category.name}:`, error);
                results[category.name] = {
                    ...category,
                    products: await getMockProducts(category, couponDatabase)
                };
            }
        }

        return res.status(200).json(results);

    } catch (error) {
        console.error('Search error:', error);
        return res.status(500).json({
            error: error.message || 'Failed to search products'
        });
    }
}

async function getMockProducts(category, couponDatabase) {
    const mockStores = ['Nordstrom', 'ASOS', 'Zara', 'H&M', 'Madewell', 'Anthropologie', 'Urban Outfitters', 'Free People'];
    const products = [];

    // Use Unsplash for realistic fashion photos
    const fashionKeywords = {
        'Top': 'fashion-shirt',
        'Tops': 'fashion-shirt',
        'Blouse': 'blouse-fashion',
        'Sweater': 'sweater-fashion',
        'Jacket': 'jacket-fashion',
        'Blazer': 'blazer-fashion',
        'Bottom': 'jeans-fashion',
        'Bottoms': 'jeans-fashion',
        'Pants': 'pants-fashion',
        'Jeans': 'jeans-fashion',
        'Skirt': 'skirt-fashion',
        'Trousers': 'trousers-fashion',
        'Dress': 'dress-fashion',
        'Shoes': 'shoes-fashion',
        'Footwear': 'shoes-fashion',
        'Heels': 'heels-fashion',
        'Boots': 'boots-fashion',
        'Sneakers': 'sneakers-fashion',
        'Accessories': 'fashion-accessories',
        'Bag': 'handbag-fashion',
        'Jewelry': 'jewelry-fashion',
        'Outerwear': 'coat-fashion',
        'Coat': 'coat-fashion'
    };

    // Find matching keyword or use generic fashion
    let imageKeyword = 'fashion-clothing';
    for (const [key, value] of Object.entries(fashionKeywords)) {
        if (category.name.toLowerCase().includes(key.toLowerCase())) {
            imageKeyword = value;
            break;
        }
    }

    for (let i = 0; i < 4; i++) {
        const price = Math.floor(Math.random() * 100) + 30;
        const hasDiscount = Math.random() > 0.5;
        const source = mockStores[Math.floor(Math.random() * mockStores.length)];

        // Use Unsplash Source for real fashion photos
        const imageUrl = `https://source.unsplash.com/300x300/?${imageKeyword}&sig=${category.name}${i}`;

        products.push({
            title: `${category.searchQuery} - Style ${i + 1}`,
            price: price,
            originalPrice: hasDiscount ? Math.floor(price * 1.3) : null,
            image: imageUrl,
            link: `https://www.google.com/search?q=${encodeURIComponent(category.searchQuery)}&tbm=shop`,
            source: source,
            coupon: couponDatabase[source] || null
        });
    }

    return products;
}
