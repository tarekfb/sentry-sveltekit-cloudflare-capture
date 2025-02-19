import type { Handle, HandleServerError, RequestEvent } from '@sveltejs/kit'
import type { Captured } from '../../types/Captured.js'
import { initSentry } from '../initSentry.js'

export type HandleWrappers = {
  onHandle: (handle?: Handle) => Handle
  onError: Captured<HandleServerError>,
  getSentry: (event: RequestEvent) => ReturnType<typeof initSentry>
}
