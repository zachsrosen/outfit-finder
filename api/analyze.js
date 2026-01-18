import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

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
              const { description } = req.body;

          if (!description) {
                        return res.status(400).json({ error: 'Description is required' });
          }

          const message = await client.messages.create({
                        model: 'claude-sonnet-4-20250514',
                        max_tokens: 1024,
                        messages: [{
                                          role: 'user',
                                          content: `You are a fashion expert helping someone find the perfect outfit. Based on this description, break it down into specific clothing categories with search queries.

                                          Outfit description: "${description}"

                                          Respond with ONLY valid JSON in this exact format (no markdown, no code blocks):
                                          {
                                              "summary": "A brief one-sentence summary of the outfit style",
                                                  "categories": [
                                                          {
                                                                      "name": "Category name (e.g., Top, Bottom, Shoes, Accessories)",
                                                                                  "icon": "Single emoji representing this category",
                                                                                              "searchQuery": "Specific search query for Google Shopping to find this item",
                                                                                                          "priceRange": "estimated price range like $30-$80"
                                                                                                                  }
                                                                                                                      ]
                                                                                                                      }
                                                                                                                      
                                                                                                                      Include 3-5 relevant categories. Make search queries specific with style descriptors, colors, and materials mentioned in the description.`
                        }]
          });

          const content = message.content[0].text;

          // Parse JSON - handle potential markdown code blocks
          let jsonStr = content;
              if (content.includes('```')) {
                            jsonStr = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
              }

          const outfitPlan = JSON.parse(jsonStr);
              return res.status(200).json(outfitPlan);

    } catch (error) {
              console.error('Analyze error:', error);
              return res.status(500).json({
                            error: error.message || 'Failed to analyze outfit'
              });
    }
}
