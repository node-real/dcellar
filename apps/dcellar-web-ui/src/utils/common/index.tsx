export const parseErrorXml = async (result: Response) => {
  try {
    const xmlText = await result.text();
    const xml = await new window.DOMParser().parseFromString(xmlText, 'text/xml');
    const code = (xml as XMLDocument).getElementsByTagName('Code')[0].textContent;
    const message = (xml as XMLDocument).getElementsByTagName('Message')[0].textContent;
    return {
      code,
      message,
    };
  } catch {
    return {
      code: null,
      message: null,
    };
  }
};