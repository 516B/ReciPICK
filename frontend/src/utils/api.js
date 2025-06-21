import axios from "axios";

const hostname = window.location.hostname;

const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

const baseURL = isLocalhost
  ? "http://localhost:8000"
  : "http://192.168.123.175:8000"; // PC IP
  
const api = axios.create({
  baseURL,
  withCredentials: true, 
});
export default api;
