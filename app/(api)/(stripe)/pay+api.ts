/* eslint-disable prettier/prettier */
import fetch from "node-fetch";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;

interface PaystackConfirmPaymentResponse {
  status: boolean;
  message: string;
  data: {
    status: string;
    reference: string;
    amount: number;
    gateway_response: string;
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { payment_intent_id } = body;

    if (!payment_intent_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    // Confirm the payment
    const confirmPaymentResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${payment_intent_id}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const confirmPaymentData =
      (await confirmPaymentResponse.json()) as PaystackConfirmPaymentResponse;
    if (!confirmPaymentData.status) {
      return new Response(
        JSON.stringify({ error: confirmPaymentData.message }),
        {
          status: 400,
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment successful",
        result: confirmPaymentData.data,
      })
    );
  } catch (error) {
    console.error("Error confirming payment:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}



