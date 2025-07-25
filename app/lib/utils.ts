import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import axios, { AxiosResponse } from "axios";
import _ from "lodash";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ✅ Base URL setup for both SSR (Node) and browser (Vite)
const baseURL =
  typeof window === "undefined"
    ? process.env.API_URL || "http://localhost:8000" // fallback for SSR
    : import.meta.env.VITE_API_URL;

export const http = axios.create({
  baseURL: "http://localhost:8000",
  withCredentials: true, // ✅ include cookies like access_token
});

// ✅ Intercept and convert all response keys to camelCase
http.interceptors.response.use(
  (response: AxiosResponse) => {
    response.data = convertKeysToCamelCase(response.data);
    return response;
  },
  (e) => {
    return Promise.reject(e);
  }
);

// ✅ Utility to convert keys to camelCase recursively
export const convertKeysToCamelCase = (obj: any): any => {
  if (_.isPlainObject(obj)) {
    return Object.keys(obj).reduce(
      (result: { [key: string]: any }, key: string) => {
        const camelKey = _.camelCase(key);
        result[camelKey] = convertKeysToCamelCase(obj[key]);
        return result;
      },
      {}
    );
  } else if (_.isArray(obj)) {
    return obj.map((item: any) => convertKeysToCamelCase(item));
  }
  return obj;
};
