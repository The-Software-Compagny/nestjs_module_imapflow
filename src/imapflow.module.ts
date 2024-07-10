import { DynamicModule, Global, Module } from '@nestjs/common'
import { ImapflowModuleAsyncOptions, ImapflowModuleOptions } from './imapflow.interfaces'
import { ImapflowCoreModule } from './imapflow.core-module'

@Global()
@Module({})
export class ImapflowModule {
  // noinspection JSUnusedGlobalSymbols
  public static forRoot(options: ImapflowModuleOptions, connection?: string): DynamicModule {
    return {
      module: ImapflowModule,
      imports: [ImapflowCoreModule.forRoot(options, connection)],
      exports: [ImapflowCoreModule],
    }
  }

  public static forRootAsync(options: ImapflowModuleAsyncOptions, connection?: string): DynamicModule {
    return {
      module: ImapflowModule,
      imports: [ImapflowCoreModule.forRootAsync(options, connection)],
      exports: [ImapflowCoreModule],
    }
  }
}
