import type { Handle, HandleServerError } from '@sveltejs/kit'
import type { Captured } from '../../types/Captured.js'
import { ManualCaptureOptions } from './ManualCaptureOptions.js'

export type HandleWrappers = {
  onHandle: (handle?: Handle) => Handle
  onError: Captured<HandleServerError>,
  manualCaptureEvent?: (options: ManualCaptureOptions) => void
}
