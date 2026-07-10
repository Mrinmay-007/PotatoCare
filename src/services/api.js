// src/services/api.js

import axios from "axios";

const api = axios.create({
  baseURL: "https://server-511b3f14.fastapicloud.dev",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;