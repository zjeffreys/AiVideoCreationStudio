import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    // Initialize Supabase client with service role key for admin operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the signature from the header
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      return new Response('No signature', { status: 400 })
    }

    // Get the raw body
    const body = await req.text()
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    if (!webhookSecret) {
      console.error('Stripe webhook secret not configured')
      return new Response('Webhook secret not configured', { status: 500 })
    }

    // Verify the webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response('Invalid signature', { status: 400 })
    }

    console.log('Processing webhook event:', event.type)

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session, supabaseClient)
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionChange(subscription, supabaseClient, stripe)
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCanceled(subscription, supabaseClient)
        break
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(invoice, supabaseClient)
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice, supabaseClient)
        break
      }
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: 'Webhook handler failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  supabaseClient: any
) {
  console.log('Handling checkout completed:', session.id)
  
  const userId = session.metadata?.user_id
  if (!userId) {
    console.error('No user_id in session metadata')
    return
  }

  // Update user profile with subscription info
  const { error } = await supabaseClient
    .from('user_profiles')
    .update({
      stripe_customer_id: session.customer,
      subscription_start_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (error) {
    console.error('Error updating user profile after checkout:', error)
  } else {
    console.log('Successfully updated user profile after checkout')
  }
}

async function handleSubscriptionChange(
  subscription: Stripe.Subscription,
  supabaseClient: any,
  stripe: Stripe
) {
  console.log('Handling subscription change:', subscription.id)

  // Get customer to find the user
  const customer = await stripe.customers.retrieve(subscription.customer as string)
  if (!customer || customer.deleted) {
    console.error('Customer not found')
    return
  }

  const userId = (customer as Stripe.Customer).metadata?.supabase_user_id
  if (!userId) {
    console.error('No supabase_user_id in customer metadata')
    return
  }

  // Determine membership type based on subscription
  let membershipType = 'free'
  if (subscription.status === 'active') {
    // Check the price ID to determine membership type
    const priceId = subscription.items.data[0]?.price.id
    if (priceId === Deno.env.get('STRIPE_EARLY_ADOPTER_LIFETIME_PRICE_ID')) {
      membershipType = 'early_adopter'
    } else {
      membershipType = 'paid'
    }
  }

  // Update user profile
  const { error } = await supabaseClient
    .from('user_profiles')
    .update({
      membership_type: membershipType,
      stripe_subscription_id: subscription.id,
      subscription_start_date: subscription.status === 'active' 
        ? new Date(subscription.current_period_start * 1000).toISOString()
        : null,
      subscription_end_date: subscription.status === 'active'
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (error) {
    console.error('Error updating user profile after subscription change:', error)
  } else {
    console.log('Successfully updated user profile after subscription change')
  }
}

async function handleSubscriptionCanceled(
  subscription: Stripe.Subscription,
  supabaseClient: any
) {
  console.log('Handling subscription canceled:', subscription.id)

  // Find user by subscription ID
  const { data: profile, error: findError } = await supabaseClient
    .from('user_profiles')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (findError || !profile) {
    console.error('User not found for canceled subscription:', subscription.id)
    return
  }

  // Update user profile to free tier
  const { error } = await supabaseClient
    .from('user_profiles')
    .update({
      membership_type: 'free',
      stripe_subscription_id: null,
      subscription_start_date: null,
      subscription_end_date: null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', profile.user_id)

  if (error) {
    console.error('Error updating user profile after subscription cancellation:', error)
  } else {
    console.log('Successfully updated user profile after subscription cancellation')
  }
}

async function handlePaymentSucceeded(
  invoice: Stripe.Invoice,
  supabaseClient: any
) {
  console.log('Handling payment succeeded:', invoice.id)
  // Additional logic for successful payments if needed
}

async function handlePaymentFailed(
  invoice: Stripe.Invoice,
  supabaseClient: any
) {
  console.log('Handling payment failed:', invoice.id)
  // Additional logic for failed payments if needed
  // You might want to notify the user or update their status
}