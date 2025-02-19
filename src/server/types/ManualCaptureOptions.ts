/**
 * Options for manual error capture
 *
 * @property {string} eventId - The Sentry event ID
 * @property {string} message - The error message
 * @property {string} environment - The environment where the error occurred
 * @property {unknown} [error] - The error object
 */
export type ManualCaptureOptions = {
    eventId: string;
    message: string;
    environment: string;
    error?: unknown;
};
