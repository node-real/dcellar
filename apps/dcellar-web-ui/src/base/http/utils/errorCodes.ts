const statusCodes = {
  302: 'Resources has been temporarily moved.',
  400: 'Invalid or bad request.',
  401: 'Authorization required.',
  403: 'Forbidden due to no permission.',
  404: 'Resource not found.',
  408: 'Request time-out.',
  409: 'Conflict in the request.',
  500: 'Internal server error.',
  501: 'Method not implemented.',
  502: 'Invalid response while acting a gateway.',
  503: 'Service unavailable.',
  504: 'Gateway time-out.',
  505: 'HTTP version not supported.',
};

export const errorCodes = { ...statusCodes };

export type TErrorCodeKey = keyof typeof errorCodes;
