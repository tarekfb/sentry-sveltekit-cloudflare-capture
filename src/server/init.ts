import type { Handle, HandleServerError, RequestEvent } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'
import type { Captured } from '../types/Captured.js'
import { initSentry } from './initSentry.js'
import { instrumentHandle } from './instrumentHandle.js'
import type { HandleWrappers } from './types/HandleWrappers.js'
import type { InitOptions } from './types/InitOptions.js'
import { defaultErrorHandler } from './util/defaultErrorHandler.js'
import { isNotFoundError } from './util/isNotFoundError.js'
import { Toucan } from 'toucan-js'

export const init = (
  /**
   * Sentry DSN
   * @see https://docs.sentry.io/product/sentry-basics/dsn-explainer/
   */
  dsn: string,
  /**
   * Server Init Options
   */
  options?: InitOptions
): HandleWrappers => {
  const { handleOptions, toucanOptions } = options ?? {}

  const init = (event: RequestEvent) =>
    initSentry(event.request, {
      tracesSampleRate: 1.0,
      dsn,
      ...toucanOptions
    })

  const manualCaptureEvent = () => {
    const sentry = new Toucan({
      requestDataOptions: {
        allowedHeaders: [
          'user-agent',
          'cf-challenge',
          'accept-encoding',
          'accept-language',
          'cf-ray',
          'content-length',
          'content-type',
          'x-real-ip',
          'host'
        ],
        allowedSearchParams: /(.*)/
      },
    })
    
    return sentry.captureEvent;
  }

  const sentryHandle: Handle = (input) => {
    const sentryHandleOption = { input, init, handleOptions }
    return instrumentHandle(sentryHandleOption)
  }

  const onHandle = (handle?: Handle) =>
    handle ? sequence(sentryHandle, handle) : sentryHandle

  const onError: Captured<HandleServerError> =
    (handleError = defaultErrorHandler) =>
      (input) => {
        if (isNotFoundError(input)) {
          return handleError(input)
        }

        const Sentry = init(input.event)

        const result = Sentry.captureException(input.error)

        return handleError(input, result)
      }

  return {
    onHandle,
    onError,
    manualCaptureEvent,
  }
}
