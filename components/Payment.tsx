/* eslint-disable prettier/prettier */
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Image, Text, View } from "react-native";
import ReactNativeModal from "react-native-modal";
import { Paystack } from "react-native-paystack-webview";

import CustomButton from "@/components/CustomButton";
import { images } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { useLocationStore } from "@/store";
import { PaymentProps } from "@/types/type";

const Payment = ({
  fullName,
  email,
  amount,
  driverId,
  rideTime,
  paystackKey, // Accept paystackKey as a prop
}: PaymentProps & { paystackKey: string }) => {
  const {
    userAddress,
    userLongitude,
    userLatitude,
    destinationLatitude,
    destinationAddress,
    destinationLongitude,
  } = useLocationStore();

  const [success, setSuccess] = useState<boolean>(false);

  const handlePaystackSuccess = async (response: any) => {
    setSuccess(true);

    try {
      await fetchAPI("/(api)/ride/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          origin_address: userAddress,
          destination_address: destinationAddress,
          origin_latitude: userLatitude,
          origin_longitude: userLongitude,
          destination_latitude: destinationLatitude,
          destination_longitude: destinationLongitude,
          ride_time: rideTime.toFixed(0),
          fare_price: parseInt(amount) * 100,
          payment_status: "paid",
          driver_id: driverId,
          user_id: response.reference, // Store transaction reference
        }),
      });
    } catch (err) {
      console.error("Payment error:", err); // Log the error for debugging
      Alert.alert("Error", "There was an issue processing your payment.");
    }
  };

  const handlePaystackCancel = () => {
    Alert.alert("Payment Cancelled", "You have cancelled the payment.");
    setSuccess(false); // Close the modal or handle UI changes
  };

  return (
    <>
      <CustomButton
        title="Confirm Ride"
        className="my-10"
        onPress={() => setSuccess(true)}
      />

      {success && (
        <Paystack
          paystackKey={paystackKey} // Use the passed Paystack public key
          amount={Number(amount) * 100 || 0}
          billingEmail={email}
          billingName={fullName}
          currency=""
          onSuccess={handlePaystackSuccess}
          onCancel={handlePaystackCancel}
          autoStart={true}
        />
      )}

      <ReactNativeModal
        isVisible={success}
        onBackdropPress={() => setSuccess(false)}
      >
        <View className="flex flex-col items-center justify-center bg-white p-7 rounded-2xl">
          <Image source={images.check} className="w-28 h-28 mt-5" />

          <Text className="text-2xl text-center font-JakartaBold mt-5">
            Booking placed successfully
          </Text>

          <Text className="text-md text-general-200 font-JakartaRegular text-center mt-3">
            Thank you for your booking. Your reservation has been successfully
            placed. Please proceed with your trip.
          </Text>

          <CustomButton
            title="Back Home"
            onPress={() => {
              setSuccess(false);
              router.push("/(root)/(tabs)/home");
            }}
            className="mt-5"
          />
        </View>
      </ReactNativeModal>
    </>
  );
};

export default Payment;