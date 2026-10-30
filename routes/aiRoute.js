import express from 'express'
import itemModel from '../models/itemModel.js'

const aiRouter = express.Router()

const OPENAI_URL = 'https://api.openai.com/v1/responses'
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-6-luna'

const buildMenuContext = (items) => {
  if (!items.length) return 'The restaurant menu database currently has no items.'

  return items.map((item) => {
    return [
      `Name: ${item.name}`,
      `Category: ${item.category}`,
      `Price: ₹${item.price}`,
      `Rating: ${item.rating ?? 0}`,
      `Description: ${item.description}`,
    ].join(' | ')
  }).join('\n')
}

const extractOutputText = (data) => {
  if (typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text.trim()

  const text = (data.output || [])
    .flatMap((item) => item.content || [])
    .filter((content) => content.type === 'output_text' && content.text)
    .map((content) => content.text)
    .join('\n')

  return text.trim()
}

aiRouter.post('/chat', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'AI is not configured yet. Add OPENAI_API_KEY to backend/.env and restart the server.',
      })
    }

    const message = typeof req.body.message === 'string' ? req.body.message.trim() : ''
    const history = Array.isArray(req.body.history) ? req.body.history : []

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required.' })
    }

    if (message.length > 500) {
      return res.status(400).json({ success: false, message: 'Message is too long. Please keep it under 500 characters.' })
    }

    const items = await itemModel.find({}).select('name description category price rating').lean()
    const menuContext = buildMenuContext(items)

    const safeHistory = history
      .filter((item) => item && ['user', 'assistant'].includes(item.role) && typeof item.content === 'string')
      .slice(-10)
      .map((item) => ({
        role: item.role,
        content: item.content.slice(0, 1000),
      }))

    const instructions = `You are the friendly AI customer assistant for a restaurant website.

Your job:
- Help customers understand the restaurant menu.
- Recommend food based on the customer's request, budget, category, rating, or description.
- Answer questions about prices and menu categories using ONLY the menu data supplied below.
- If the customer asks about something not present in the menu data, say you do not have that information instead of inventing it.
- Never invent prices, ingredients, availability, discounts, delivery times, opening hours, policies, or allergens.
- Be concise, warm, and helpful.
- Use Indian Rupee formatting such as ₹500 when discussing prices.
- If asked for recommendations, give 2-4 relevant choices when possible.
- If the user asks about allergens or medical dietary safety, clearly say they should confirm directly with the restaurant because the database may not contain complete allergen information.

CURRENT MENU DATABASE:
${menuContext}`

    const input = [
      ...safeHistory,
      { role: 'user', content: message },
    ]

    const openaiResponse = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        instructions,
        input,
        max_output_tokens: 500,
      }),
    })

    const data = await openaiResponse.json()

    if (!openaiResponse.ok) {
      console.error('OpenAI API error:', data)
      return res.status(502).json({
        success: false,
        message: data?.error?.message || 'The AI service returned an error.',
      })
    }

    const reply = extractOutputText(data)

    if (!reply) {
      return res.status(502).json({ success: false, message: 'The AI returned an empty response.' })
    }

    res.json({ success: true, reply })
  } catch (error) {
    console.error('AI route error:', error)
    res.status(500).json({ success: false, message: 'Unable to process the AI request right now.' })
  }
})

export default aiRouter
