import { ModuleMetadata, Type } from '@nestjs/common'
import { ImapFlowOptions } from 'imapflow'

export interface ImapflowModuleOptions {
  config: {
    id: string
    name: string
    imap?: ImapFlowOptions
  }[]
}

export interface ImapflowModuleOptionsFactory {
  createImapflowModuleOptions(): Promise<ImapflowModuleOptions> | ImapflowModuleOptions
}

export interface ImapflowModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  inject?: any[]
  useClass?: Type<ImapflowModuleOptionsFactory>
  useExisting?: Type<ImapflowModuleOptionsFactory>
  useFactory?: (...args: any[]) => Promise<ImapflowModuleOptions> | ImapflowModuleOptions
}
