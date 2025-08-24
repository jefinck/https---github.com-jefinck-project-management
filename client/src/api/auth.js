import axios from "axios";

export const loginUser = async (credentials) => {
  const response = await axios.post("http://localhost:5000/api/auth/login", credentials);
  return response.data;
};
