import type { Handle, HandleServerError, RequestEvent } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'
import type { Captured } from '../types/Captured.js'
import { initSentry } from './initSentry.js'
import { instrumentHandle } from './instrumentHandle.js'
import type { HandleWrappers } from './types/HandleWrappers.js'
import type { InitOptions } from './types/InitOptions.js'
import { defaultErrorHandler } from './util/defaultErrorHandler.js'
import { isNotFoundError } from './util/isNotFoundError.js'
import { EventHint } from '@sentry/core'

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

  const sentryHandle: Handle = (input) => {
    const sentryHandleOption = { input, init, handleOptions }
    return instrumentHandle(sentryHandleOption)
  }

  const onHandle = (handle?: Handle) =>
    handle ? sequence(sentryHandle, handle) : sentryHandle

  const getSentry = (event: RequestEvent) => {
    return init(event)
  }

  const onError: Captured<HandleServerError> = (handleError = defaultErrorHandler) => {
    const handleErrorWithSentry = (input: {
      error: unknown;
      event: RequestEvent;
      status: number;
      message: string;
      hints?: Omit<EventHint, "captureContext">,
    }) => {
      if (isNotFoundError(input)) {
        return handleError(input)
      }

      const Sentry = init(input.event)

      const result = Sentry.captureException(input.error, input.hints)

      return handleError(input, result)
    }

    return handleErrorWithSentry;
  }

  return {
    onHandle,
    onError,
    getSentry,
  }
}
