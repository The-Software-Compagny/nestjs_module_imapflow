import { Logger } from '@nestjs/common'
import { IMAPFLOW_MODULE_CONNECTION, IMAPFLOW_MODULE_CONNECTION_TOKEN, IMAPFLOW_MODULE_OPTIONS_TOKEN } from './imapflow.constants'
import { ImapflowModuleOptions } from './imapflow.interfaces'
import { ImapFlow, ImapFlowOptions } from 'imapflow'

const connectors = new Map<string, () => Promise<ImapFlow>>()

export function getImapflowOptionsToken(connection: string): string {
  return `${connection || IMAPFLOW_MODULE_CONNECTION}_${IMAPFLOW_MODULE_OPTIONS_TOKEN}`
}

export function getImapflowConnectionToken(connection: string): string {
  return `${connection || IMAPFLOW_MODULE_CONNECTION}_${IMAPFLOW_MODULE_CONNECTION_TOKEN}`
}

interface InternalImapLogEntry {
  level: 'debug' | 'info' | 'warn' | 'error'
  t: number
  cid: string
  lo: number
  src: string
  msg: string
  nullBytesRemoved: undefined
  comment?: string
}

function onImapLog(accountId: string, entry: InternalImapLogEntry) {
  let msg = `${entry.cid} ${entry.src || ''} ${entry.msg || ''}`
  if (entry.comment) {
    msg += ` : ${entry.comment}`
  }
  switch (entry.level) {
    case 'debug': {
      Logger.debug(msg, `ImapflowModule/onImapLog/${accountId}`)
      break
    }

    case 'info': {
      Logger.log(msg, `ImapflowModule/onImapLog/${accountId}`)
      break
    }

    case 'warn': {
      Logger.warn(msg, `ImapflowModule/onImapLog/${accountId}`)
      break
    }

    case 'error': {
      Logger.error(msg, `ImapflowModule/onImapLog/${accountId}`)
      break
    }
  }
}

export async function createImapflowConnection(options: ImapflowModuleOptions) {
  for (const account of options.config) {
    try {
      if (!account.imap) {
        Logger.warn(`ImapflowModule/createImapflowConnection/${account.id} - imap config not found`)
        continue
      }
      // noinspection JSUnresolvedReference
      const client = new ImapFlow({
        ...account.imap,
        emitLogs: true,
        logger: false,
        clientInfo: {
          name: process.env.npm_package_name.split('/').pop(),
          version: process.env.npm_package_version,
          vendor: process.env.npm_package_name.split('/').shift().replace(/^@/, ''),
          'support-url': null,
        },
        // maxIdleTime: account.imap.maxIdleTime || 30 * 60 * 1000,
        maxIdleTime: 3 * 1000,
      } as ImapFlowOptions & {
        maxIdleTime: number
      })
      client.idling = true
      client.on('log', (entry: InternalImapLogEntry) => onImapLog(account.id, entry))
      // client.on('flags', (data) => console.log('flags', data))
      // client.on('mailboxClose', (data) => console.log('mailboxClose', data))
      // client.on('mailboxOpen', (data) => console.log('mailboxOpen', data))
      // client.on('exists', (data) => console.log('exists', data))
      client.on('close', () => Logger.verbose(`ImapflowModule/createImapflowConnection/${account.id} - closed`))
      client.on('error', () => Logger.verbose(`ImapflowModule/createImapflowConnection/${account.id} - error`))
      await client.connect()
      Logger.verbose(`ImapflowModule/createImapflowConnection/${account.id} - connected`)
      connectors.set(account.id, () => {
        return new Promise((resolve, reject) => {
          client
            .idle()
            .then(() => resolve(client))
            .catch((error) => {
              console.log('error', error)
              client
                .connect()
                .then(() => resolve(client))
                .catch((error) => reject(error))
            })
        })
      })
      Logger.verbose(`ImapflowModule/createImapflowConnection/${account.id}`)
    } catch (error) {
      console.log('error', error)
      Logger.error(error.message, error.stack, `ImapflowModule/createImapflowConnection/${account.id}`)
    }
  }
  return connectors
}
