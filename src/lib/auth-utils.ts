/**
 * Safely encodes a string to base64, supporting Unicode characters.
 */
export const safeEncode = (str: string): string => {
  try {
    // Convert to UTF-8 then to base64
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }));
  } catch (e) {
    console.error('Encoding error:', e);
    return '';
  }
};

/**
 * Safely decodes a base64 string, supporting Unicode characters.
 */
export const safeDecode = (str: string): string => {
  try {
    // Convert from base64 then from UTF-8
    return decodeURIComponent(Array.prototype.map.call(atob(str), (c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  } catch (e) {
    console.error('Decoding error:', e);
    return '';
  }
};
