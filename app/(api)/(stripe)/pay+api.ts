import { Stripe } from "stripe";
import Constants from "expo-constants";

const stripe = new Stripe(Constants?.expoConfig?.extra?.stripeSecretKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { payment_method_id, payment_intent_id, customer_id, client_secret } =
      body;

    if (!payment_method_id || !payment_intent_id || !customer_id) {
      
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 },
      );
    }

    const paymentMethod = await stripe.paymentMethods.attach(
      payment_method_id,
      { customer: customer_id },
    );

    const result = await stripe.paymentIntents.confirm(payment_intent_id, {
      payment_method: paymentMethod.id,
    });

    // console.log("Pay api===>", result)

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment successful",
        result: result,
      }),
    );
  } catch (error) {
    console.log("PAY_API Error paying:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}