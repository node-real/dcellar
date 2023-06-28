import { ErrorMsg } from "@/facade/error";

export const getDomain = (): [string|null, ErrorMsg?] => {
  if (typeof window === 'undefined') {
    return [null, 'getDomain() must be called from the browser'];
  }

  return [window.location.origin];
};