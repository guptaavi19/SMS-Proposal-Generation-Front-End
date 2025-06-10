import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import axios, { AxiosResponse } from "axios";
import _ from "lodash";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

http.interceptors.response.use(
  (response: AxiosResponse) => {
    // Convert response data keys to camelCase
    response.data = convertKeysToCamelCase(response.data);
    return response;
  },
  (e) => {
    return Promise.reject(e);
  }
);

// Function to recursively convert keys to camelCase
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
