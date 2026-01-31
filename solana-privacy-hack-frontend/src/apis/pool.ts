import axios from "axios";
import { envConfig } from "../utils/config";

export const requestDepositTx = async (wallet_address: string, amount: number) => {
  try {
    const response = await axios.post(`${envConfig.baseUrl}/deposit`, {
      wallet_address,
      amount,
    });
    return response.data;
  } catch (error) {
    console.error("Error requesting deposit transaction:", error);
    throw error;
  }
};

export const requestWithdrawTx = async (wallet_address: string, amount: number) => {
  try {
    const response = await axios.post(`${envConfig.baseUrl}/withdraw`, {
      wallet_address,
      amount,
    });
    return response.data;
  } catch (error) {
    console.error("Error requesting withdraw transaction:", error);
    throw error;
  }
};

export const getBalance = async (wallet: string) => {
  try {
    const response = await axios.get(`${envConfig.baseUrl}/balance`, {
      params: { wallet },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching balance:", error);
    throw error;
  }
};
