import { Inject } from '@nestjs/common'
import { getImapflowConnectionToken } from './imapflow.utils'

// noinspection JSUnusedGlobalSymbols
export const InjectImapflow = (connection?: string) => {
  return Inject(getImapflowConnectionToken(connection))
}
