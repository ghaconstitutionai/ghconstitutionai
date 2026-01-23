import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Get user from auth header
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Authorization required')
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Get user from JWT
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)

        if (authError || !user) {
            throw new Error('Invalid token')
        }

        const method = req.method
        const url = new URL(req.url)
        const conversationId = url.searchParams.get('id')

        // GET - List all conversations
        if (method === 'GET' && !conversationId) {
            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false })

            if (error) throw error

            return new Response(
                JSON.stringify({ conversations: data }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // GET - Single conversation
        if (method === 'GET' && conversationId) {
            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .eq('id', conversationId)
                .eq('user_id', user.id)
                .single()

            if (error) throw error

            return new Response(
                JSON.stringify({ conversation: data }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // POST - Create conversation
        if (method === 'POST') {
            const { title } = await req.json()

            const { data, error } = await supabase
                .from('conversations')
                .insert({
                    user_id: user.id,
                    title: title || 'New Chat',
                })
                .select()
                .single()

            if (error) throw error

            return new Response(
                JSON.stringify({ conversation: data }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
            )
        }

        // PATCH - Update conversation
        if (method === 'PATCH' && conversationId) {
            const { title } = await req.json()

            const { data, error } = await supabase
                .from('conversations')
                .update({ title, updated_at: new Date().toISOString() })
                .eq('id', conversationId)
                .eq('user_id', user.id)
                .select()
                .single()

            if (error) throw error

            return new Response(
                JSON.stringify({ conversation: data }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // DELETE - Delete conversation
        if (method === 'DELETE' && conversationId) {
            // Delete messages first
            await supabase
                .from('messages')
                .delete()
                .eq('conversation_id', conversationId)

            // Then delete conversation
            const { error } = await supabase
                .from('conversations')
                .delete()
                .eq('id', conversationId)
                .eq('user_id', user.id)

            if (error) throw error

            return new Response(
                JSON.stringify({ success: true }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        throw new Error('Invalid request')
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})