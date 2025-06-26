import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CheckoutRequest {
  productId: string
  successUrl: string
  cancelUrl: string
  promotionCode?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user from the request
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Parse request body
    const { productId, successUrl, cancelUrl, promotionCode }: CheckoutRequest = await req.json()

    if (!productId || !successUrl || !cancelUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get the default price for the product
    const product = await stripe.products.retrieve(productId, {
      expand: ['default_price']
    })

    if (!product.default_price) {
      return new Response(
        JSON.stringify({ error: 'Product has no default price' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const priceId = typeof product.default_price === 'string' 
      ? product.default_price 
      : product.default_price.id

    // Handle promotion code if provided
    let discounts: Array<{ promotion_code: string }> = []
    if (promotionCode && promotionCode.trim()) {
      try {
        // List promotion codes to find the one with the matching code
        const promotionCodes = await stripe.promotionCodes.list({
          code: promotionCode.trim(),
          active: true,
          limit: 1,
        })

        if (promotionCodes.data.length === 0) {
          return new Response(
            JSON.stringify({ error: 'Invalid or expired promotion code' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        const promoCode = promotionCodes.data[0]
        
        // Check if the promotion code is still valid
        if (!promoCode.active) {
          return new Response(
            JSON.stringify({ error: 'Promotion code is no longer active' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        // Check expiration date
        if (promoCode.expires_at && promoCode.expires_at < Math.floor(Date.now() / 1000)) {
          return new Response(
            JSON.stringify({ error: 'Promotion code has expired' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        // Check usage limits
        if (promoCode.max_redemptions && promoCode.times_redeemed >= promoCode.max_redemptions) {
          return new Response(
            JSON.stringify({ error: 'Promotion code has reached its usage limit' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        discounts = [{ promotion_code: promoCode.id }]
        console.log('Applied promotion code:', promoCode.code)
      } catch (error) {
        console.error('Error validating promotion code:', error)
        return new Response(
          JSON.stringify({ error: 'Error validating promotion code' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // Get or create Stripe customer
    let customerId: string

    // Check if user already has a Stripe customer ID
    const { data: profile } = await supabaseClient
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (profile?.stripe_customer_id) {
      customerId = profile.stripe_customer_id
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id

      // Save customer ID to user profile
      await supabaseClient
        .from('user_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id)
    }

    // Create Checkout Session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: user.id,
        product_id: productId,
      },
    }

    // Add discounts if promotion code was provided and validated
    if (discounts.length > 0) {
      sessionParams.discounts = discounts
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})