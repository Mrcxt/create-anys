import axios from "axios";
import type { AxiosInstance, AxiosError, AxiosResponse } from "axios";

interface Response<T = any> {
  code: number;
  message: string;
  data: T;
}

interface Error {
  code: number;
  message: string;
}

const service = axios.create({
  baseURL: import.meta.env.BASE_API,
  timeout: 30 * 1000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json;charset=UTF-8"
  }
});

/**  */
service.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    console.log(error);
    return Promise.reject(error);
  }
);

/**  */
service.interceptors.response.use(
  (response: AxiosResponse<Response, any>) => {
    const { code, message, data } = response.data;
    if (code === 0) {
      return data;
    } else {
      return Promise.reject(new Error(message || "Error"));
    }
  },
  (error: AxiosError<Error, any>) => {
    return Promise.reject(error);
  }
);

export default service;
