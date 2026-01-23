import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `You are Ghana Legal AI, an expert assistant specializing in Ghana's 1992 Constitution.

Your role:
- Answer questions about Ghana's Constitution accurately
- Cite specific Articles, Chapters, and Sections when relevant
- Explain legal concepts in simple, clear language

Guidelines:
- Always reference the Constitution when applicable
- If unsure, say so rather than making up information
- Keep answers focused and concise

BASIC FACTS:
- The Constitution has 26 Chapters and 299 Articles
- It also has a Preamble and 36 Transitional Provisions
- It came into force on January 7, 1993

ABOUT YOU:
- Created by Joel, a young Ghanaian AI enthusiast
- Powered by Ghana Legal AI`

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { conversation_id, message } = await req.json()

        if (!conversation_id || !message) {
            throw new Error('conversation_id and message are required')
        }

        // Get auth header
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Authorization required')
        }

        // Create Supabase clients
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Step 1: Get embedding for the query
        const embeddingResponse = await fetch('https://openrouter.ai/api/v1/embeddings', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'openai/text-embedding-3-small',
                input: message,
            }),
        })

        if (!embeddingResponse.ok) {
            throw new Error('Failed to generate embedding')
        }

        const embeddingData = await embeddingResponse.json()
        const embedding = embeddingData.data[0].embedding

        // Step 2: Search for relevant constitution articles
        const { data: sources, error: searchError } = await supabase.rpc(
            'search_constitution',
            {
                query_embedding_str: JSON.stringify(embedding),
                match_count: 5,
                filter_country: 'ghana',
            }
        )

        if (searchError) {
            console.error('Search error:', searchError)
        }

        // Step 3: Build context from sources
        let context = ''
        if (sources && sources.length > 0) {
            context = '\n\nRelevant Constitutional Provisions:\n'
            sources.forEach((source: any) => {
                context += `\n---\nArticle ${source.article_number} (Chapter ${source.chapter_number}: ${source.chapter_title}):\n${source.article_text}\n`
            })
        }

        // Step 4: Get chat history
        const { data: history } = await supabase
            .from('messages')
            .select('role, content')
            .eq('conversation_id', conversation_id)
            .order('created_at', { ascending: true })
            .limit(10)

        // Build messages array
        const messages = [
            { role: 'system', content: SYSTEM_PROMPT + context },
        ]

        // Add history
        if (history) {
            history.forEach((msg: any) => {
                messages.push({ role: msg.role, content: msg.content })
            })
        }

        // Add current message
        messages.push({ role: 'user', content: message })

        // Step 5: Call Groq for AI response
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: messages,
                max_tokens: 2048,
                temperature: 0.7,
            }),
        })

        if (!groqResponse.ok) {
            const error = await groqResponse.text()
            throw new Error(`Groq API error: ${error}`)
        }

        const groqData = await groqResponse.json()
        const aiResponse = groqData.choices[0].message.content

        // Step 6: Save messages to database
        const now = new Date().toISOString()

        const { data: userMsg } = await supabase
            .from('messages')
            .insert({
                conversation_id,
                role: 'user',
                content: message,
                created_at: now,
            })
            .select('id')
            .single()

        const { data: assistantMsg } = await supabase
            .from('messages')
            .insert({
                conversation_id,
                role: 'assistant',
                content: aiResponse,
                sources: sources ? JSON.stringify(sources) : null,
                created_at: now,
            })
            .select('id')
            .single()

        // Update conversation updated_at
        await supabase
            .from('conversations')
            .update({ updated_at: now })
            .eq('id', conversation_id)

        return new Response(
            JSON.stringify({
                response: aiResponse,
                sources: sources || [],
                user_message_id: userMsg?.id,
                assistant_message_id: assistantMsg?.id,
                created_at: now,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        console.error('Chat error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})