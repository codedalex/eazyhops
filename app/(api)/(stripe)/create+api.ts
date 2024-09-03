/* eslint-disable prettier/prettier */
import axios from "axios";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, amount } = body;

  if (!name || !email || !amount) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
    });
  }

  try {
    // Check if the customer exists
    const customerResponse = await axios.get(
      `https://api.paystack.co/customer`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
        params: {
          email,
        },
      }
    );

    let customer;
    if (customerResponse.data.data.length > 0) {
      customer = customerResponse.data.data[0];
    } else {
      // If customer doesn't exist, create a new one
      const newCustomerResponse = await axios.post(
        `https://api.paystack.co/customer`,
        {
          email,
          first_name: name.split(" ")[0],
          last_name: name.split(" ")[1] || "",
        },
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          },
        }
      );
      customer = newCustomerResponse.data.data;
    }

    // Create a payment request
    const paymentResponse = await axios.post(
      `https://api.paystack.co/transaction/initialize`,
      {
        email: customer.email,
        amount: parseInt(amount) * 100, // Paystack amount is in kobo (cents)
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    return new Response(
      JSON.stringify({
        authorization_url: paymentResponse.data.data.authorization_url,
        access_code: paymentResponse.data.data.access_code,
        reference: paymentResponse.data.data.reference,
      })
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error with Paystack:", error.message);
      return new Response(
        JSON.stringify({
          error: "Failed to create payment request",
          details: error.message,
        }),
        {
          status: 500,
        }
      );
    } else {
      console.error("Unexpected error:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to create payment request",
          details: "An unknown error occurred",
        }),
        {
          status: 500,
        }
      );
    }
  }
}
